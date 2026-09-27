// NIR (numéro de sécurité sociale) — le Passeport attend 13 caractères, sans la clé.
import { digitsFromCell } from './text.js';

const NIR13 = /^[1-478]\d{2}(0[1-9]|1[0-2]|[2-9]\d)(\d{2}|2[AB])\d{6}$/;

/** Calcule la clé de contrôle (97 - NIR mod 97), Corse : 2A → 19, 2B → 18. */
export function nirKey(nir13) {
  const numeric = nir13.slice(0, 5) + nir13.slice(5, 7).replace('2A', '19').replace('2B', '18') + nir13.slice(7);
  const mod = BigInt(numeric) % 97n;
  return String(97n - mod).padStart(2, '0');
}

/**
 * Normalise un NIR saisi (espaces, points, tirets, clé) et le contrôle.
 * @returns {{ value: string, error?: string, warning?: string }}
 */
export function checkNir(input) {
  const raw = digitsFromCell(input).toUpperCase().replace(/[\s.\-_/]/g, '');
  if (!raw) return { value: '', error: 'NIR manquant' };
  if (/E\+?\d+$/.test(raw)) {
    return { value: raw, error: 'NIR abîmé par Excel (notation scientifique) : formatez la colonne en texte et recopiez-le' };
  }
  if (raw.length !== 13 && raw.length !== 15) {
    return { value: raw, error: `le NIR doit compter 13 caractères (ou 15 avec la clé) ; ici ${raw.length}` };
  }
  const body = raw.slice(0, 13);
  if (!NIR13.test(body)) return { value: raw, error: 'format de NIR non reconnu' };
  if (raw.length === 15) {
    const key = raw.slice(13);
    if (!/^\d{2}$/.test(key) || key !== nirKey(body)) {
      return { value: body, error: 'clé du NIR incorrecte : un chiffre a probablement été mal recopié' };
    }
  }
  const result = { value: body };
  if (/^[3478]/.test(body)) result.warning = 'NIR provisoire ou non certifié : le portail risque de ne pas le reconnaître';
  return result;
}
