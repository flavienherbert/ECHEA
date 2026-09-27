import { describe, it, expect } from 'vitest';
import { createPrivateKey, generateKeyPairSync } from 'node:crypto';
import { checkNir, nirKey } from '../../app/src/core/nir.js';
import { checkSiret } from '../../app/src/core/siret.js';
import { parseDate, validityEnd, addMonths, toFr } from '../../app/src/core/dates.js';
import { declarationDeadline, deadlineStatus, nextGeneralDeadline } from '../../app/src/core/deadlines.js';
import { checkCompetences, checkFormacodes, checkNsf, checkRs } from '../../app/src/core/codes.js';
import { autoMap, findHeaderRow, parseResult } from '../../app/src/core/mapping.js';
import { cloneDefaults, matchFormation, templateErrors, GUIDE_EXAMPLE_SST } from '../../app/src/core/catalogue.js';
import { analyzeRows, buildDeclarations, toRecords, hasError, summarize } from '../../app/src/core/process.js';
import { buildCsv, parseGenerated, ADF_COLUMNS, JDR_COLUMNS, exportFileName } from '../../app/src/core/csv.js';
import { passagesFromTrainees, upcomingRecyclages, reminderEmail, mergePassages } from '../../app/src/core/recyclages.js';
import { verifyLicense } from '../../app/src/core/license.js';
import { parseCsvText, readWorkbook } from '../../app/src/core/importer.js';
import { issue, publicKeyHex } from '../../scripts/license/license.mjs';
import { normKey } from '../../app/src/core/text.js';

describe('NIR', () => {
  it('calcule la clé officielle', () => {
    expect(nirKey('2550814168025')).toBe('38');
    expect(nirKey('1850578006084')).toBe('91');
    expect(nirKey('180122B012345')).toBe('75');
  });
  it('accepte 15 caractères avec une clé correcte et renvoie 13 caractères', () => {
    expect(checkNir('2 55 08 14 168 025 38')).toEqual({ value: '2550814168025' });
    expect(checkNir('1.85.05.78.006.084-91').value).toBe('1850578006084');
    expect(checkNir('1 80 12 2B 012 345 75').value).toBe('180122B012345');
  });
  it('refuse une clé fausse, une longueur fausse, un champ vide', () => {
    expect(checkNir('255081416802539').error).toMatch(/clé/);
    expect(checkNir('25508141680').error).toMatch(/13 caractères/);
    expect(checkNir('').error).toMatch(/manquant/);
    expect(checkNir('9550814168025').error).toMatch(/format/);
  });
  it('lit un NIR stocké comme nombre par Excel', () => {
    expect(checkNir(255081416802538).value).toBe('2550814168025');
    expect(checkNir(2550814168025).value).toBe('2550814168025');
  });
  it('signale un NIR provisoire', () => {
    expect(checkNir('7550814168025').warning).toMatch(/provisoire/);
  });
});

describe('SIRET', () => {
  it('valide la clé de Luhn', () => {
    expect(checkSiret('200 056 679 00018')).toEqual({ value: '20005667900018' });
    expect(checkSiret(44123456700010).value).toBe('44123456700010');
    expect(checkSiret('20005667900019').error).toMatch(/invalide/);
    expect(checkSiret('2000566790001').error).toMatch(/14 chiffres/);
  });
});

describe('Dates', () => {
  it('lit les formats courants', () => {
    expect(parseDate('25/07/2025')).toBe('2025-07-25');
    expect(parseDate('5/7/25')).toBe('2025-07-05');
    expect(parseDate('2025-07-25')).toBe('2025-07-25');
    expect(parseDate('25.07.2025')).toBe('2025-07-25');
    expect(parseDate(45863)).toBe('2025-07-25');
    expect(parseDate(new Date(Date.UTC(2025, 6, 25)))).toBe('2025-07-25');
    expect(parseDate('12 mars 2026')).toBe('2026-03-12');
    expect(parseDate('1er août 2026')).toBe('2026-08-01');
    expect(parseDate('31/02/2026')).toBeNull();
    expect(parseDate('bientôt')).toBeNull();
  });
  it('calcule les fins de validité comme le guide (25/07/2025 + 24 mois → 24/07/2027)', () => {
    expect(validityEnd('2025-07-25', 24)).toBe('2027-07-24');
    expect(addMonths('2026-01-31', 1)).toBe('2026-02-28');
    expect(toFr('2027-07-24')).toBe('24/07/2027');
  });
});

describe('Délais de déclaration', () => {
  it('applique le calendrier officiel', () => {
    expect(declarationDeadline('2025-06-01').deadline).toBeNull();
    expect(declarationDeadline('2025-10-15').deadline).toBe('2026-09-30');
    expect(declarationDeadline('2026-02-10').deadline).toBe('2026-09-30');
    expect(declarationDeadline('2026-05-20').deadline).toBe('2026-12-31');
    expect(declarationDeadline('2026-08-01').deadline).toBe('2027-03-31');
    expect(declarationDeadline('2026-11-30').deadline).toBe('2027-06-30');
    expect(declarationDeadline('2027-02-01').deadline).toBe('2027-06-30');
  });
  it('qualifie l’urgence', () => {
    expect(deadlineStatus('2026-09-30', '2026-09-27')).toBe('urgent');
    expect(deadlineStatus('2026-09-30', '2026-10-01')).toBe('depassee');
    expect(deadlineStatus('2026-12-20', '2026-09-27')).toBe('bientot');
    expect(deadlineStatus('2026-12-31', '2026-09-27')).toBe('ok');
    expect(nextGeneralDeadline('2026-10-01').date).toBe('2026-12-31');
  });
});

describe('Codes', () => {
  it('contrôle les bornes et formats', () => {
    expect(checkCompetences('115650/121885/400635').errors).toEqual([]);
    expect(checkCompetences('115650/121885').errors[0]).toMatch(/3 à 10/);
    expect(checkCompetences('115650, 121885 ; 400635').value).toBe('115650/121885/400635');
    expect(checkFormacodes('42829/42817').errors).toEqual([]);
    expect(checkFormacodes('4282').errors[0]).toMatch(/format/);
    expect(checkNsf('344R/344p').value).toBe('344r/344p');
    expect(checkNsf('344r/344p/331/200').errors[0]).toMatch(/1 à 3/);
    expect(checkRs('rs 6550').value).toBe('RS6550');
    expect(checkRs('6550').errors[0]).toMatch(/format/);
  });
});

describe('Colonnes et formations', () => {
  const headers = ['Nom de naissance', 'Prénom', 'N° Sécurité sociale', 'Entreprise', 'SIRET', 'Intitulé formation', 'Date de début', 'Date de fin', 'Résultat', 'Email entreprise', 'Email stagiaire'];
  it('reconnaît les colonnes usuelles', () => {
    const m = autoMap(headers);
    expect(m).toMatchObject({ nom: 0, prenom: 1, nir: 2, entreprise: 3, siret: 4, formation: 5, dateDebut: 6, dateFin: 7, resultat: 8, emailEntreprise: 9 });
  });
  it('trouve la ligne d’en-tête sous un titre', () => {
    const rows = [['Stagiaires 2026'], [], headers, ['DUPONT']];
    expect(findHeaderRow(rows).index).toBe(2);
  });
  it('associe les intitulés libres au catalogue', () => {
    const cat = cloneDefaults();
    const id = (s) => matchFormation(s, cat)?.id;
    expect(id('MAC SST')).toBe('mac-sst');
    expect(id('Recyclage SST 7h')).toBe('mac-sst');
    expect(id('SST initial 2 jours')).toBe('sst');
    expect(id('Habilitation électrique B0 H0V')).toBe('habilitation-electrique');
    expect(id('CACES R489 cat. 3')).toBe('caces');
    expect(id('CACES R482')).toBe('caces-r482');
    expect(id('EPI - manipulation extincteurs')).toBe('incendie');
    expect(id('SSIAP 1')).toBe('ssiap');
    expect(id('MAC PRAP IBC')).toBe('prap');
    expect(id('Formation bureautique')).toBeUndefined();
  });
  it('interprète les résultats', () => {
    expect(parseResult('Admis')).toBe('success');
    expect(parseResult('Non admis')).toBe('failure');
    expect(parseResult('Échec')).toBe('failure');
    expect(parseResult('')).toBe('unknown');
  });
});

function sampleCatalogue() {
  const cat = cloneDefaults();
  for (const t of cat) Object.assign(t, GUIDE_EXAMPLE_SST);
  return cat;
}

const HEADERS = ['Nom', 'Prénom', 'NIR', 'Entreprise', 'SIRET', 'Formation', 'Date début', 'Date fin', 'Résultat', 'Email entreprise'];
const MAP = autoMap(HEADERS);

function analyze(rows, cat = sampleCatalogue(), today = '2026-09-27') {
  const formationMap = {};
  for (const r of rows) {
    const t = matchFormation(r[5], cat);
    if (t) formationMap[normKey(r[5])] = t.id;
  }
  return analyzeRows(rows, MAP, formationMap, { catalogue: cat, companies: {}, today });
}

describe('Analyse et déclarations', () => {
  const rows = [
    ['DUPONT', 'Marie', '2 55 08 14 168 025 38', 'Menuiserie Test', '200 056 679 00018', 'SST', '15/06/2026', '16/06/2026', 'Admis', 'rh@menuiserie.test'],
    ['MARTIN', 'Paul', '1850578006084', 'Menuiserie Test', '20005667900018', 'SST', '15/06/2026', '16/06/2026', 'Non admis', 'rh@menuiserie.test'],
    ['DURAND', 'Luc', '1850578006084', 'Garage Test', '44123456700010', 'Habilitation électrique BS', '02/03/2026', '03/03/2026', '', ''],
    ['BERNARD', 'Léa', '12345', 'Garage Test', '44123456700010', 'SST', '15/06/2026', '16/06/2026', 'Admis', ''],
    ['PETIT', 'Jean', '2550814168025', 'Sans Siret SARL', '', 'MAC SST', '10/09/2026', '10/09/2026', 'Admis', ''],
    ['DUPONT', 'Marie', '2550814168025', 'Menuiserie Test', '20005667900018', 'SST', '15/06/2026', '16/06/2026', 'Admis', ''],
    ['FUTUR', 'Anne', '1850578006084', '', '', 'SST', '01/10/2026', '02/10/2026', 'Admis', ''],
  ];
  const trainees = analyze(rows);

  it('signale chaque erreur à la bonne ligne', () => {
    expect(trainees).toHaveLength(7);
    expect(hasError(trainees[0])).toBe(false);
    expect(trainees[3].issues.find((i) => i.field === 'nir').message).toMatch(/13 caractères/);
    expect(trainees[4].issues.find((i) => i.field === 'siret').message).toMatch(/SIRET manquant/);
    expect(trainees[5].issues.find((i) => i.field === 'nir').message).toMatch(/doublon de la ligne 2/);
    expect(trainees[6].issues.find((i) => i.field === 'dateFin').message).toMatch(/pas encore terminée/);
    expect(summarize(trainees)).toEqual({ total: 7, errors: 4, warnings: 0, valid: 3 });
  });

  it('sépare les réussites (JDR) des attestations (ADF)', () => {
    const decl = buildDeclarations(trainees, sampleCatalogue());
    const kinds = decl.map((d) => `${d.template.id}:${d.kind}:${d.trainees.length}`).sort();
    expect(kinds).toEqual(['habilitation-electrique:ADF:1', 'sst:ADF:1', 'sst:JDR:1']);
    const hab = decl.find((d) => d.template.id === 'habilitation-electrique');
    expect(hab.deadline).toBe('2026-09-30');
  });

  it('produit des fichiers conformes aux guides (colonnes, séparateur, règles conditionnelles)', () => {
    const recs = toRecords(buildDeclarations(trainees, sampleCatalogue()));
    const adf = parseGenerated(buildCsv(ADF_COLUMNS, recs.ADF));
    const jdr = parseGenerated(buildCsv(JDR_COLUMNS, recs.JDR));
    expect(adf.header).toEqual(ADF_COLUMNS);
    expect(adf.header).toHaveLength(20);
    expect(jdr.header).toHaveLength(29);
    const j = jdr.rows[0];
    expect(j).toMatchObject({
      TYPE_JDR: 'CERTIFICAT', NOM_JDR: 'Sauveteur secouriste du travail', PRESENCE_FORMATION: 'OUI',
      DATE_DEBUT_FORMATION: '15/06/2026', DATE_FIN_FORMATION: '16/06/2026', NIR: '2550814168025', NOM_TITULAIRE: 'DUPONT',
      PRESENCE_EMPLOYEUR: 'OUI', SIRET_EMPLOYEUR: '20005667900018', DATE_DEBUT_VALIDITE: '16/06/2026', DATE_FIN_VALIDITE: '15/06/2028',
      FORMATION_CERTIFIANTE: 'NON', CERTIFICATION_VISEE: '', DOMAINE_FORMATION: '42829/42817', SPECIALITE_FORMATION: '344r/344p',
      COMPETENCE_TRANSFERABLE: '115650/121885/400635',
    });
    const failed = adf.rows.find((r) => r.NOM_TITULAIRE === 'MARTIN');
    expect(failed).toMatchObject({ FORMATION_CERTIFIANTE: 'NON', PRESENCE_EMPLOYEUR: 'OUI', MODALITE_DISPENSE: 'PRESENTIEL' });
    const hab = adf.rows.find((r) => r.NOM_TITULAIRE === 'DURAND');
    expect(hab.DATE_FIN_VALIDITE).toBe('');
    for (const r of [...adf.rows, ...jdr.rows]) {
      expect(r.ID_UNIQUE_PARTENAIRE.length).toBeLessThanOrEqual(255);
      expect(r.NIR).toHaveLength(13);
    }
    const ids = [...adf.rows, ...jdr.rows].map((r) => r.ID_UNIQUE_PARTENAIRE);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('donne des identifiants stables d’un export à l’autre', () => {
    const a = toRecords(buildDeclarations(analyze(rows), sampleCatalogue()));
    const b = toRecords(buildDeclarations(analyze(rows), sampleCatalogue()));
    expect(a.JDR[0].ID_UNIQUE_PARTENAIRE).toBe(b.JDR[0].ID_UNIQUE_PARTENAIRE);
    expect(a.JDR[0].ID_DECLARATION).toBe(b.JDR[0].ID_DECLARATION);
  });

  it('découpe au-delà de 500 stagiaires par déclaration', () => {
    const many = [];
    for (let i = 0; i < 1201; i += 1) {
      const body = `1850578${String(100000 + i).slice(-6)}`;
      many.push([`NOM${String.fromCharCode(65 + (i % 26))}`, 'X', body, 'Garage Test', '44123456700010', 'Habilitation électrique', '02/03/2026', '03/03/2026', '', '']);
    }
    const decl = buildDeclarations(analyze(many), sampleCatalogue());
    expect(decl.map((d) => d.trainees.length)).toEqual([500, 500, 201]);
    expect(new Set(decl.map((d) => d.id)).size).toBe(3);
  });

  it('bloque une formation dont les codes sont incomplets', () => {
    const cat = cloneDefaults();
    expect(templateErrors(cat[0]).length).toBeGreaterThan(0);
    expect(buildDeclarations(analyze(rows, cat), cat)).toHaveLength(0);
  });

  it('nomme le fichier sans caractère interdit', () => {
    const n = exportFileName('ADF', 'Sécurité & Prévention : "Caen"', '2026-09-27', 12);
    expect(n).toBe('PASSEPORT_ADF_SECURITE_PREVENTION_CAEN_20260927_12_STAGIAIRES.csv');
    expect(n).not.toMatch(/[@<>:"/\\|?*%]/);
  });
});

describe('Recyclages', () => {
  it('regroupe par entreprise et garde le passage le plus récent', () => {
    const cat = sampleCatalogue();
    cat.find((t) => t.id === 'mac-sst').unitPrice = 90;
    const rows = [
      ['DUPONT', 'Marie', '2550814168025', 'Menuiserie Test', '20005667900018', 'SST', '10/10/2024', '11/10/2024', 'Admis', 'rh@menuiserie.test'],
      ['MARTIN', 'Paul', '1850578006084', 'Menuiserie Test', '20005667900018', 'SST', '10/10/2024', '11/10/2024', 'Admis', 'rh@menuiserie.test'],
      ['MARTIN', 'Paul', '1850578006084', 'Menuiserie Test', '20005667900018', 'MAC SST', '05/09/2026', '05/09/2026', 'Admis', ''],
    ];
    const trainees = analyze(rows, cat);
    const { passages } = mergePassages([], passagesFromTrainees(trainees, cat));
    expect(passages.every((p) => !('nir' in p))).toBe(true);
    const groups = upcomingRecyclages(passages, cat, { today: '2026-09-27' });
    expect(groups).toHaveLength(1);
    expect(groups[0].items.map((i) => `${i.nom}:${i.due}`)).toEqual(['DUPONT:2026-10-10']);
    const mail = reminderEmail(groups[0], { name: 'Test Formation' });
    expect(mail.subject).toMatch(/MAC SST : 1 salarié à recycler avant le 10\/10\/2026/);
    expect(mail.body).toMatch(/Marie DUPONT/);
    expect(mail.mailto.startsWith('mailto:rh%40menuiserie.test?subject=')).toBe(true);
  });
});

describe('Import de fichiers', () => {
  it('lit un CSV à point-virgule', () => {
    const rows = parseCsvText('Nom;Prénom;NIR\nDUPONT;Marie;2550814168025\n');
    expect(rows).toEqual([['Nom', 'Prénom', 'NIR'], ['DUPONT', 'Marie', '2550814168025']]);
  });
  it('refuse un format non pris en charge', async () => {
    const file = { name: 'photo.pdf', size: 10, arrayBuffer: async () => new TextEncoder().encode('%PDF-1.7').buffer };
    await expect(readWorkbook(file)).rejects.toThrow(/Format non pris en charge/);
  });
});

describe('Licences', () => {
  it('accepte une clé signée, refuse une clé modifiée ou expirée', async () => {
    const { privateKey } = generateKeyPairSync('ed25519');
    const pub = publicKeyHex(privateKey);
    const { token } = issue({ org: 'OF Test', email: 'a@b.fr', months: 12, today: new Date(Date.UTC(2026, 8, 27)) }, privateKey);
    expect((await verifyLicense(token, pub, '2026-09-27')).valid).toBe(true);
    expect((await verifyLicense(token, pub, '2027-10-01')).error).toMatch(/expirée/);
    const forged = token.replace(/\.([^.]+)\./, (m, p) => `.${p.slice(0, -2)}AA.`);
    expect((await verifyLicense(forged, pub, '2026-09-27')).valid).toBe(false);
    expect((await verifyLicense('n importe quoi', pub, '2026-09-27')).valid).toBe(false);
    const other = generateKeyPairSync('ed25519').privateKey;
    expect((await verifyLicense(token, publicKeyHex(other), '2026-09-27')).valid).toBe(false);
  });
  it('la clé publique embarquée correspond à la clé privée locale', async () => {
    const fs = await import('node:fs');
    const os = await import('node:os');
    const path = `${os.homedir()}/.echea/license-private.pem`;
    if (!fs.existsSync(path)) return;
    const { LICENSE_PUBLIC_KEY } = await import('../../app/src/config.js');
    expect(publicKeyHex(createPrivateKey(fs.readFileSync(path, 'utf8')))).toBe(LICENSE_PUBLIC_KEY);
  });
});

describe('Fichier d’exemple', () => {
  it('se lit, se contrôle et produit des déclarations cohérentes', async () => {
    const fs = await import('node:fs');
    const buf = fs.readFileSync(new URL('../../app/public/exemple-stagiaires.xlsx', import.meta.url));
    const sheets = await readWorkbook({ name: 'exemple-stagiaires.xlsx', size: buf.length, arrayBuffer: async () => buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) });
    const rows = sheets[0].rows;
    const { index } = findHeaderRow(rows);
    const headers = rows[index].map(String);
    const mapping = autoMap(headers);
    expect(Object.keys(mapping).sort()).toEqual(['dateDebut', 'dateFin', 'emailEntreprise', 'entreprise', 'formation', 'nir', 'nom', 'prenom', 'resultat', 'session', 'siret'].sort());
    const cat = sampleCatalogue();
    const fm = {};
    for (const r of rows.slice(index + 1)) { const t = matchFormation(r[mapping.formation], cat); if (t) fm[normKey(r[mapping.formation])] = t.id; }
    const trainees = analyzeRows(rows.slice(index + 1), mapping, fm, { catalogue: cat, companies: {}, today: '2026-09-27', firstRowNumber: index + 2 });
    expect(trainees).toHaveLength(28);
    const errs = trainees.filter(hasError).map((t) => `${t.rowNumber}:${t.issues.find((i) => i.level === 'error').field}`);
    expect(errs).toEqual(['8:nir', '13:siret', '14:siret', '15:siret', '23:nir', '27:nir', '29:dateFin']);
    expect(trainees[0].dateDebut).toBe('2024-10-16');
    const decl = buildDeclarations(trainees.filter((t) => t.dateFin >= '2025-09-01'), cat);
    const summary = decl.map((d) => `${d.template.id}:${d.kind}:${d.trainees.length}:${d.deadline}`);
    expect(summary).toEqual([
      'sst:JDR:1:2026-09-30', 'mac-sst:ADF:1:2026-09-30', 'mac-sst:JDR:4:2026-09-30',
      'habilitation-electrique:ADF:2:2026-12-31', 'caces:ADF:1:2027-03-31', 'caces:JDR:3:2027-03-31', 'incendie:ADF:4:2027-03-31',
    ]);
    const passages = passagesFromTrainees(trainees, cat);
    const groups = upcomingRecyclages(passages, cat, { today: '2026-09-27' });
    expect(groups[0].entreprise).toBe('Menuiserie Lefèvre');
    expect(groups[0].items[0].due).toBe('2026-10-16');
  });
});
