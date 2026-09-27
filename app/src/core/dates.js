// Dates internes au format ISO « AAAA-MM-JJ » (comparables comme des chaînes).

const MONTHS = {
  janvier: 1, janv: 1, fevrier: 2, fevr: 2, fev: 2, mars: 3, avril: 4, avr: 4, mai: 5, juin: 6,
  juillet: 7, juil: 7, aout: 8, septembre: 9, sept: 9, octobre: 10, oct: 10, novembre: 11, nov: 11, decembre: 12, dec: 12,
};

const pad = (n) => String(n).padStart(2, '0');

export function isoFromParts(y, m, d) {
  if (!Number.isInteger(y) || !Number.isInteger(m) || !Number.isInteger(d)) return null;
  if (y < 1900 || y > 2100 || m < 1 || m > 12 || d < 1) return null;
  if (d > daysInMonth(y, m)) return null;
  return `${y}-${pad(m)}-${pad(d)}`;
}

export function daysInMonth(y, m) {
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

/** Convertit une cellule (Date, numéro de série Excel, texte) en date ISO, ou null. */
export function parseDate(value) {
  if (value === null || value === undefined || value === '') return null;
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    // Les bibliothèques Excel renvoient minuit UTC ; on arrondit à la date la plus proche.
    const shifted = new Date(value.getTime() + 12 * 3600 * 1000);
    return isoFromParts(shifted.getUTCFullYear(), shifted.getUTCMonth() + 1, shifted.getUTCDate());
  }
  if (typeof value === 'number') {
    if (value > 20000 && value < 80000) {
      const ms = Date.UTC(1899, 11, 30) + Math.round(value) * 86400000;
      const d = new Date(ms);
      return isoFromParts(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
    }
    return null;
  }
  const s = String(value).trim().toLowerCase();
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return isoFromParts(+m[1], +m[2], +m[3]);
  m = s.match(/^(\d{1,2})[/.\-\s](\d{1,2})[/.\-\s](\d{2}|\d{4})$/);
  if (m) {
    let y = +m[3];
    if (m[3].length === 2) y += y < 70 ? 2000 : 1900;
    return isoFromParts(y, +m[2], +m[1]);
  }
  m = s.normalize('NFD').replace(/[̀-ͯ]/g, '').match(/^(\d{1,2})(?:er)?\s+([a-z]+)\.?\s+(\d{4})$/);
  if (m && MONTHS[m[2]]) return isoFromParts(+m[3], MONTHS[m[2]], +m[1]);
  if (/^\d{5}$/.test(s)) return parseDate(Number(s));
  return null;
}

export function toFr(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

export function toLongFr(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

export function todayIso(now = new Date()) {
  return isoFromParts(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

export function addDays(iso, n) {
  const [y, m, d] = iso.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d) + n * 86400000);
  return isoFromParts(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate());
}

/** Ajoute des mois en ramenant le jour à la fin du mois si besoin (31/01 + 1 mois → 28 ou 29/02). */
export function addMonths(iso, n) {
  const [y, m, d] = iso.split('-').map(Number);
  const total = y * 12 + (m - 1) + n;
  const ny = Math.floor(total / 12);
  const nm = (total % 12) + 1;
  return isoFromParts(ny, nm, Math.min(d, daysInMonth(ny, nm)));
}

export function endOfMonth(iso) {
  const [y, m] = iso.split('-').map(Number);
  return isoFromParts(y, m, daysInMonth(y, m));
}

export function endOfQuarter(iso) {
  const [y, m] = iso.split('-').map(Number);
  const qm = Math.ceil(m / 3) * 3;
  return isoFromParts(y, qm, daysInMonth(y, qm));
}

export function diffDays(fromIso, toIso) {
  const a = fromIso.split('-').map(Number);
  const b = toIso.split('-').map(Number);
  return Math.round((Date.UTC(b[0], b[1] - 1, b[2]) - Date.UTC(a[0], a[1] - 1, a[2])) / 86400000);
}

/** Fin de validité : début + N mois - 1 jour (25/07/2025 + 24 mois → 24/07/2027, comme le guide). */
export function validityEnd(startIso, months) {
  if (!startIso || !months) return null;
  return addDays(addMonths(startIso, months), -1);
}
