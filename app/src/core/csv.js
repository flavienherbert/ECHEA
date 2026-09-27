// Fichiers d'import en masse du Passeport de prévention (guides OF ADF et JDR, février 2026).
import { cleanCell, slug } from './text.js';

export const ADF_COLUMNS = [
  'ID_DECLARATION', 'REFERENCE_DECLARATION', 'ID_UNIQUE_PARTENAIRE', 'NOM_FORMATION', 'DATE_DEBUT_FORMATION',
  'DATE_FIN_FORMATION', 'MODALITE_DISPENSE', 'COMPETENCE_TRANSFERABLE', 'QUALIFICATION_FORMATEUR', 'FORMATION_CERTIFIANTE',
  'CERTIFICATION_VISEE', 'DOMAINE_FORMATION', 'SPECIALITE_FORMATION', 'NIR', 'NOM_TITULAIRE',
  'PRESENCE_EMPLOYEUR', 'SIRET_EMPLOYEUR', 'REFERENCE_EMPLOYEUR', 'DATE_DEBUT_VALIDITE', 'DATE_FIN_VALIDITE',
];

export const JDR_COLUMNS = [
  'ID_DECLARATION', 'REFERENCE_DECLARATION', 'ID_UNIQUE_PARTENAIRE', 'TYPE_JDR', 'NOM_JDR',
  'NOM_OPTION_SPECIALITE', 'MODE_OBTENTION', 'COMPETENCE_TRANSFERABLE', 'PRESENCE_FORMATION', 'NOM_FORMATION',
  'DATE_DEBUT_FORMATION', 'DATE_FIN_FORMATION', 'MODALITE_DISPENSE', 'QUALIFICATION_FORMATEUR', 'FORMATION_CERTIFIANTE',
  'CERTIFICATION_VISEE', 'DOMAINE_FORMATION', 'SPECIALITE_FORMATION', 'NIR', 'NOM_TITULAIRE',
  'PRESENCE_EMPLOYEUR', 'SIRET_EMPLOYEUR', 'REFERENCE_EMPLOYEUR', 'DATE_DEBUT_VALIDITE', 'DATE_FIN_VALIDITE',
  'RESULTAT_OBTENU', 'MENTION_OBTENUE', 'LIEN_PREUVE', 'IDENTIFIANT_PREUVE',
];

export const LINE_BREAK = '\r\n';
export const SEPARATOR = '|';

/** Construit le contenu CSV (UTF-8, séparateur « | », une ligne d'en-tête). */
export function buildCsv(columns, records) {
  const lines = [columns.join(SEPARATOR)];
  for (const rec of records) lines.push(columns.map((c) => cleanCell(rec[c])).join(SEPARATOR));
  return lines.join(LINE_BREAK) + LINE_BREAK;
}

/** Nom de fichier conforme : 200 caractères max, sans @ < > : " / \ | ? * %. */
export function exportFileName(kind, orgName, todayIso, count) {
  const org = slug(orgName || 'ORGANISME', 40) || 'ORGANISME';
  const name = `PASSEPORT_${kind}_${org}_${todayIso.replace(/-/g, '')}_${count}_STAGIAIRES.csv`;
  return name.replace(/[@<>:"/\\|?*%]/g, '_').slice(0, 200);
}

/** Relit un CSV généré (utilisé par les tests et l'aperçu). */
export function parseGenerated(content) {
  const lines = content.split(LINE_BREAK).filter((l) => l.length);
  const header = lines[0].split(SEPARATOR);
  return { header, rows: lines.slice(1).map((l) => Object.fromEntries(l.split(SEPARATOR).map((v, i) => [header[i], v]))) };
}
