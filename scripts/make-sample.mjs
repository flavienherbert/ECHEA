#!/usr/bin/env node
// Génère app/public/exemple-stagiaires.xlsx : données 100 % fictives pour la démo et les tests.
// Les NIR sont des numéros inventés au bon format ; les entreprises utilisent des domaines .example.
import writeExcelFile from 'write-excel-file/node';
import { fileURLToPath } from 'node:url';

const out = fileURLToPath(new URL('../app/public/exemple-stagiaires.xlsx', import.meta.url));

function key(n13) {
  const num = n13.slice(0, 5) + n13.slice(5, 7).replace('2A', '19').replace('2B', '18') + n13.slice(7);
  return String(97n - (BigInt(num) % 97n)).padStart(2, '0');
}
let seq = 101;
function nir(sex, yy, mm, dep, { withKey = true, spaced = true, wrongKey = false } = {}) {
  const commune = String(100 + ((seq * 37) % 800)).padStart(3, '0');
  const order = String(seq).padStart(3, '0');
  seq += 7;
  const body = `${sex}${yy}${mm}${dep}${commune}${order}`;
  let k = key(body);
  if (wrongKey) k = String((Number(k) + 11) % 97).padStart(2, '0');
  if (!withKey) return body;
  return spaced ? `${body[0]} ${body.slice(1, 3)} ${body.slice(3, 5)} ${body.slice(5, 7)} ${body.slice(7, 10)} ${body.slice(10, 13)} ${k}` : body + k;
}
function luhnComplete(prefix13) {
  for (let d = 0; d < 10; d += 1) {
    const s = prefix13 + d;
    let sum = 0;
    for (let i = 0; i < s.length; i += 1) {
      let v = Number(s[s.length - 1 - i]);
      if (i % 2 === 1) { v *= 2; if (v > 9) v -= 9; }
      sum += v;
    }
    if (sum % 10 === 0) return s;
  }
  throw new Error('luhn');
}
const d = (s) => { const [dd, mm, yy] = s.split('/').map(Number); return new Date(Date.UTC(yy, mm - 1, dd)); };

const C = {
  lefevre: { name: 'Menuiserie Lefèvre', siret: luhnComplete('9010012340001'), email: 'rh@menuiserie-lefevre.example' },
  morin: { name: 'Transports Morin', siret: luhnComplete('9020023450001'), email: 'planning@transports-morin.example' },
  halles: { name: 'Boulangerie des Halles', siret: luhnComplete('9030034560001'), email: 'contact@boulangerie-halles.example' },
  moreau: { name: 'Garage Moreau', siret: '', email: 'atelier@garage-moreau.example' },
  tilleuls: { name: 'EHPAD Les Tilleuls', siret: luhnComplete('9050056780001'), email: 'direction@ehpad-tilleuls.example' },
  commune: { name: 'Commune de Saint-Martin', siret: luhnComplete('2140012340001'), email: 'rh@saint-martin.example' },
};

const rows = [];
const add = (nom, prenom, n, c, formation, debut, fin, resultat, session) => rows.push([nom, prenom, n, c.name, c.siret, c.email, formation, d(debut), d(fin), resultat, session]);

// SST initial d'octobre 2024 : MAC à prévoir à l'automne 2026 (avant l'obligation : suivi des recyclages seulement).
add('LEFEBVRE', 'Claire', nir(2, '88', '04', '14'), C.lefevre, 'SST initial', '16/10/2024', '17/10/2024', 'Admis', 'SST-2024-10');
add('BENALI', 'Karim', nir(1, '92', '11', '14'), C.lefevre, 'SST initial', '16/10/2024', '17/10/2024', 'Admis', 'SST-2024-10');
add('MARCHAND', 'Paul', nir(1, '79', '02', '50'), C.lefevre, 'SST initial', '16/10/2024', '17/10/2024', 'Admis', 'SST-2024-10');
add('ROUSSEL', 'Inès', nir(2, '95', '07', '14'), C.halles, 'SST initial', '16/10/2024', '17/10/2024', 'Admis', 'SST-2024-10');
add('GUERIN', 'Hugo', nir(1, '01', '09', '61'), C.halles, 'SST initial', '16/10/2024', '17/10/2024', 'Admis', 'SST-2024-10');
// MAC SST du 1er trimestre 2026 : à déclarer avant le 30/09/2026.
add('MORIN', 'Julien', nir(1, '84', '03', '14', { spaced: false }), C.morin, 'MAC SST', '12/03/2026', '12/03/2026', 'Admis', 'MAC-2026-03');
add('LEROUX', 'Sophie', nir(2, '90', '05', '76', { wrongKey: true }), C.morin, 'MAC SST', '12/03/2026', '12/03/2026', 'Admis', 'MAC-2026-03');
add('FONTAINE', 'Marc', nir(1, '76', '12', '14', { withKey: false }), C.morin, 'MAC SST', '12/03/2026', '12/03/2026', 'Admis', 'MAC-2026-03');
add('CARON', 'Élodie', nir(2, '86', '08', '50'), C.tilleuls, 'MAC SST', '12/03/2026', '12/03/2026', 'Admis', 'MAC-2026-03');
add('PERRIN', 'Nadia', nir(2, '93', '01', '14'), C.tilleuls, 'MAC SST', '12/03/2026', '12/03/2026', 'Non admis', 'MAC-2026-03');
add('LAMBERT', 'Yves', nir(1, '68', '06', '27'), C.tilleuls, 'MAC SST', '12/03/2026', '12/03/2026', 'Admis', 'MAC-2026-03');
// Habilitation électrique du 2e trimestre 2026 : à déclarer avant le 31/12/2026 (un employeur sans SIRET).
add('MOREAU', 'Thomas', nir(1, '89', '10', '14'), C.moreau, 'Habilitation électrique BS-BE', '02/06/2026', '03/06/2026', '', 'HAB-2026-06');
add('BLANC', 'Kevin', nir(1, '97', '04', '14'), C.moreau, 'Habilitation électrique BS-BE', '02/06/2026', '03/06/2026', '', 'HAB-2026-06');
add('NOEL', 'Samuel', nir(1, '82', '09', '61'), C.moreau, 'Habilitation électrique BS-BE', '02/06/2026', '03/06/2026', '', 'HAB-2026-06');
add('ANDRE', 'Lucie', nir(2, '91', '03', '14'), C.commune, 'Habilitation électrique BS-BE', '02/06/2026', '03/06/2026', '', 'HAB-2026-06');
add('GIRARD', 'Bruno', nir(1, '74', '11', '14'), C.commune, 'Habilitation électrique BS-BE', '02/06/2026', '03/06/2026', '', 'HAB-2026-06');
// CACES R489 du 3e trimestre 2026 : à déclarer avant le 31/03/2027.
add('MERCIER', 'Antoine', nir(1, '87', '05', '14'), C.morin, 'CACES R489 cat. 1A-3-5', '08/07/2026', '10/07/2026', 'Admis', 'CACES-2026-07');
add('DUBOIS', 'Rémi', nir(1, '94', '02', '14'), C.morin, 'CACES R489 cat. 1A-3-5', '08/07/2026', '10/07/2026', 'Admis', 'CACES-2026-07');
add('FAURE', 'Jessica', nir(2, '99', '06', '50'), C.morin, 'CACES R489 cat. 1A-3-5', '08/07/2026', '10/07/2026', 'Ajourné', 'CACES-2026-07');
add('HENRY', 'Mathieu', nir(1, '81', '01', '14'), C.morin, 'CACES R489 cat. 1A-3-5', '08/07/2026', '10/07/2026', 'Admis', 'CACES-2026-07');
// Incendie de septembre 2026 (une ligne en double).
const epi = nir(2, '85', '10', '14');
add('LEMOINE', 'Anaïs', epi, C.tilleuls, 'EPI - manipulation des extincteurs', '15/09/2026', '15/09/2026', 'Validé', 'EPI-2026-09');
add('LEMOINE', 'Anaïs', epi, C.tilleuls, 'EPI - manipulation des extincteurs', '15/09/2026', '15/09/2026', 'Validé', 'EPI-2026-09');
add('ROBIN', 'Pierre', nir(1, '72', '07', '14'), C.tilleuls, 'EPI - manipulation des extincteurs', '15/09/2026', '15/09/2026', 'Validé', 'EPI-2026-09');
add('GAUTHIER', 'Emma', nir(2, '98', '12', '14'), C.tilleuls, 'EPI - manipulation des extincteurs', '15/09/2026', '15/09/2026', 'Validé', 'EPI-2026-09');
add('CHEVALIER', 'Louis', nir(1, '03', '04', '14'), C.commune, 'EPI - manipulation des extincteurs', '15/09/2026', '15/09/2026', 'Validé', 'EPI-2026-09');
// SST de janvier 2026 : NIR manquant.
add('BONNET', 'Manon', '', C.halles, 'SST', '19/01/2026', '20/01/2026', 'Admis', 'SST-2026-01');
add('FRANCOIS', 'Enzo', nir(1, '00', '05', '14'), C.halles, 'SST', '19/01/2026', '20/01/2026', 'Admis', 'SST-2026-01');
// Session future : ne peut pas encore être déclarée.
add('BARBIER', 'Léna', nir(2, '96', '09', '14'), C.lefevre, 'SST', '05/11/2026', '06/11/2026', '', 'SST-2026-11');

const header = ['Nom de naissance', 'Prénom', 'N° de sécurité sociale', 'Entreprise', 'SIRET', 'Email entreprise', 'Formation', 'Date de début', 'Date de fin', 'Résultat', 'N° session'];
const sheet = [
  header.map((value) => ({ value, fontWeight: 'bold', backgroundColor: '#E3F0ED' })),
  ...rows.map((r) => r.map((value, i) => (value instanceof Date ? { value, type: Date, format: 'dd/mm/yyyy' } : { value: value === '' ? null : value, type: String }))),
];
await writeExcelFile(sheet, { columns: [18, 12, 26, 26, 17, 32, 30, 13, 13, 11, 15].map((width) => ({ width })), sheet: 'Stagiaires', stickyRowsCount: 1 }).toFile(out);
console.log(`${rows.length} lignes → ${out}`);
