// Catalogue des formations : paramètres de déclaration et de recyclage.
// Les codes (ROME, Formacode, NSF, RS) sont à recopier depuis les fiches pratiques officielles :
// https://passeport-prevention.travail-emploi.gouv.fr/espace-public/node/106
// validityMonths = validité officielle connue (remplit DATE_FIN_VALIDITE) ; recycleMonths = rythme commercial de relance.
// jdrName vide = le justificatif prend l'intitulé réel de la session (catégorie CACES, niveau SSIAP…).
import { normKey } from './text.js';
import { checkCompetences, checkFormacodes, checkNsf, checkRs } from './codes.js';

export const FICHES_URL = 'https://passeport-prevention.travail-emploi.gouv.fr/espace-public/node/106';

const base = {
  certifiante: false, rs: '', competences: '', formacodes: '', nsf: '',
  modalite: 'PRESENTIEL', qualification: '', unitPrice: 0, custom: false,
};

export const DEFAULT_CATALOGUE = [
  {
    ...base, id: 'sst', label: 'Sauveteur secouriste du travail (SST)', jdrName: 'Sauveteur secouriste du travail',
    match: ['sst', 'sauveteur secouriste', 'secouriste du travail'], exclude: ['mac', 'recyclage', 'maintien', 'formateur'],
    declareAs: 'JDR', jdrType: 'CERTIFICAT', validityMonths: 24, recycleMonths: 24, recycleLabel: 'MAC SST',
    source: 'Certificat SST valable 24 mois, prolongé par un MAC (INRS).',
  },
  {
    ...base, id: 'mac-sst', label: 'MAC SST (maintien et actualisation des compétences)', jdrName: 'Sauveteur secouriste du travail',
    match: ['mac sst', 'recyclage sst', 'maintien et actualisation', 'mac'], exclude: ['formateur', 'prap', 'aps'],
    declareAs: 'JDR', jdrType: 'CERTIFICAT', validityMonths: 24, recycleMonths: 24, recycleLabel: 'MAC SST',
    source: 'Certificat SST valable 24 mois, prolongé par un MAC (INRS).',
  },
  {
    ...base, id: 'prap', label: "PRAP (prévention des risques liés à l'activité physique)", jdrName: 'Acteur PRAP',
    match: ['prap'], exclude: [], declareAs: 'JDR', jdrType: 'CERTIFICAT', validityMonths: 24, recycleMonths: 24, recycleLabel: 'MAC PRAP',
    source: 'MAC PRAP tous les 24 mois (document de référence INRS). Type de justificatif à confirmer.',
  },
  {
    ...base, id: 'habilitation-electrique', label: 'Habilitation électrique', jdrName: '',
    match: ['habilitation electrique', 'habilitations electriques', 'h0b0', 'h0 b0', 'b0', 'bs be', 'br', 'b1v', 'b2v', 'bc', 'h0v'], exclude: [],
    declareAs: 'ADF', jdrType: 'HABILITATION', validityMonths: 0, recycleMonths: 36, recycleLabel: 'Recyclage habilitation électrique',
    source: "Titre délivré par l'employeur ; recyclage conseillé tous les 3 ans (INRS), pas de durée légale.",
  },
  {
    ...base, id: 'caces', label: 'CACES® (R489, R486, R485, R490…)', jdrName: '',
    match: ['caces', 'r489', 'r486', 'r485', 'r490', 'r484', 'r483', 'r487', 'r423', 'chariot', 'nacelle', 'pemp'], exclude: ['r482'],
    declareAs: 'JDR', jdrType: 'CERTIFICAT', validityMonths: 60, recycleMonths: 60, recycleLabel: 'Recyclage CACES',
    source: "CACES valable 5 ans (INRS) ; recommandation, pas une obligation légale.",
  },
  {
    ...base, id: 'caces-r482', label: 'CACES® R482 (engins de chantier)', jdrName: '',
    match: ['r482', 'engins de chantier'], exclude: [], declareAs: 'JDR', jdrType: 'CERTIFICAT', validityMonths: 120, recycleMonths: 120,
    recycleLabel: 'Recyclage CACES R482', source: 'CACES R482 valable 10 ans (INRS).',
  },
  {
    ...base, id: 'incendie', label: 'Sécurité incendie (EPI, extincteurs, évacuation)', jdrName: '',
    match: ['incendie', 'epi', 'extincteur', 'equipier de premiere intervention', 'evacuation', 'guide file', 'serre file', 'esi'], exclude: ['ssiap'],
    declareAs: 'ADF', jdrType: 'CERTIFICAT', validityMonths: 0, recycleMonths: 12, recycleLabel: 'Recyclage incendie',
    source: 'Pas de validité réglementaire ; exercices au moins tous les 6 mois (R4227-39). Rythme de relance à ajuster.',
  },
  {
    ...base, id: 'gestes-postures', label: 'Gestes et postures / manutention', jdrName: '',
    match: ['gestes et postures', 'geste et posture', 'manutention', 'tms', 'ergonomie'], exclude: ['prap'],
    declareAs: 'ADF', jdrType: 'CERTIFICAT', validityMonths: 0, recycleMonths: 24, recycleLabel: 'Recyclage gestes et postures',
    source: 'Formation « adéquate » sans périodicité légale (R4541-8). Rythme de relance à ajuster.',
  },
  {
    ...base, id: 'travail-hauteur', label: 'Travail en hauteur / port du harnais', jdrName: '',
    match: ['travail en hauteur', 'harnais', 'hauteur'], exclude: [], declareAs: 'ADF', jdrType: 'CERTIFICAT', validityMonths: 0,
    recycleMonths: 36, recycleLabel: 'Recyclage travail en hauteur',
    source: 'Renouvelée « aussi souvent que nécessaire » (R4323-106). Rythme de relance à ajuster.',
  },
  {
    ...base, id: 'aipr', label: 'AIPR (opérateur, encadrant, concepteur)', jdrName: '',
    match: ['aipr'], exclude: [], declareAs: 'ADF', jdrType: 'CERTIFICAT', validityMonths: 60, recycleMonths: 60, recycleLabel: 'Renouvellement AIPR',
    source: 'Attestation de compétences valable 5 ans (OPPBTP).',
  },
  {
    ...base, id: 'ssiap', label: 'SSIAP 1, 2 ou 3', jdrName: '',
    match: ['ssiap'], exclude: [], declareAs: 'JDR', jdrType: 'DIPLOME', validityMonths: 0, recycleMonths: 36, recycleLabel: 'Recyclage SSIAP',
    source: 'Recyclage tous les 3 ans (arrêté du 2 mai 2005, art. 7).',
  },
  {
    ...base, id: 'amiante', label: 'Amiante (sous-section 3 ou 4)', jdrName: '',
    match: ['amiante', 'ss4', 'ss3', 'sous section 4', 'sous section 3'], exclude: [], declareAs: 'ADF', jdrType: 'CERTIFICAT',
    validityMonths: 36, recycleMonths: 36, recycleLabel: 'Recyclage amiante', source: 'Recyclage au plus tard 3 ans après la formation (arrêté du 23/02/2012).',
  },
  {
    ...base, id: 'echafaudage', label: 'Échafaudage (montage, utilisation)', jdrName: '',
    match: ['echafaudage', 'r408', 'r457'], exclude: [], declareAs: 'ADF', jdrType: 'CERTIFICAT', validityMonths: 0, recycleMonths: 36,
    recycleLabel: 'Recyclage échafaudage', source: 'Renouvelée « aussi souvent que nécessaire » (R4323-69). Rythme de relance à ajuster.',
  },
];

/** Exemple illustratif du guide officiel pour le SST (à vérifier dans la fiche pratique avant un dépôt réel). */
export const GUIDE_EXAMPLE_SST = { competences: '115650/121885/400635', formacodes: '42829/42817', nsf: '344r/344p' };

export function cloneDefaults() {
  return DEFAULT_CATALOGUE.map((t) => ({ ...t, match: [...t.match], exclude: [...t.exclude] }));
}

/** Retrouve la formation du catalogue qui correspond à un intitulé libre. */
export function matchFormation(label, catalogue) {
  const key = ` ${normKey(label)} `;
  if (!key.trim()) return null;
  let best = null;
  let bestScore = 0;
  for (const t of catalogue) {
    if (normKey(t.label) === key.trim()) return t;
    if (t.exclude.some((w) => key.includes(` ${w} `) || (w.length > 3 && key.includes(w)))) continue;
    let score = 0;
    for (const w of t.match) {
      const hit = w.length <= 3 ? key.includes(` ${w} `) : key.includes(w);
      if (hit) score = Math.max(score, w.length);
    }
    if (score > bestScore) { best = t; bestScore = score; }
  }
  return best;
}

/** Erreurs bloquantes d'une formation du catalogue (codes manquants ou mal formés). */
export function templateErrors(t) {
  const errors = [...checkCompetences(t.competences).errors];
  if (t.certifiante) {
    errors.push(...checkRs(t.rs).errors);
  } else {
    errors.push(...checkFormacodes(t.formacodes).errors, ...checkNsf(t.nsf).errors);
  }
  if (!String(t.label || '').trim()) errors.push('Intitulé de la formation manquant');
  if (String(t.label || '').length > 250) errors.push('Intitulé : 250 caractères au maximum');
  if (t.declareAs === 'JDR' && !String(t.jdrName || t.label).trim()) errors.push('Intitulé du justificatif manquant');
  return errors;
}
