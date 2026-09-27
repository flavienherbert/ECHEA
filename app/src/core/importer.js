// Lecture d'un fichier .xlsx ou .csv en tableau de lignes, entièrement dans le navigateur.
import readXlsxFile from 'read-excel-file/universal';
import Papa from 'papaparse';

export class ImportError extends Error {}

const MAX_BYTES = 15 * 1024 * 1024;

function decodeText(buffer) {
  const bytes = new Uint8Array(buffer);
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes).replace(/^﻿/, '');
  } catch {
    // Fichiers CSV exportés par Excel en Windows-1252.
    return new TextDecoder('windows-1252').decode(bytes);
  }
}

export function parseCsvText(text) {
  const result = Papa.parse(text.trim(), { delimiter: '', skipEmptyLines: 'greedy' });
  if (!result.data.length) throw new ImportError('Le fichier CSV est vide.');
  return result.data;
}

/**
 * @param {{ name: string, size?: number, arrayBuffer: () => Promise<ArrayBuffer> }} file
 * @returns {Promise<Array<{ name: string, rows: any[][] }>>}
 */
export async function readWorkbook(file) {
  const name = (file.name || '').toLowerCase();
  if (file.size !== undefined && file.size > MAX_BYTES) throw new ImportError('Fichier trop volumineux (15 Mo maximum).');
  const buffer = await file.arrayBuffer();
  if (!buffer.byteLength) throw new ImportError('Le fichier est vide.');
  const head = new Uint8Array(buffer.slice(0, 4));
  const isZip = head[0] === 0x50 && head[1] === 0x4b;
  if (name.endsWith('.xls') && !isZip) {
    throw new ImportError('Ancien format Excel (.xls) : ouvrez-le dans Excel et enregistrez-le en .xlsx ou en .csv.');
  }
  if (name.endsWith('.xlsx') || name.endsWith('.xlsm') || isZip) {
    try {
      const sheets = await readXlsxFile(buffer);
      const usable = sheets.map((s) => ({ name: s.sheet, rows: s.data || [] })).filter((s) => s.rows.some((r) => r.some((c) => c !== null && c !== '')));
      if (!usable.length) throw new ImportError('Aucune donnée trouvée dans le classeur.');
      return usable;
    } catch (e) {
      if (e instanceof ImportError) throw e;
      throw new ImportError("Impossible de lire ce classeur Excel. S'il est protégé par un mot de passe, enregistrez-en une copie sans protection.");
    }
  }
  if (name.endsWith('.csv') || name.endsWith('.txt') || !name.includes('.')) {
    return [{ name: 'CSV', rows: parseCsvText(decodeText(buffer)) }];
  }
  if (name.endsWith('.ods')) throw new ImportError('Format .ods : enregistrez le fichier en .xlsx ou en .csv.');
  throw new ImportError('Format non pris en charge : importez un fichier Excel (.xlsx) ou CSV.');
}
