// Clés de licence Pro : jeton signé Ed25519, vérifié hors ligne dans le navigateur.
// Format : ECHEA1.<charge utile base64url>.<signature base64url>
import { verifyAsync } from '@noble/ed25519';

export const LICENSE_PREFIX = 'ECHEA1';

export function b64urlToBytes(s) {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(s.length / 4) * 4, '=');
  const bin = atob(b64);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

export function bytesToB64url(bytes) {
  let bin = '';
  bytes.forEach((b) => { bin += String.fromCharCode(b); });
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function hexToBytes(hex) {
  return Uint8Array.from(hex.match(/.{2}/g).map((b) => parseInt(b, 16)));
}

/**
 * @returns {Promise<{ valid: boolean, payload?: object, error?: string }>}
 */
export async function verifyLicense(token, publicKeyHex, todayIso) {
  const clean = String(token || '').trim().replace(/\s+/g, '');
  const parts = clean.split('.');
  if (parts.length !== 3 || parts[0] !== LICENSE_PREFIX) return { valid: false, error: 'Clé de licence mal formée : copiez-la en entier depuis l’email reçu.' };
  let payload;
  try {
    payload = JSON.parse(new TextDecoder().decode(b64urlToBytes(parts[1])));
  } catch {
    return { valid: false, error: 'Clé de licence illisible.' };
  }
  let ok = false;
  try {
    ok = await verifyAsync(b64urlToBytes(parts[2]), new TextEncoder().encode(`${parts[0]}.${parts[1]}`), hexToBytes(publicKeyHex));
  } catch {
    ok = false;
  }
  if (!ok) return { valid: false, error: 'Signature invalide : cette clé n’a pas été émise par Échéa.' };
  if (payload.exp && todayIso > payload.exp) return { valid: false, payload, error: `Clé expirée le ${payload.exp.split('-').reverse().join('/')}.` };
  return { valid: true, payload };
}
