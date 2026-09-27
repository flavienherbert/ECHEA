// Contrôle de format des codes attendus par le Passeport (le portail contrôle ensuite leur existence).

export function parseCodeList(value) {
  const seen = new Set();
  return String(value ?? '')
    .split(/[\s/;,|]+/)
    .map((c) => c.trim())
    .filter((c) => c && !seen.has(c.toLowerCase()) && seen.add(c.toLowerCase()));
}

function checkList(value, { label, min, max, maxLength, pattern, hint, normalize = (c) => c }) {
  const list = parseCodeList(value).map(normalize);
  const joined = list.join('/');
  const errors = [];
  if (list.length < min || list.length > max) {
    errors.push(`${label} : ${min === max ? min : `${min} à ${max}`} codes attendus, ${list.length} saisi${list.length > 1 ? 's' : ''}`);
  }
  const bad = list.filter((c) => !pattern.test(c));
  if (bad.length) errors.push(`${label} : format inattendu pour ${bad.join(', ')} (${hint})`);
  if (joined.length > maxLength) errors.push(`${label} : ${joined.length} caractères, ${maxLength} au maximum`);
  return { value: joined, list, errors };
}

/** 3 à 10 codes du référentiel ROME (compétences transférables), 70 caractères max. */
export const checkCompetences = (v) => checkList(v, {
  label: 'Compétences transférables (ROME)', min: 3, max: 10, maxLength: 70, pattern: /^\d{4,7}$/, hint: 'codes numériques, ex. 115650',
});

/** 1 à 5 Formacodes, 30 caractères max. */
export const checkFormacodes = (v) => checkList(v, {
  label: 'Formacodes', min: 1, max: 5, maxLength: 30, pattern: /^\d{5}$/, hint: '5 chiffres, ex. 42829',
});

/** 1 à 3 codes NSF, 15 caractères max. */
export const checkNsf = (v) => checkList(v, {
  label: 'Codes NSF', min: 1, max: 3, maxLength: 15, pattern: /^\d{3}[a-z]?$/, hint: '3 chiffres + lettre éventuelle, ex. 344r',
  normalize: (c) => c.toLowerCase(),
});

/** Un seul code du Répertoire spécifique (RS), 9 caractères max. */
export function checkRs(value) {
  const v = String(value ?? '').trim().toUpperCase().replace(/\s+/g, '');
  if (!v) return { value: '', errors: ['Code RS manquant (formation certifiante)'] };
  if (!/^RS\d{1,7}$/.test(v)) return { value: v, errors: [`Code RS « ${v} » : format attendu RS suivi de chiffres, ex. RS6550`] };
  return { value: v, errors: [] };
}

export const QUALIFICATIONS = [
  ['', '— non précisé —'],
  ['FORMATEUR_D_ADULTES_FORMATION_SPECIALISEE', "Formateur d'adultes / formation spécialisée"],
  ['PREVENTEUR', 'Préventeur'],
  ['ANCIEN_PROFESSIONNEL', 'Ancien professionnel'],
  ['RESPONSABLE_QHSE', 'Responsable QHSE'],
  ['INGENIEUR', 'Ingénieur'],
  ['ENSEIGNANT', 'Enseignant'],
  ['PSYCHOLOGUE', 'Psychologue'],
];

export const MODALITES = [
  ['PRESENTIEL', 'Présentiel'],
  ['A_DISTANCE', 'À distance'],
  ['MIXTE', 'Mixte'],
];

export const JDR_TYPES = [
  ['CERTIFICAT', 'Certificat'],
  ['HABILITATION', 'Habilitation'],
  ['DIPLOME', 'Diplôme'],
  ['TITRE', 'Titre'],
];
