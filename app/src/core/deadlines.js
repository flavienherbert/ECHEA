// Délais de déclaration au Passeport de prévention (portail officiel, actualité du 15/06/2026).
import { addMonths, endOfMonth, endOfQuarter, diffDays } from './dates.js';

export const OBLIGATION_START = '2025-09-01';
export const DEADLINE_SOURCE = 'https://passeport-prevention.travail-emploi.gouv.fr/aide/quelles-sont-mes-obligations-en-tant-quorganisme-de-formation';

/**
 * @param {string} refIso date de fin de formation (ADF) ou de début de validité (JDR)
 * @returns {{ deadline: string|null, rule: string, label: string }}
 */
export function declarationDeadline(refIso) {
  if (!refIso) return { deadline: null, rule: 'inconnu', label: 'date inconnue' };
  if (refIso < OBLIGATION_START) {
    return { deadline: null, rule: 'avant-obligation', label: 'terminée avant le 01/09/2025 : déclaration non obligatoire' };
  }
  if (refIso <= '2025-12-31') {
    return { deadline: '2026-09-30', rule: 'transition-2025', label: 'formations de sept. à déc. 2025 : avant le 30/09/2026 inclus' };
  }
  const months = refIso < '2027-01-01' ? 6 : 3;
  const deadline = endOfMonth(addMonths(endOfQuarter(refIso), months));
  return {
    deadline,
    rule: months === 6 ? 'transition-2026' : 'regle-cible',
    label: months === 6 ? 'formations 2026 : 6 mois après la fin du trimestre' : '3 mois après la fin du trimestre',
  };
}

/** @returns {'depassee'|'urgent'|'bientot'|'ok'|'non-obligatoire'} */
export function deadlineStatus(deadline, today) {
  if (!deadline) return 'non-obligatoire';
  const days = diffDays(today, deadline);
  if (days < 0) return 'depassee';
  if (days <= 30) return 'urgent';
  if (days <= 90) return 'bientot';
  return 'ok';
}

/** Prochaine échéance générale à afficher (bandeau de la page d'accueil). */
export function nextGeneralDeadline(today) {
  const milestones = [
    { date: '2026-09-30', text: 'formations de sept. à déc. 2025 et du 1er trimestre 2026' },
    { date: '2026-12-31', text: 'formations du 2e trimestre 2026 (avril à juin)' },
    { date: '2027-03-31', text: 'formations du 3e trimestre 2026 (juillet à septembre)' },
    { date: '2027-06-30', text: 'formations du 4e trimestre 2026 et du 1er trimestre 2027' },
  ];
  return milestones.find((m) => m.date >= today) || null;
}
