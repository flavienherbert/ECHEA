// Utilitaires texte partagés (aucune dépendance).

export function stripAccents(value) {
  return String(value ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/** Normalise un intitulé de colonne ou de formation pour la comparaison. */
export function normKey(value) {
  return stripAccents(value)
    .toLowerCase()
    .replace(/[’'`]/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** Nettoie une valeur de cellule avant export : pas de séparateur « | », pas de saut de ligne. */
export function cleanCell(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/[\r\n\t|]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/** Identifiant lisible : MAJUSCULES, sans accents, « _ » comme séparateur. */
export function slug(value, max = 40) {
  const s = stripAccents(value)
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return s.slice(0, max).replace(/_+$/g, '');
}

/** Échappe du texte pour insertion dans du HTML. */
export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Convertit une valeur de cellule (nombre, texte) en chaîne de chiffres, sans perte. */
export function digitsFromCell(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number') {
    if (Number.isSafeInteger(value)) return String(value);
    return String(Math.round(value));
  }
  const s = String(value).trim();
  // Notation scientifique produite par Excel (ex. 1,85051E+14) : irrécupérable si arrondie.
  if (/^\d+([.,]\d+)?e\+?\d+$/i.test(s)) {
    const n = Number(s.replace(',', '.'));
    if (Number.isSafeInteger(n)) return String(n);
  }
  return s;
}

export function formatEuros(amount) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(amount || 0);
}

export function plural(n, one, many) {
  return `${n} ${n > 1 ? many : one}`;
}
