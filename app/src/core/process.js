// Contrôle des lignes et construction des déclarations (ADF / JDR) prêtes pour l'export.
import { checkNir } from './nir.js';
import { checkSiret } from './siret.js';
import { parseDate, toFr, validityEnd } from './dates.js';
import { parseResult } from './mapping.js';
import { cleanCell, normKey, slug, digitsFromCell } from './text.js';
import { checkCompetences, checkFormacodes, checkNsf, checkRs } from './codes.js';
import { templateErrors } from './catalogue.js';
import { declarationDeadline, OBLIGATION_START } from './deadlines.js';
import { stableId } from './hash.js';

export const MAX_PER_DECLARATION = 500;
export const MAX_NAME_LENGTH = 30;

const cell = (row, idx) => (idx === undefined ? '' : row[idx]);
const text = (row, idx) => cleanCell(cell(row, idx));

export function companyKey(name, siret) {
  if (siret) return `S${siret}`;
  const k = normKey(name);
  return k ? `N${k}` : '';
}

/**
 * Analyse les lignes du fichier.
 * @param {any[][]} rows lignes de données (sans l'en-tête)
 * @param {Record<string, number>} mapping colonne par champ
 * @param {Record<string, string>} formationMap intitulé normalisé → id de formation du catalogue
 * @param {object} ctx { catalogue, companies, today, unknownResult, firstRowNumber }
 */
export function analyzeRows(rows, mapping, formationMap, ctx) {
  const { catalogue, companies = {}, today, unknownResult = 'success', firstRowNumber = 2 } = ctx;
  const byId = Object.fromEntries(catalogue.map((t) => [t.id, t]));
  const trainees = [];
  rows.forEach((row, i) => {
    if (!row || row.every((c) => c === null || c === undefined || String(c).trim() === '')) return;
    const issues = [];
    const add = (field, level, message) => issues.push({ field, level, message });

    const nom = text(row, mapping.nom);
    if (!nom) add('nom', 'error', 'nom de naissance manquant');
    else if (nom.length > MAX_NAME_LENGTH) add('nom', 'error', `nom de ${nom.length} caractères : le portail en accepte 30 et interdit de le tronquer`);
    else if (/\d/.test(nom)) add('nom', 'warning', 'le nom contient des chiffres');

    const nirCheck = checkNir(cell(row, mapping.nir));
    if (nirCheck.error) add('nir', 'error', nirCheck.error);
    else if (nirCheck.warning) add('nir', 'warning', nirCheck.warning);

    const formationRaw = text(row, mapping.formation);
    const templateId = formationMap[normKey(formationRaw)] || '';
    const template = byId[templateId];
    if (!formationRaw) add('formation', 'error', 'formation manquante');
    else if (!template) add('formation', 'error', `formation « ${formationRaw} » non associée au catalogue`);

    const dateDebut = parseDate(cell(row, mapping.dateDebut));
    let dateFin = mapping.dateFin === undefined ? dateDebut : parseDate(cell(row, mapping.dateFin));
    if (!dateFin && dateDebut && mapping.dateFin !== undefined && !text(row, mapping.dateFin)) dateFin = dateDebut;
    if (!dateDebut) add('dateDebut', 'error', text(row, mapping.dateDebut) ? `date de début illisible (« ${text(row, mapping.dateDebut)} »)` : 'date de début manquante');
    if (!dateFin) add('dateFin', 'error', 'date de fin manquante ou illisible');
    if (dateDebut && dateFin && dateFin < dateDebut) add('dateFin', 'error', 'la date de fin précède la date de début');
    if (dateFin && today && dateFin > today) add('dateFin', 'error', 'formation pas encore terminée : elle ne peut pas être déclarée avant sa date de fin');
    if (dateFin && dateFin < OBLIGATION_START) add('dateFin', 'warning', 'terminée avant le 01/09/2025 : déclaration non obligatoire');

    const entreprise = text(row, mapping.entreprise);
    const rawSiret = digitsFromCell(cell(row, mapping.siret)).trim();
    const known = companies[companyKey(entreprise, '')];
    let siret = '';
    if (rawSiret) {
      const s = checkSiret(rawSiret);
      if (s.error) add('siret', 'error', s.error);
      siret = s.value;
    } else if (entreprise && known?.siret) {
      siret = known.siret;
    } else if (entreprise) {
      add('siret', 'error', `SIRET manquant pour « ${entreprise} » (renseignez-le une fois dans l'onglet Entreprises)`);
    }

    const resultRaw = text(row, mapping.resultat);
    let result = mapping.resultat === undefined ? unknownResult : parseResult(resultRaw);
    if (mapping.resultat !== undefined && result === 'unknown') {
      if (resultRaw) add('resultat', 'warning', `résultat « ${resultRaw} » non reconnu : considéré comme ${unknownResult === 'success' ? 'réussi' : 'non évalué'}`);
      result = unknownResult;
    }

    const emailEntreprise = text(row, mapping.emailEntreprise) || known?.email || '';

    trainees.push({
      rowNumber: firstRowNumber + i,
      nom, prenom: text(row, mapping.prenom), nir: nirCheck.value,
      formationRaw, templateId, dateDebut, dateFin, result,
      entreprise, siret, emailEntreprise, session: text(row, mapping.session),
      issues,
    });
  });

  // Doublons : même NIR, même formation, mêmes dates.
  const seen = new Map();
  for (const t of trainees) {
    if (!t.nir || t.issues.some((x) => x.field === 'nir' && x.level === 'error')) continue;
    const key = [t.nir, t.templateId, t.dateDebut, t.dateFin, t.session].join('|');
    if (seen.has(key)) t.issues.push({ field: 'nir', level: 'error', message: `doublon de la ligne ${seen.get(key)} (même stagiaire, même session)` });
    else seen.set(key, t.rowNumber);
  }
  return trainees;
}

export const hasError = (t) => t.issues.some((x) => x.level === 'error');

/** Erreurs de catalogue pour les formations réellement utilisées. */
export function usedTemplateErrors(trainees, catalogue) {
  const used = new Set(trainees.map((t) => t.templateId).filter(Boolean));
  const out = {};
  for (const t of catalogue) if (used.has(t.id)) {
    const errs = templateErrors(t);
    if (errs.length) out[t.id] = errs;
  }
  return out;
}

/** Détermine le type de déclaration d'un stagiaire. */
export function declarationKind(trainee, template) {
  return template.declareAs === 'JDR' && trainee.result === 'success' ? 'JDR' : 'ADF';
}

/**
 * Regroupe les stagiaires valides en déclarations (≤ 500 stagiaires par ID_DECLARATION).
 * Les identifiants sont déterministes : réexporter la même session redonne les mêmes ID,
 * ce qui permet au portail de refuser une double déclaration.
 */
export function buildDeclarations(trainees, catalogue) {
  const byId = Object.fromEntries(catalogue.map((t) => [t.id, t]));
  const groups = new Map();
  for (const t of trainees) {
    if (hasError(t)) continue;
    const template = byId[t.templateId];
    if (!template || templateErrors(template).length) continue;
    const kind = declarationKind(t, template);
    const key = [kind, template.id, t.dateDebut, t.dateFin, normKey(t.session)].join('|');
    if (!groups.has(key)) groups.set(key, { key, kind, template, dateDebut: t.dateDebut, dateFin: t.dateFin, session: t.session, trainees: [] });
    groups.get(key).trainees.push(t);
  }
  const declarations = [];
  for (const g of groups.values()) {
    const baseId = `${slug(g.template.id, 16)}_${g.kind}_${g.dateFin.replace(/-/g, '')}_${stableId(g.key, 8)}`;
    const reference = g.session
      ? cleanCell(g.session).slice(0, 280)
      : `SESSION_${slug(g.template.label, 40)}_${toFr(g.dateDebut).replace(/\//g, '')}_${toFr(g.dateFin).replace(/\//g, '')}`;
    const { deadline, label } = declarationDeadline(g.dateFin);
    const chunks = Math.ceil(g.trainees.length / MAX_PER_DECLARATION);
    for (let c = 0; c < chunks; c += 1) {
      const id = chunks > 1 ? `${baseId}_P${c + 1}` : baseId;
      declarations.push({
        id, baseId, reference: chunks > 1 ? `${reference}_P${c + 1}`.slice(0, 280) : reference,
        kind: g.kind, template: g.template, dateDebut: g.dateDebut, dateFin: g.dateFin,
        deadline, deadlineLabel: label,
        trainees: g.trainees.slice(c * MAX_PER_DECLARATION, (c + 1) * MAX_PER_DECLARATION),
      });
    }
  }
  declarations.sort((a, b) => (a.dateFin < b.dateFin ? -1 : a.dateFin > b.dateFin ? 1 : a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  return declarations;
}

function trainingFields(template) {
  const certifiante = !!template.certifiante;
  return {
    MODALITE_DISPENSE: template.modalite || '',
    COMPETENCE_TRANSFERABLE: checkCompetences(template.competences).value,
    QUALIFICATION_FORMATEUR: template.qualification || '',
    FORMATION_CERTIFIANTE: certifiante ? 'OUI' : 'NON',
    CERTIFICATION_VISEE: certifiante ? checkRs(template.rs).value : '',
    DOMAINE_FORMATION: certifiante ? '' : checkFormacodes(template.formacodes).value,
    SPECIALITE_FORMATION: certifiante ? '' : checkNsf(template.nsf).value,
  };
}

/** Transforme les déclarations en lignes CSV, par type. @returns {{ ADF: object[], JDR: object[] }} */
export function toRecords(declarations) {
  const out = { ADF: [], JDR: [] };
  for (const d of declarations) {
    const tf = trainingFields(d.template);
    const debutValidite = d.dateFin;
    const finValidite = d.template.validityMonths ? validityEnd(debutValidite, d.template.validityMonths) : '';
    for (const t of d.trainees) {
      const employer = t.siret
        ? { PRESENCE_EMPLOYEUR: 'OUI', SIRET_EMPLOYEUR: t.siret, REFERENCE_EMPLOYEUR: '' }
        : { PRESENCE_EMPLOYEUR: 'NON', SIRET_EMPLOYEUR: '', REFERENCE_EMPLOYEUR: '' };
      const common = {
        ID_DECLARATION: d.id,
        REFERENCE_DECLARATION: d.reference,
        ID_UNIQUE_PARTENAIRE: `EC${stableId(`${t.nir}|${d.baseId}`, 18)}`,
        NIR: t.nir,
        NOM_TITULAIRE: t.nom,
        ...employer,
        DATE_DEBUT_VALIDITE: toFr(debutValidite),
        DATE_FIN_VALIDITE: finValidite ? toFr(finValidite) : '',
      };
      if (d.kind === 'ADF') {
        out.ADF.push({
          ...common, ...tf,
          NOM_FORMATION: d.template.label,
          DATE_DEBUT_FORMATION: toFr(d.dateDebut),
          DATE_FIN_FORMATION: toFr(d.dateFin),
        });
      } else {
        out.JDR.push({
          ...common, ...tf,
          TYPE_JDR: d.template.jdrType || 'CERTIFICAT',
          NOM_JDR: d.template.jdrName || d.template.label,
          NOM_OPTION_SPECIALITE: '', MODE_OBTENTION: '',
          PRESENCE_FORMATION: 'OUI',
          NOM_FORMATION: d.template.label,
          DATE_DEBUT_FORMATION: toFr(d.dateDebut),
          DATE_FIN_FORMATION: toFr(d.dateFin),
          RESULTAT_OBTENU: '', MENTION_OBTENUE: '', LIEN_PREUVE: '', IDENTIFIANT_PREUVE: '',
        });
      }
    }
  }
  return out;
}

export function summarize(trainees) {
  const errors = trainees.filter(hasError).length;
  const warnings = trainees.filter((t) => !hasError(t) && t.issues.length).length;
  return { total: trainees.length, errors, warnings, valid: trainees.length - errors };
}
