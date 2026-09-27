// Reconnaissance des colonnes du fichier de l'organisme.
import { normKey } from './text.js';

// Chaque champ : motifs (sur l'intitulé normalisé) et poids. Le meilleur score gagne, une colonne par champ.
export const FIELDS = [
  { id: 'nom', label: 'Nom de naissance', required: true, patterns: [[/^nom de naissance$|^nom naissance$|^nom patronymique$/, 10], [/nom de naissance|nom naissance|patronym/, 9], [/^nom$|^nom de famille$|^noms?$/, 8], [/^nom (du )?(stagiaire|participant|apprenant|salarie)$/, 8], [/^(stagiaire|participant|apprenant)$/, 4]] },
  { id: 'prenom', label: 'Prénom', required: false, patterns: [[/^prenoms?$/, 10], [/prenom/, 8]] },
  { id: 'nir', label: 'NIR (n° de sécurité sociale)', required: true, patterns: [[/^nir$/, 10], [/securite sociale|^n ?ss$|^num(ero)? ?ss$|^no ss$|secu|insee|^nir /, 9], [/\bnir\b/, 8]] },
  { id: 'formation', label: 'Formation', required: true, patterns: [[/^(intitule )?(de la )?formation$/, 10], [/^(stage|module|action|cours|prestation)$/, 8], [/intitule|libelle formation|type de formation|formation suivie|nom (de la )?formation/, 8], [/formation/, 5]] },
  { id: 'dateDebut', label: 'Date de début', required: true, patterns: [[/^date (de )?debut( de (la )?formation)?$/, 10], [/^debut$|^du$|date d entree|debut formation/, 8], [/^date( de (la )?formation| session)?$/, 6], [/debut/, 5]] },
  { id: 'dateFin', label: 'Date de fin', required: false, patterns: [[/^date (de )?fin( de (la )?formation)?$/, 10], [/^fin$|^au$|date de sortie|fin formation/, 8], [/\bfin\b/, 5]] },
  { id: 'resultat', label: 'Résultat (réussi / échec)', required: false, patterns: [[/^resultats?$|^reussite$|^admis$|^obtention$/, 10], [/resultat|reussi|admis|valid|certifi|apte|avis|statut/, 7]] },
  { id: 'entreprise', label: 'Entreprise (employeur)', required: false, patterns: [[/^(entreprise|employeur|societe|client|raison sociale)$/, 10], [/entreprise|employeur|societe|raison sociale|client|structure|etablissement/, 7]] },
  { id: 'siret', label: 'SIRET de l\'employeur', required: false, patterns: [[/^siret$/, 10], [/siret/, 9]] },
  { id: 'emailEntreprise', label: 'Email de l\'entreprise', required: false, patterns: [[/(mail|courriel).*(entreprise|employeur|client|rh|contact|societe)|(entreprise|employeur|client|contact|rh).*(mail|courriel)/, 10], [/^e ?mail$|^courriel$|^mail$|^adresse (e ?)?mail$/, 4]] },
  { id: 'session', label: 'N° ou référence de session', required: false, patterns: [[/^(n |numero |no |ref |reference |code )?session$/, 10], [/session|groupe/, 6]] },
];

export const FIELD_BY_ID = Object.fromEntries(FIELDS.map((f) => [f.id, f]));

function score(field, header) {
  let best = 0;
  for (const [re, w] of field.patterns) if (re.test(header)) best = Math.max(best, w);
  // « email stagiaire » ne doit pas devenir l'email de l'entreprise.
  if (field.id === 'emailEntreprise' && /stagiaire|participant|apprenant|salarie/.test(header)) best = 0;
  if (field.id === 'nom' && /entreprise|societe|formation|client|employeur|formateur|session/.test(header)) best = 0;
  if (field.id === 'formation' && /date|formateur|lieu|organisme|duree|heure/.test(header)) best = 0;
  if ((field.id === 'dateDebut' || field.id === 'dateFin') && !/date|debut|fin|^du$|^au$/.test(header)) best = 0;
  if (field.id === 'entreprise' && /mail|siret|adresse|tel|contact/.test(header)) best = 0;
  if (field.id === 'resultat' && /date/.test(header)) best = 0;
  return best;
}

/** Associe automatiquement les colonnes aux champs. @returns {Record<string, number>} index de colonne par champ */
export function autoMap(headers) {
  const norm = headers.map((h) => normKey(h));
  const candidates = [];
  FIELDS.forEach((f) => norm.forEach((h, i) => {
    const s = h ? score(f, h) : 0;
    if (s > 0) candidates.push({ field: f.id, col: i, s });
  }));
  candidates.sort((a, b) => b.s - a.s);
  const mapping = {};
  const usedCols = new Set();
  for (const c of candidates) {
    if (mapping[c.field] !== undefined || usedCols.has(c.col)) continue;
    mapping[c.field] = c.col;
    usedCols.add(c.col);
  }
  return mapping;
}

/** Trouve la ligne d'en-tête dans les 15 premières lignes (celle qui reconnaît le plus de champs). */
export function findHeaderRow(rows) {
  let bestIdx = 0;
  let bestCount = -1;
  rows.slice(0, 15).forEach((row, idx) => {
    const cells = (row || []).map((c) => (c === null || c === undefined ? '' : String(c)));
    const count = Object.keys(autoMap(cells)).length;
    if (count > bestCount) { bestCount = count; bestIdx = idx; }
  });
  return { index: bestIdx, recognized: bestCount };
}

export function missingRequired(mapping) {
  return FIELDS.filter((f) => f.required && mapping[f.id] === undefined).map((f) => f.label);
}

const SUCCESS = /^(oui|o|yes|ok|x|1|admis|admise|reussi|reussie|valide|validee|acquis|apte|favorable|certifie|certifiee|obtenu|succes|v|✓|✔)$/;
const FAILURE = /^(non|n|no|0|echec|ajourne|ajournee|non admis|non admise|non valide|non validee|non acquis|inapte|defavorable|refuse|abandon|absent|absente|non reussi|non certifie)$/;

/** @returns {'success'|'failure'|'unknown'} */
export function parseResult(value) {
  const k = normKey(value);
  if (!k) return 'unknown';
  if (SUCCESS.test(k)) return 'success';
  if (FAILURE.test(k)) return 'failure';
  if (/non|echec|ajourn|inapte|defavorable/.test(k)) return 'failure';
  if (/admis|reussi|valid|apte|favorable|acquis|certifi/.test(k)) return 'success';
  return 'unknown';
}
