// SIRET : 14 chiffres, clé de Luhn (exception La Poste : somme des chiffres multiple de 5).
import { digitsFromCell } from './text.js';

export function luhnValid(digits) {
  let sum = 0;
  for (let i = 0; i < digits.length; i += 1) {
    let d = Number(digits[digits.length - 1 - i]);
    if (i % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return sum % 10 === 0;
}

/** @returns {{ value: string, error?: string }} */
export function checkSiret(input) {
  const value = digitsFromCell(input).replace(/[\s.\-]/g, '');
  if (!value) return { value: '', error: 'SIRET manquant' };
  if (!/^\d{14}$/.test(value)) return { value, error: `le SIRET doit compter 14 chiffres ; ici ${value.replace(/\D/g, '').length}` };
  if (value.startsWith('356000000')) {
    const sum = [...value].reduce((acc, c) => acc + Number(c), 0);
    return sum % 5 === 0 ? { value } : { value, error: 'SIRET invalide (clé de contrôle)' };
  }
  return luhnValid(value) ? { value } : { value, error: 'SIRET invalide (clé de contrôle) : vérifiez la saisie' };
}
