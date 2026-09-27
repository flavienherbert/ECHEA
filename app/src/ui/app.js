// Application Échéa : import → contrôle → export Passeport, suivi des recyclages, catalogue, réglages.
import {
  FREE_EXPORT_LIMIT, FREE_REMINDER_LIMIT, PAYMENT_LINK_MONTHLY, PAYMENT_LINK_YEARLY, LICENSE_PUBLIC_KEY, SOURCES,
  PRICE_MONTHLY_HT, PRICE_YEARLY_HT, STRIPE_MODE, CONTACT_EMAIL,
} from '../config.js';
import { readWorkbook, ImportError } from '../core/importer.js';
import { FIELDS, autoMap, findHeaderRow, missingRequired } from '../core/mapping.js';
import { matchFormation, templateErrors, cloneDefaults, GUIDE_EXAMPLE_SST, FICHES_URL } from '../core/catalogue.js';
import { analyzeRows, buildDeclarations, toRecords, hasError, summarize, usedTemplateErrors, companyKey } from '../core/process.js';
import { buildCsv, ADF_COLUMNS, JDR_COLUMNS, exportFileName } from '../core/csv.js';
import { deadlineStatus, OBLIGATION_START } from '../core/deadlines.js';
import { passagesFromTrainees, mergePassages, upcomingRecyclages, reminderEmail, recyclagesCsv } from '../core/recyclages.js';
import { verifyLicense } from '../core/license.js';
import { checkSiret } from '../core/siret.js';
import { checkCompetences, checkFormacodes, checkNsf, checkRs, QUALIFICATIONS, MODALITES, JDR_TYPES } from '../core/codes.js';
import { todayIso, toFr, toLongFr, diffDays } from '../core/dates.js';
import { normKey, formatEuros, plural, cleanCell } from '../core/text.js';
import { loadState, saveState, emptyState, clearState, exportBackup, importBackup } from './store.js';
import { h, mount, download, copyText, toast, field, select } from './dom.js';
import { initAnalytics, track } from './analytics.js';

const params = new URLSearchParams(window.location.search);
const DEMO = params.get('demo') === '1';
const TODAY = todayIso();

let state = DEMO ? demoState() : loadState();
state.view = 'declarer';
state.work = null;
state.pro = { valid: false };
state.editId = null;
state.recyOpts = { horizon: 365, overdue: true };

const main = document.getElementById('main');
const tabsEl = document.getElementById('tabs');
const dialog = document.getElementById('dialog');

function persist() {
  if (DEMO) return;
  if (!saveState(state)) toast('Stockage local indisponible : vos réglages ne seront pas conservés.', 'error');
}

function demoState() {
  const s = emptyState();
  s.org = { name: 'Organisme Démo', contactName: 'Camille Martin', email: 'contact@organisme-demo.example', phone: '02 00 00 00 00', signature: '' };
  for (const t of s.catalogue) {
    Object.assign(t, GUIDE_EXAMPLE_SST);
    if (t.id === 'mac-sst' || t.id === 'sst') t.unitPrice = 95;
    if (t.id === 'habilitation-electrique') t.unitPrice = 220;
    if (t.id === 'caces') t.unitPrice = 350;
  }
  return s;
}

const isPro = () => !!state.pro?.valid;

// ---------------------------------------------------------------- navigation
const TABS = [
  ['declarer', 'Déclarer'],
  ['recyclages', 'Recyclages'],
  ['formations', 'Formations'],
  ['reglages', 'Réglages'],
];

function renderTabs() {
  const due = recyclageGroups().reduce((n, g) => n + g.items.filter((i) => i.status === 'urgent' || i.status === 'expire').length, 0);
  const incomplete = state.work?.templateIssues ? Object.keys(state.work.templateIssues).length : 0;
  mount(tabsEl, TABS.map(([id, label]) => h('button', {
    class: 'tab', role: 'tab', type: 'button', 'aria-selected': state.view === id ? 'true' : 'false', id: `tab-${id}`,
    onclick: () => go(id),
  }, label, id === 'recyclages' && due ? h('span', { class: 'count', title: 'recyclages urgents' }, due) : null,
  id === 'formations' && incomplete ? h('span', { class: 'count', title: 'formations aux codes incomplets' }, '!') : null)));
  const badge = document.getElementById('plan-badge');
  badge.textContent = isPro() ? 'Pro' : 'Gratuit';
  badge.className = `chip ${isPro() ? 'chip-brand' : 'chip-muted'}`;
}

function go(view, opts = {}) {
  state.view = view;
  if (opts.editId !== undefined) state.editId = opts.editId;
  render();
  main.focus({ preventScroll: true });
  window.scrollTo({ top: 0 });
}

function render() {
  renderTabs();
  const views = { declarer: viewDeclarer, recyclages: viewRecyclages, formations: viewFormations, reglages: viewReglages };
  mount(main, views[state.view]());
}

// ---------------------------------------------------------------- import
async function handleFile(file) {
  mount(main, h('div', { class: 'panel row' }, h('div', { class: 'spinner', 'aria-hidden': 'true' }), h('span', {}, `Lecture de « ${file.name} »…`)));
  try {
    const sheets = await readWorkbook(file);
    let best = 0;
    let bestScore = -1;
    sheets.forEach((s, i) => { const sc = findHeaderRow(s.rows).recognized; if (sc > bestScore) { bestScore = sc; best = i; } });
    state.work = { fileName: file.name, sheets, sheetIndex: best, overrides: {}, step: 'mapping' };
    prepareSheet();
    track('import');
  } catch (e) {
    state.work = null;
    render();
    const msg = e instanceof ImportError ? e.message : 'Lecture impossible : vérifiez que le fichier est un Excel (.xlsx) ou un CSV valide.';
    showImportError(msg);
    return;
  }
  render();
}

function showImportError(msg) {
  const box = document.getElementById('import-error');
  if (box) { box.textContent = msg; box.hidden = false; }
  toast(msg, 'error');
}

function prepareSheet() {
  const w = state.work;
  const rows = w.sheets[w.sheetIndex].rows;
  const { index } = findHeaderRow(rows);
  w.headerIndex = index;
  w.headers = (rows[index] || []).map((c) => cleanCell(c));
  w.dataRows = rows.slice(index + 1);
  w.mapping = autoMap(w.headers);
  w.overrides = {};
  refreshFormationMap();
}

function formationValues() {
  const w = state.work;
  const col = w.mapping.formation;
  const counts = new Map();
  if (col === undefined) return [];
  for (const r of w.dataRows) {
    if (!r || r.every((c) => c === null || c === '')) continue;
    const raw = cleanCell(r[col]);
    if (!raw) continue;
    const k = normKey(raw);
    if (!counts.has(k)) counts.set(k, { key: k, label: raw, count: 0 });
    counts.get(k).count += 1;
  }
  return [...counts.values()].sort((a, b) => b.count - a.count);
}

function refreshFormationMap() {
  const w = state.work;
  w.formationMap = {};
  for (const v of formationValues()) {
    const alias = state.aliases[v.key];
    const t = (alias && state.catalogue.find((c) => c.id === alias)) || matchFormation(v.label, state.catalogue);
    if (t) w.formationMap[v.key] = t.id;
  }
}

async function loadDemoFile() {
  try {
    const res = await fetch('./exemple-stagiaires.xlsx');
    if (!res.ok) throw new Error('indisponible');
    const blob = await res.blob();
    await handleFile(new File([blob], 'exemple-stagiaires.xlsx', { type: blob.type }));
  } catch {
    toast("Le fichier d'exemple n'a pas pu être chargé.", 'error');
  }
}

// ---------------------------------------------------------------- analyse
function analysisRows() {
  const w = state.work;
  return w.dataRows.map((r, i) => {
    const o = w.overrides[i];
    if (!o) return r;
    const copy = [...(r || [])];
    for (const [f, v] of Object.entries(o)) if (w.mapping[f] !== undefined) copy[w.mapping[f]] = v;
    return copy;
  });
}

function runAnalysis() {
  const w = state.work;
  w.trainees = analyzeRows(analysisRows(), w.mapping, w.formationMap, {
    catalogue: state.catalogue, companies: state.companies, today: TODAY,
    unknownResult: state.options.unknownResult, firstRowNumber: w.headerIndex + 2,
  });
  w.trainees.forEach((t) => { t.index = t.rowNumber - w.headerIndex - 2; });
  w.templateIssues = usedTemplateErrors(w.trainees, state.catalogue);
  const exportable = w.trainees.filter((t) => state.options.includeBeforeObligation || !t.dateFin || t.dateFin >= OBLIGATION_START);
  w.declarations = buildDeclarations(exportable, state.catalogue);
  w.summary = summarize(w.trainees);
}

function savePassages() {
  const w = state.work;
  const { passages, added } = mergePassages(state.passages, passagesFromTrainees(w.trainees, state.catalogue));
  state.passages = passages;
  persist();
  return added;
}

// ---------------------------------------------------------------- vue Déclarer
function setStep(step) {
  state.work.step = step;
  render();
  main.focus({ preventScroll: true });
  window.scrollTo({ top: 0 });
}

function stepper(current) {
  const steps = [['import', '1. Importer'], ['mapping', '2. Colonnes'], ['check', '3. Contrôle'], ['export', '4. Export']];
  const idx = steps.findIndex(([id]) => id === current);
  return h('div', { class: 'stepper', 'aria-label': 'Étapes' }, steps.map(([id, label], i) => h('span', { class: i === idx ? 'on' : i < idx ? 'done' : '' }, label)));
}

function viewDeclarer() {
  const w = state.work;
  if (!w) return viewImport();
  if (w.step === 'mapping') return viewMapping();
  if (w.step === 'check') return viewCheck();
  return viewExport();
}

function viewImport() {
  const input = h('input', { type: 'file', accept: '.xlsx,.xlsm,.csv,.txt,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv', id: 'file-input', 'aria-label': 'Choisir un fichier de stagiaires' });
  input.addEventListener('change', () => { if (input.files[0]) handleFile(input.files[0]); });
  const zone = h('label', { class: 'dropzone', for: 'file-input', id: 'dropzone' },
    h('span', { html: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M12 18v-6M9 15l3-3 3 3"/></svg>' }),
    h('strong', {}, 'Déposez votre fichier de stagiaires'),
    h('span', { class: 'muted' }, 'Excel (.xlsx) ou CSV, une ligne par stagiaire — ou cliquez pour le choisir'),
    input);
  zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('over'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('over'));
  zone.addEventListener('drop', (e) => { e.preventDefault(); zone.classList.remove('over'); const f = e.dataTransfer.files[0]; if (f) handleFile(f); });

  const incomplete = state.catalogue.filter((t) => templateErrors(t).length);
  return h('div', { class: 'stack' },
    stepper('import'),
    h('div', { class: 'panel stack' },
      h('div', {}, h('h2', {}, 'Préparer le fichier du Passeport de prévention'),
        h('p', { class: 'muted' }, 'Votre fichier est lu dans ce navigateur : il n’est envoyé nulle part.')),
      zone,
      h('p', { id: 'import-error', class: 'notice notice-danger', role: 'alert', hidden: true }),
      h('div', { class: 'row' },
        h('button', { class: 'btn btn-secondary', type: 'button', id: 'load-demo', onclick: loadDemoFile }, 'Essayer avec le fichier d’exemple'),
        h('a', { class: 'btn btn-ghost', href: './exemple-stagiaires.xlsx', download: 'modele-stagiaires-echea.xlsx' }, 'Télécharger le modèle Excel'))),
    h('div', { class: 'panel' },
      h('h3', {}, 'Colonnes utiles'),
      h('p', { class: 'muted small' }, 'Nom de naissance, prénom, NIR, formation, date de début, date de fin (obligatoires). Entreprise, SIRET, email de l’entreprise, résultat, n° de session (conseillés). Les intitulés n’ont pas besoin d’être exacts : Échéa les reconnaît.')),
    incomplete.length && !DEMO ? h('div', { class: 'notice notice-warn' },
      h('b', {}, 'Avant votre premier export : '), 'renseignez les codes (ROME, Formacode, NSF) des formations que vous déclarez, une fois pour toutes. ',
      h('button', { class: 'btn btn-ghost btn-small', type: 'button', onclick: () => go('formations') }, 'Ouvrir les formations')) : null);
}

function viewMapping() {
  const w = state.work;
  const missing = missingRequired(w.mapping);
  const colOptions = [['', '— Aucune colonne —'], ...w.headers.map((hd, i) => [String(i), `${colLetter(i)} · ${hd || '(sans titre)'}`])];
  const sampleOf = (i) => {
    for (const r of w.dataRows.slice(0, 30)) { const v = r?.[i]; if (v !== null && v !== undefined && String(v).trim() !== '') return v instanceof Date ? toFr(v.toISOString().slice(0, 10)) : String(v); }
    return '';
  };
  const mapItems = FIELDS.map((f) => {
    const sel = select(colOptions, w.mapping[f.id] ?? '', { 'data-field': f.id, 'aria-label': `Colonne pour ${f.label}` });
    sel.addEventListener('change', () => {
      if (sel.value === '') delete w.mapping[f.id]; else {
        for (const [k, v] of Object.entries(w.mapping)) if (v === Number(sel.value) && k !== f.id) delete w.mapping[k];
        w.mapping[f.id] = Number(sel.value);
      }
      if (f.id === 'formation') refreshFormationMap();
      render();
    });
    const colIdx = w.mapping[f.id];
    const isMissing = f.required && colIdx === undefined && !(f.id === 'dateFin');
    return h('div', { class: `map-item${isMissing ? ' missing' : ''}` },
      h('label', {}, f.label, f.required ? h('span', { class: 'req' }, ' *') : null),
      sel,
      colIdx !== undefined ? h('span', { class: 'sample' }, `ex. ${sampleOf(colIdx) || '(vide)'}`) : f.id === 'dateFin' ? h('span', { class: 'sample' }, 'sans colonne : la date de début sert de date de fin') : null);
  });

  const values = formationValues();
  const catOptions = [['', '— Choisir une formation —'], ...state.catalogue.map((t) => [t.id, t.label]), ['__new', '+ Créer une formation avec cet intitulé']];
  const formationRows = values.map((v) => {
    const sel = select(catOptions, w.formationMap[v.key] || '', { 'aria-label': `Formation du catalogue pour ${v.label}` });
    sel.addEventListener('change', () => {
      let id = sel.value;
      if (id === '__new') {
        id = `custom-${Date.now().toString(36)}`;
        state.catalogue.push({ ...cloneDefaults()[6], id, label: v.label.slice(0, 250), jdrName: '', match: [], exclude: [], declareAs: 'ADF', validityMonths: 0, recycleMonths: 0, recycleLabel: `Recyclage ${v.label}`.slice(0, 80), source: 'Formation ajoutée par l’organisme.', custom: true });
      }
      if (id) { w.formationMap[v.key] = id; state.aliases[v.key] = id; } else { delete w.formationMap[v.key]; delete state.aliases[v.key]; }
      persist();
      render();
    });
    const t = state.catalogue.find((c) => c.id === w.formationMap[v.key]);
    const errs = t ? templateErrors(t) : [];
    return h('tr', {},
      h('td', { 'data-label': 'Intitulé' }, h('b', {}, v.label)), h('td', { class: 'num', 'data-label': 'Lignes' }, v.count), h('td', { 'data-label': 'Formation Échéa' }, sel),
      h('td', { 'data-label': 'État' }, !t ? h('span', { class: 'chip chip-danger' }, 'à associer')
        : errs.length ? h('button', { class: 'btn btn-ghost btn-small', type: 'button', onclick: () => go('formations', { editId: t.id }) }, 'Compléter les codes')
          : h('span', { class: 'chip chip-ok' }, 'prête')));
  });

  const sheetSelect = w.sheets.length > 1 ? field('Feuille du classeur', (() => {
    const s = select(w.sheets.map((sh, i) => [String(i), sh.name]), String(w.sheetIndex));
    s.addEventListener('change', () => { w.sheetIndex = Number(s.value); prepareSheet(); render(); });
    return s;
  })()) : null;

  const resultOpt = w.mapping.resultat === undefined ? h('div', { class: 'notice' },
    h('p', { class: 'small', style: 'margin-bottom:8px' }, h('b', {}, 'Pas de colonne « résultat ». '), 'Les stagiaires reçus au SST, au CACES… sont déclarés en justificatif de réussite, les autres en attestation de formation.'),
    h('div', { class: 'row' }, radio('unknownResult', 'success', 'Tous ont réussi'), radio('unknownResult', 'unknown', 'Déclarer en attestation de formation'))) : null;

  const lines = w.dataRows.filter((r) => r && r.some((c) => c !== null && String(c).trim() !== '')).length;
  const unmatched = values.filter((v) => !w.formationMap[v.key]).length;
  const canCheck = !missing.length && lines > 0;
  return h('div', { class: 'stack' },
    stepper('mapping'),
    h('div', { class: 'panel stack' },
      h('div', { class: 'spread' },
        h('div', {}, h('h2', {}, w.fileName), h('span', { class: 'muted small' }, `${plural(lines, 'ligne de données', 'lignes de données')} · en-tête ligne ${w.headerIndex + 1}`)),
        h('button', { class: 'btn btn-secondary btn-small', type: 'button', onclick: () => { state.work = null; render(); } }, 'Changer de fichier')),
      sheetSelect,
      h('h3', {}, 'Correspondance des colonnes'),
      missing.length ? h('p', { class: 'notice notice-danger', role: 'alert' }, `Colonne obligatoire non trouvée : ${missing.join(', ')}. Choisissez-la ci-dessous.`) : h('p', { class: 'notice notice-ok small' }, 'Colonnes obligatoires reconnues. Vérifiez les exemples affichés.'),
      h('div', { class: 'map-grid' }, mapItems)),
    values.length ? h('div', { class: 'panel stack' },
      h('h3', {}, 'Formations du fichier'),
      h('p', { class: 'muted small' }, 'Chaque intitulé est rattaché à une formation du catalogue, qui porte les codes et les durées. Votre choix est retenu pour les prochains imports.'),
      h('div', { class: 'table-wrap' }, h('table', { class: 'data stack-sm' }, h('thead', {}, h('tr', {}, h('th', {}, 'Intitulé dans le fichier'), h('th', {}, 'Lignes'), h('th', {}, 'Formation Échéa'), h('th', {}, 'État'))), h('tbody', {}, formationRows))),
      unmatched ? h('p', { class: 'small muted' }, `${plural(unmatched, 'intitulé non associé', 'intitulés non associés')} : les lignes concernées seront signalées.`) : null) : null,
    resultOpt,
    h('div', { class: 'row end' }, h('button', { class: 'btn btn-primary', type: 'button', id: 'run-check', disabled: !canCheck, onclick: () => { runAnalysis(); w.added = savePassages(); track('check'); setStep('check'); } }, `Contrôler ${plural(lines, 'ligne', 'lignes')}`)));
}

function radio(name, value, label) {
  const id = `${name}-${value}`;
  const input = h('input', { type: 'radio', name, id, value, checked: state.options[name] === value });
  input.addEventListener('change', () => { state.options[name] = value; persist(); });
  return h('label', { class: 'check', for: id }, input, label);
}

function colLetter(i) {
  let s = '';
  let n = i + 1;
  while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); }
  return s;
}

const FIELD_LABEL = { nom: 'Nom', nir: 'NIR', formation: 'Formation', dateDebut: 'Début', dateFin: 'Fin', siret: 'SIRET', resultat: 'Résultat' };
const EDITABLE = ['nom', 'nir', 'dateDebut', 'dateFin', 'siret'];

function viewCheck() {
  const w = state.work;
  const s = w.summary;
  const tplIssues = Object.entries(w.templateIssues);
  const errorRows = w.trainees.filter(hasError);
  const warnRows = w.trainees.filter((t) => !hasError(t) && t.issues.length);
  const noSiret = new Map();
  for (const t of w.trainees) {
    if (t.entreprise && !t.siret && t.issues.some((x) => x.field === 'siret' && /manquant/.test(x.message))) {
      const k = companyKey(t.entreprise, '');
      if (!noSiret.has(k)) noSiret.set(k, { key: k, name: t.entreprise, count: 0, email: t.emailEntreprise });
      noSiret.get(k).count += 1;
    }
  }
  const valid = w.declarations.reduce((n, d) => n + d.trainees.length, 0);

  const companyBlock = noSiret.size ? h('div', { class: 'panel stack' },
    h('h3', {}, `Entreprises sans SIRET (${noSiret.size})`),
    h('p', { class: 'muted small' }, 'Saisissez le SIRET une seule fois : il est retenu pour les prochains imports. Vous le trouvez sur annuaire-entreprises.data.gouv.fr.'),
    ...[...noSiret.values()].map((c) => {
      const inp = h('input', { type: 'text', inputmode: 'numeric', placeholder: '14 chiffres', 'aria-label': `SIRET de ${c.name}` });
      const btn = h('button', { class: 'btn btn-secondary btn-small', type: 'button' }, 'Enregistrer');
      const apply = () => {
        const chk = checkSiret(inp.value);
        if (chk.error) { inp.classList.add('invalid'); toast(chk.error, 'error'); return; }
        state.companies[c.key] = { ...(state.companies[c.key] || {}), name: c.name, siret: chk.value, email: state.companies[c.key]?.email || c.email || '' };
        state.companies[companyKey(c.name, chk.value)] = state.companies[c.key];
        persist();
        runAnalysis();
        render();
        toast(`SIRET enregistré pour ${c.name}`);
      };
      btn.addEventListener('click', apply);
      inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') apply(); });
      return h('div', { class: 'spread' }, h('span', {}, h('b', {}, c.name), h('span', { class: 'muted small' }, ` · ${plural(c.count, 'stagiaire', 'stagiaires')}`)), h('div', { class: 'inline-fix' }, inp, btn));
    })) : null;

  const shown = errorRows.slice(0, 200);
  const errorTable = errorRows.length ? h('div', { class: 'panel stack' },
    h('div', { class: 'spread' }, h('h3', {}, `Lignes à corriger (${errorRows.length})`),
      h('button', { class: 'btn btn-ghost btn-small', type: 'button', onclick: downloadErrorReport }, 'Télécharger la liste (Excel)')),
    h('p', { class: 'muted small' }, 'Ces lignes sont écartées du fichier pour qu’il ne soit pas rejeté. Corrigez-les ici ou dans votre fichier, puis relancez.'),
    h('div', { class: 'table-wrap' }, h('table', { class: 'data stack-sm' },
      h('thead', {}, h('tr', {}, h('th', {}, 'Ligne'), h('th', {}, 'Stagiaire'), h('th', {}, 'Problème'))),
      h('tbody', {}, shown.map((t) => h('tr', {},
        h('td', { class: 'num', 'data-label': 'Ligne' }, t.rowNumber),
        h('td', { 'data-label': 'Stagiaire' }, h('b', {}, t.nom || '(sans nom)'), t.prenom ? ` ${t.prenom}` : '', h('div', { class: 'muted small' }, t.formationRaw || '')),
        h('td', { 'data-label': 'Problème' }, t.issues.map((x) => h('div', {}, h('span', { class: `issue ${x.level}` }, `${FIELD_LABEL[x.field] || x.field} : ${x.message}`),
          x.level === 'error' && EDITABLE.includes(x.field) && w.mapping[x.field] !== undefined && !/manquant pour|doublon/.test(x.message) ? inlineFix(t, x.field) : null)))))))),
    errorRows.length > shown.length ? h('p', { class: 'small muted' }, `… et ${errorRows.length - shown.length} autres lignes (voir la liste téléchargeable).`) : null) : null;

  const warnBlock = warnRows.length ? h('details', { class: 'panel more' },
    h('summary', {}, `Avertissements (${warnRows.length}) : lignes exportées, à vérifier`),
    h('ul', { class: 'small' }, warnRows.slice(0, 200).map((t) => h('li', {}, `Ligne ${t.rowNumber} · ${t.nom} : ${t.issues.map((x) => x.message).join(' ; ')}`)))) : null;

  const declTable = w.declarations.length ? h('div', { class: 'panel stack' },
    h('h3', {}, `Déclarations prêtes (${w.declarations.length})`),
    h('div', { class: 'table-wrap' }, h('table', { class: 'data stack-sm' },
      h('thead', {}, h('tr', {}, h('th', {}, 'Formation'), h('th', {}, 'Type'), h('th', {}, 'Dates'), h('th', {}, 'Stagiaires'), h('th', {}, 'À déclarer avant'))),
      h('tbody', {}, w.declarations.map((d) => h('tr', {},
        h('td', { 'data-label': 'Formation' }, h('b', {}, d.template.label)), h('td', { 'data-label': 'Type' }, h('span', { class: `chip ${d.kind === 'JDR' ? 'chip-brand' : 'chip-muted'}`, title: d.kind === 'JDR' ? 'Justificatif de réussite' : 'Attestation de formation' }, d.kind)),
        h('td', { 'data-label': 'Dates' }, d.dateDebut === d.dateFin ? toFr(d.dateFin) : `${toFr(d.dateDebut)} → ${toFr(d.dateFin)}`),
        h('td', { class: 'num', 'data-label': 'Stagiaires' }, d.trainees.length), h('td', { 'data-label': 'À déclarer avant' }, deadlineChip(d.deadline))))))),
    h('p', { class: 'small muted' }, 'Délais officiels : formations 2026, 6 mois après la fin du trimestre ; à partir de 2027, 3 mois. ', h('a', { href: SOURCES.obligations, target: '_blank', rel: 'noopener' }, 'Source'))) : null;

  const before = w.trainees.filter((t) => !hasError(t) && t.dateFin && t.dateFin < OBLIGATION_START).length;
  return h('div', { class: 'stack' },
    stepper('check'),
    h('div', { class: 'kpis' },
      kpi(s.total, 'lignes lues'), kpi(valid, 'prêtes à déclarer', 'good'), kpi(s.errors, 'à corriger', s.errors ? 'bad' : 'good'), kpi(s.warnings, 'avertissements', s.warnings ? 'warn' : '')),
    tplIssues.length ? h('div', { class: 'notice notice-danger stack', role: 'alert' },
      h('b', {}, 'Codes à compléter avant l’export'),
      ...tplIssues.map(([id, errs]) => {
        const t = state.catalogue.find((c) => c.id === id);
        return h('div', { class: 'spread' }, h('span', {}, `${t.label} : ${errs[0]}${errs.length > 1 ? ` (+${errs.length - 1})` : ''}`),
          h('button', { class: 'btn btn-secondary btn-small', type: 'button', onclick: () => go('formations', { editId: id }) }, 'Compléter'));
      })) : null,
    before && !state.options.includeBeforeObligation ? h('p', { class: 'notice small' }, `${plural(before, 'stagiaire formé', 'stagiaires formés')} avant le 01/09/2025 : déclaration non obligatoire, ${before > 1 ? 'ils sont exclus' : 'il est exclu'} du fichier (modifiable à l’export). Ils restent dans le suivi des recyclages.`) : null,
    companyBlock, errorTable, declTable, warnBlock,
    h('div', { class: 'spread' },
      h('button', { class: 'btn btn-secondary', type: 'button', onclick: () => setStep('mapping') }, 'Retour aux colonnes'),
      h('button', { class: 'btn btn-primary', type: 'button', id: 'go-export', disabled: !w.declarations.length, onclick: () => { w.added = savePassages(); setStep('export'); } },
        w.declarations.length ? `Préparer le fichier (${plural(valid, 'stagiaire', 'stagiaires')})` : 'Aucune ligne prête à déclarer')));
}

function inlineFix(t, fieldId) {
  const w = state.work;
  const current = w.overrides[t.index]?.[fieldId] ?? cellValue(t.index, fieldId);
  const inp = h('input', { type: 'text', value: current, 'aria-label': `Corriger ${FIELD_LABEL[fieldId]} ligne ${t.rowNumber}` });
  const apply = () => {
    w.overrides[t.index] = { ...(w.overrides[t.index] || {}), [fieldId]: inp.value };
    runAnalysis();
    render();
  };
  inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') apply(); });
  return h('div', { class: 'inline-fix' }, inp, h('button', { class: 'btn btn-secondary btn-small', type: 'button', onclick: apply }, 'Corriger'));
}

function cellValue(index, fieldId) {
  const w = state.work;
  const v = w.dataRows[index]?.[w.mapping[fieldId]];
  if (v instanceof Date) return toFr(v.toISOString().slice(0, 10));
  return v === null || v === undefined ? '' : String(v);
}

function kpi(value, label, kind = '') {
  return h('div', { class: `kpi ${kind}` }, h('b', {}, value), h('span', {}, label));
}

function deadlineChip(deadline) {
  const st = deadlineStatus(deadline, TODAY);
  if (!deadline) return h('span', { class: 'chip chip-muted' }, 'non obligatoire');
  const cls = { depassee: 'chip-danger', urgent: 'chip-danger', bientot: 'chip-warn', ok: 'chip-ok' }[st];
  const days = diffDays(TODAY, deadline);
  const hint = st === 'depassee' ? ' (dépassée)' : days <= 90 ? ` (J-${days})` : '';
  return h('span', { class: `chip ${cls}` }, `${toFr(deadline)}${hint}`);
}

function downloadErrorReport() {
  const w = state.work;
  const esc = (v) => (/[;"\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v ?? ''));
  const lines = ['Ligne;Nom;Prénom;Formation;Problème'];
  for (const t of w.trainees.filter(hasError)) lines.push([t.rowNumber, t.nom, t.prenom, t.formationRaw, t.issues.filter((x) => x.level === 'error').map((x) => `${FIELD_LABEL[x.field] || x.field} : ${x.message}`).join(' | ')].map(esc).join(';'));
  download(`echea-lignes-a-corriger-${TODAY}.csv`, `﻿${lines.join('\r\n')}\r\n`);
}

// ---------------------------------------------------------------- export
function freeSelection(declarations) {
  const picked = [];
  let n = 0;
  for (const d of declarations) {
    if (n + d.trainees.length > FREE_EXPORT_LIMIT) continue;
    picked.push(d);
    n += d.trainees.length;
  }
  return { picked, count: n };
}

function viewExport() {
  const w = state.work;
  const includeBefore = h('input', { type: 'checkbox', id: 'include-before', checked: state.options.includeBeforeObligation });
  includeBefore.addEventListener('change', () => { state.options.includeBeforeObligation = includeBefore.checked; persist(); runAnalysis(); render(); });

  const blocks = ['JDR', 'ADF'].map((kind) => {
    const decls = w.declarations.filter((d) => d.kind === kind);
    if (!decls.length) return null;
    const total = decls.reduce((n, d) => n + d.trainees.length, 0);
    const columns = kind === 'ADF' ? ADF_COLUMNS : JDR_COLUMNS;
    const title = kind === 'ADF' ? 'Attestations de formation (ADF)' : 'Justificatifs de réussite (JDR)';
    const doDownload = (list, suffix = '') => {
      const recs = toRecords(list)[kind];
      const csv = buildCsv(columns, recs);
      download(exportFileName(kind + suffix, state.org.name, TODAY, recs.length), csv);
      track(`export-${kind.toLowerCase()}${suffix ? '-test' : ''}`);
      toast(`Fichier ${kind} téléchargé : ${plural(recs.length, 'stagiaire', 'stagiaires')}.`);
    };
    const preview = buildCsv(columns, toRecords(decls.slice(0, 1))[kind].slice(0, 2)).split('\r\n').filter(Boolean).join('\n');
    const allowed = isPro() || total <= FREE_EXPORT_LIMIT;
    const free = freeSelection(decls);
    return h('div', { class: 'panel stack', dataset: { kind } },
      h('div', { class: 'spread' },
        h('div', {}, h('h3', { style: 'margin:0' }, title), h('span', { class: 'muted small' }, `${plural(total, 'stagiaire', 'stagiaires')} · ${plural(decls.length, 'déclaration', 'déclarations')} · ${columns.length} colonnes`)),
        h('button', { class: 'btn btn-primary', type: 'button', id: `dl-${kind.toLowerCase()}`, disabled: !allowed, onclick: () => doDownload(decls) }, `Télécharger le fichier ${kind}`)),
      !allowed ? h('div', { class: 'upsell stack' },
        h('div', {}, h('h3', {}, `${total} stagiaires : passez en Pro pour tout exporter`),
          h('p', { class: 'small', style: 'margin:0' }, `La version gratuite exporte des sessions complètes jusqu’à ${FREE_EXPORT_LIMIT} stagiaires, pour tester un premier dépôt.`)),
        h('div', { class: 'row' },
          h('a', { class: 'btn btn-primary btn-small', href: PAYMENT_LINK_MONTHLY, target: '_blank', rel: 'noopener', onclick: () => track('pay-monthly-app') }, `Pro · ${PRICE_MONTHLY_HT} € HT/mois`),
          h('a', { class: 'btn btn-secondary btn-small', href: PAYMENT_LINK_YEARLY, target: '_blank', rel: 'noopener', onclick: () => track('pay-yearly-app') }, `${PRICE_YEARLY_HT} € HT/an`),
          free.picked.length ? h('button', { class: 'btn btn-ghost btn-small', type: 'button', id: `dl-${kind.toLowerCase()}-test`, onclick: () => doDownload(free.picked, '_TEST') }, `Fichier test (${plural(free.count, 'stagiaire', 'stagiaires')})`) : null),
        STRIPE_MODE === 'test' ? h('p', { class: 'small muted', style: 'margin:0' }, 'Paiements en mode test : aucune carte n’est débitée.') : null) : null,
      h('details', { class: 'more' }, h('summary', {}, 'Aperçu des premières lignes'), h('pre', { class: 'preview' }, preview)));
  });

  const before = w.trainees.filter((t) => !hasError(t) && t.dateFin && t.dateFin < OBLIGATION_START).length;
  return h('div', { class: 'stack' },
    stepper('export'),
    h('div', { class: 'panel stack' },
      h('h2', {}, 'Vos fichiers pour le Passeport de prévention'),
      h('p', { class: 'muted', style: 'margin:0' }, 'CSV UTF-8, séparateur « | », colonnes dans l’ordre des guides officiels. Les lignes en erreur sont exclues.'),
      before ? h('label', { class: 'check', for: 'include-before' }, includeBefore, `Inclure ${plural(before, 'stagiaire formé', 'stagiaires formés')} avant le 01/09/2025 (non obligatoire)`) : null),
    ...blocks,
    h('div', { class: 'panel' },
      h('h3', {}, 'Déposer le fichier'),
      h('ol', { class: 'small' },
        h('li', {}, 'Connectez-vous au portail du Passeport de prévention avec vos accès Net-entreprises.'),
        h('li', {}, 'Choisissez la déclaration par fichier : « attestations de formation » pour le fichier ADF, « justificatifs de réussite » pour le fichier JDR.'),
        h('li', {}, 'Importez le fichier. Le portail contrôle ensuite l’existence des codes, du SIRET et du couple NIR / nom de naissance.')),
      h('p', { class: 'small muted', style: 'margin:0' }, h('a', { href: SOURCES.portail, target: '_blank', rel: 'noopener' }, 'Portail du Passeport de prévention'), ' · ',
        h('a', { href: SOURCES.guideAdf, target: '_blank', rel: 'noopener' }, 'Guide ADF'), ' · ', h('a', { href: SOURCES.guideJdr, target: '_blank', rel: 'noopener' }, 'Guide JDR'))),
    h('p', { class: 'notice notice-ok small' }, `Suivi des recyclages mis à jour${w.added ? ` : ${plural(w.added, 'nouveau passage', 'nouveaux passages')}` : ''}. `, h('button', { class: 'btn btn-ghost btn-small', type: 'button', onclick: () => go('recyclages') }, 'Voir les recyclages')),
    h('div', { class: 'spread' },
      h('button', { class: 'btn btn-secondary', type: 'button', onclick: () => setStep('check') }, 'Retour au contrôle'),
      h('button', { class: 'btn btn-secondary', type: 'button', onclick: () => { state.work = null; render(); } }, 'Importer un autre fichier')));
}

// ---------------------------------------------------------------- recyclages
function recyclageGroups() {
  return upcomingRecyclages(state.passages, state.catalogue, {
    today: TODAY, horizonDays: state.recyOpts.horizon, overdueDays: state.recyOpts.overdue ? 180 : 0, companies: state.companies,
  });
}

function viewRecyclages() {
  const groups = recyclageGroups();
  const horizon = select([['90', '3 prochains mois'], ['180', '6 prochains mois'], ['365', '12 prochains mois'], ['730', '24 prochains mois']], String(state.recyOpts.horizon), { 'aria-label': 'Horizon' });
  horizon.addEventListener('change', () => { state.recyOpts.horizon = Number(horizon.value); render(); });
  const overdue = h('input', { type: 'checkbox', id: 'recy-overdue', checked: state.recyOpts.overdue });
  overdue.addEventListener('change', () => { state.recyOpts.overdue = overdue.checked; render(); });

  if (!state.passages.length) {
    return h('div', { class: 'panel empty' },
      h('strong', {}, 'Aucun stagiaire suivi pour l’instant'),
      h('p', {}, 'Importez un fichier dans l’onglet Déclarer : Échéa retient qui a été formé, quand et pour quelle entreprise, puis calcule les recyclages.'),
      h('button', { class: 'btn btn-primary', type: 'button', onclick: () => go('declarer') }, 'Importer un fichier'));
  }
  const items = groups.flatMap((g) => g.items);
  const amount = groups.reduce((s, g) => s + g.amount, 0);
  return h('div', { class: 'stack' },
    h('div', { class: 'panel spread' },
      h('div', {}, h('h2', { style: 'margin:0' }, 'Recyclages à venir'), h('span', { class: 'muted small' }, 'Regroupés par entreprise cliente. Les emails partent de votre messagerie.')),
      h('div', { class: 'row' }, horizon, h('label', { class: 'check small', for: 'recy-overdue' }, overdue, 'inclure les validités expirées'),
        h('button', { class: 'btn btn-secondary btn-small', type: 'button', disabled: !items.length, onclick: () => { download(`echea-recyclages-${TODAY}.csv`, recyclagesCsv(groups)); track('export-recyclages'); } }, 'Exporter (Excel)'))),
    h('div', { class: 'kpis' },
      kpi(items.length, 'stagiaires à recycler'), kpi(groups.length, 'entreprises'),
      kpi(items.filter((i) => i.status === 'urgent' || i.status === 'expire').length, 'dans moins de 60 jours', 'bad'),
      kpi(amount ? formatEuros(amount) : '—', amount ? 'de chiffre d’affaires HT estimé' : 'prix à renseigner (Formations)', amount ? 'good' : '')),
    groups.length ? h('div', { class: 'list' }, groups.map((g, i) => companyCard(g, i))) : h('div', { class: 'panel empty' }, h('strong', {}, 'Rien à relancer sur cette période'), h('p', {}, 'Élargissez l’horizon ou importez d’autres sessions.')));
}

const STATUS = { expire: ['chip-danger', 'expiré'], urgent: ['chip-danger', '< 60 jours'], 'a-relancer': ['chip-warn', 'à relancer'], 'plus-tard': ['chip-muted', 'plus tard'] };

function companyCard(g, index) {
  const locked = !isPro() && index >= FREE_REMINDER_LIMIT;
  const known = state.companies[g.key] || {};
  const lastSent = known.lastReminder;
  return h('article', { class: 'company' },
    h('div', { class: 'company-head' },
      h('div', {}, h('h3', {}, g.entreprise), h('span', { class: 'muted small' }, [g.siret ? `SIRET ${g.siret}` : 'SIRET non renseigné', g.email || 'email non renseigné'].join(' · '))),
      h('span', { class: 'chip chip-brand' }, `${plural(g.total, 'salarié', 'salariés')}${g.amount ? ` · ${formatEuros(g.amount)} HT` : ''}`)),
    h('div', { class: 'company-items' }, g.items.map((i) => h('div', { class: 'company-item' },
      h('span', {}, h('b', {}, [i.prenom, i.nom].filter(Boolean).join(' ')), ` — ${i.label}`, h('span', { class: 'muted' }, ` (formation du ${toFr(i.dateFin)})`)),
      h('span', { class: `chip ${STATUS[i.status][0]}` }, `${i.days < 0 ? 'expiré le' : 'avant le'} ${toFr(i.due)}`)))),
    h('div', { class: 'company-actions' },
      locked ? h('span', { class: 'small muted' }, `Version gratuite : emails pour ${FREE_REMINDER_LIMIT} entreprises. `, h('a', { href: PAYMENT_LINK_MONTHLY, target: '_blank', rel: 'noopener' }, 'Passer en Pro'))
        : h('button', { class: 'btn btn-primary btn-small', type: 'button', onclick: () => openReminder(g) }, 'Préparer l’email'),
      lastSent ? h('span', { class: 'chip chip-ok' }, `relancée le ${toFr(lastSent)}`) : null));
}

function openReminder(g) {
  const key = g.key;
  const known = state.companies[key] || {};
  const to = h('input', { type: 'email', value: known.email || g.email || '', placeholder: 'email de l’entreprise', 'aria-label': 'Destinataire' });
  const mail = reminderEmail({ ...g, email: to.value }, state.org);
  const subject = h('input', { type: 'text', value: mail.subject, 'aria-label': 'Objet' });
  const body = h('textarea', { rows: 12, 'aria-label': 'Message' });
  body.value = mail.body;
  const open = h('a', { class: 'btn btn-primary', href: '#' }, 'Ouvrir dans ma messagerie');
  const sync = () => { open.href = `mailto:${encodeURIComponent(to.value)}?subject=${encodeURIComponent(subject.value)}&body=${encodeURIComponent(body.value)}`; };
  [to, subject, body].forEach((el) => el.addEventListener('input', sync));
  sync();
  const markSent = () => {
    state.companies[key] = { ...(state.companies[key] || {}), name: g.entreprise, siret: g.siret || known.siret || '', email: to.value, lastReminder: TODAY };
    persist();
    dialog.close();
    render();
    toast('Relance notée.');
  };
  open.addEventListener('click', () => { track('reminder-open'); setTimeout(markSent, 300); });
  mount(dialog, h('div', { class: 'dialog-inner' },
    h('div', { class: 'spread' }, h('h2', {}, `Relance · ${g.entreprise}`), h('button', { class: 'btn btn-ghost btn-small', type: 'button', onclick: () => dialog.close(), 'aria-label': 'Fermer' }, 'Fermer')),
    !state.org.name ? h('p', { class: 'notice notice-warn small' }, 'Renseignez le nom de votre organisme et votre signature dans Réglages pour personnaliser l’email.') : null,
    field('À', to), field('Objet', subject), field('Message', body),
    h('div', { class: 'row' }, open,
      h('button', { class: 'btn btn-secondary', type: 'button', onclick: async () => { const ok = await copyText(`${subject.value}\n\n${body.value}`); toast(ok ? 'Email copié.' : 'Copie impossible.', ok ? 'ok' : 'error'); } }, 'Copier le texte'),
      h('button', { class: 'btn btn-ghost', type: 'button', onclick: markSent }, 'Marquer comme relancée'))));
  dialog.showModal();
}

// ---------------------------------------------------------------- formations
function viewFormations() {
  const list = state.catalogue;
  const add = () => {
    const id = `custom-${Date.now().toString(36)}`;
    state.catalogue.push({ ...cloneDefaults()[6], id, label: 'Nouvelle formation', jdrName: '', match: [], exclude: [], declareAs: 'ADF', validityMonths: 0, recycleMonths: 0, recycleLabel: 'Recyclage', source: 'Formation ajoutée par l’organisme.', custom: true });
    state.editId = id;
    persist();
    render();
  };
  return h('div', { class: 'stack' },
    h('div', { class: 'panel stack' },
      h('div', { class: 'spread' }, h('h2', { style: 'margin:0' }, 'Formations et codes'), h('button', { class: 'btn btn-secondary btn-small', type: 'button', onclick: add }, 'Ajouter une formation')),
      h('p', { class: 'muted small', style: 'margin:0' }, 'Recopiez une fois les codes de chaque formation depuis les fiches pratiques officielles du portail. Échéa contrôle leur format ; le portail contrôle leur existence. ',
        h('a', { href: FICHES_URL, target: '_blank', rel: 'noopener' }, 'Fiches pratiques officielles'))),
    state.work ? h('p', { class: 'notice notice-brand small' }, 'Un import est en cours. ', h('button', { class: 'btn btn-ghost btn-small', type: 'button', onclick: () => { if (state.work.step !== 'mapping') runAnalysis(); go('declarer'); } }, 'Revenir à l’import')) : null,
    h('div', { class: 'list' }, list.map((t) => templateCard(t))));
}

function templateCard(t) {
  const errs = templateErrors(t);
  const open = state.editId === t.id;
  const meta = [
    t.declareAs === 'JDR' ? `reçus : justificatif (${t.jdrType.toLowerCase()})` : 'attestation de formation',
    t.validityMonths ? `validité ${t.validityMonths} mois` : 'sans date de fin de validité',
    t.recycleMonths ? `relance à ${t.recycleMonths} mois` : 'pas de relance',
  ].join(' · ');
  return h('article', { class: 'tpl', id: `tpl-${t.id}` },
    h('div', { class: 'tpl-head' },
      h('div', {}, h('h3', {}, t.label), h('div', { class: 'tpl-meta' }, meta)),
      h('div', { class: 'row' }, errs.length ? h('span', { class: 'chip chip-warn' }, 'codes à compléter') : h('span', { class: 'chip chip-ok' }, 'prête'),
        h('button', { class: 'btn btn-secondary btn-small', type: 'button', 'aria-expanded': open ? 'true' : 'false', onclick: () => { state.editId = open ? null : t.id; render(); if (!open) document.getElementById(`tpl-${t.id}`)?.scrollIntoView({ block: 'start' }); } }, open ? 'Fermer' : 'Modifier'))),
    open ? templateEditor(t) : null);
}

function templateEditor(t) {
  const draft = { ...t };
  const inputs = {};
  const txt = (key, label, hint, attrs = {}) => {
    const el = h('input', { type: 'text', value: draft[key] ?? '', ...attrs });
    el.addEventListener('input', () => { draft[key] = el.value; update(); });
    inputs[key] = el;
    return field(label, el, hint);
  };
  const num = (key, label, hint) => {
    const el = h('input', { type: 'number', min: '0', max: '240', step: '1', value: draft[key] || 0 });
    el.addEventListener('input', () => { draft[key] = Number(el.value) || 0; update(); });
    return field(label, el, hint);
  };
  const sel = (key, label, options, hint) => {
    const el = select(options, draft[key] ?? '');
    el.addEventListener('change', () => { draft[key] = el.value; update(); });
    return field(label, el, hint);
  };
  const certif = h('input', { type: 'checkbox', id: `cert-${t.id}`, checked: !!draft.certifiante });
  certif.addEventListener('change', () => { draft.certifiante = certif.checked; update(); });
  const errBox = h('ul', { class: 'tpl-errors' });
  const certBlock = h('div', { class: 'fields two' });
  const nonCertBlock = h('div', { class: 'fields two' },
    txt('formacodes', 'Formacodes (1 à 5)', 'ex. 42829/42817 — séparés par /', { inputmode: 'numeric' }),
    txt('nsf', 'Codes NSF (1 à 3)', 'ex. 344r/344p'));
  certBlock.appendChild(txt('rs', 'Code de certification RS', 'ex. RS6550'));
  function update() {
    certBlock.hidden = !draft.certifiante;
    nonCertBlock.hidden = !!draft.certifiante;
    const errors = templateErrors(draft);
    mount(errBox, errors.map((e) => h('li', {}, e)));
    const good = { competences: checkCompetences(draft.competences), formacodes: checkFormacodes(draft.formacodes), nsf: checkNsf(draft.nsf), rs: checkRs(draft.rs) };
    for (const [k, r] of Object.entries(good)) if (inputs[k]) inputs[k].classList.toggle('invalid', !!String(draft[k] || '').trim() && r.errors.length > 0);
  }
  const save = () => {
    const errors = templateErrors(draft);
    Object.assign(t, draft, {
      competences: checkCompetences(draft.competences).value,
      formacodes: checkFormacodes(draft.formacodes).value,
      nsf: checkNsf(draft.nsf).value,
      rs: draft.rs ? checkRs(draft.rs).value : '',
      unitPrice: Math.max(0, Number(draft.unitPrice) || 0),
    });
    persist();
    state.editId = null;
    if (state.work?.trainees) runAnalysis();
    render();
    toast(errors.length ? 'Enregistré : il reste des codes à compléter.' : 'Formation prête pour l’export.', errors.length ? 'error' : 'ok');
  };
  const example = (t.id === 'sst' || t.id === 'mac-sst') ? h('div', { class: 'notice small' },
    'Le guide officiel d’import illustre le SST avec : compétences 115650/121885/400635, Formacodes 42829/42817, NSF 344r/344p. ',
    h('b', {}, 'Vérifiez-les dans la fiche pratique SST avant un dépôt réel. '),
    h('button', { class: 'btn btn-ghost btn-small', type: 'button', onclick: () => { Object.assign(draft, GUIDE_EXAMPLE_SST); for (const k of Object.keys(GUIDE_EXAMPLE_SST)) if (inputs[k]) inputs[k].value = draft[k]; update(); } }, 'Utiliser cet exemple')) : null;
  const remove = t.custom ? h('button', { class: 'btn btn-danger btn-small', type: 'button', onclick: () => { if (window.confirm(`Supprimer « ${t.label} » ?`)) { state.catalogue = state.catalogue.filter((c) => c.id !== t.id); persist(); render(); } } }, 'Supprimer') : null;

  const body = h('div', { class: 'tpl-body' },
    h('div', { class: 'fields two' },
      txt('label', 'Intitulé déclaré (NOM_FORMATION)', '250 caractères maximum'),
      sel('declareAs', 'Stagiaires reçus déclarés en', [['JDR', 'Justificatif de réussite (JDR)'], ['ADF', 'Attestation de formation (ADF)']], 'Les non-reçus sont toujours déclarés en attestation.')),
    h('div', { class: 'fields two' },
      sel('jdrType', 'Type de justificatif (TYPE_JDR)', JDR_TYPES),
      txt('jdrName', 'Intitulé du justificatif (NOM_JDR)', 'ex. Sauveteur secouriste du travail')),
    txt('competences', 'Compétences transférables ROME (3 à 10)', 'ex. 115650/121885/400635 — séparées par /', { inputmode: 'numeric' }),
    h('label', { class: 'check', for: `cert-${t.id}` }, certif, 'Formation certifiante (code RS au lieu des Formacodes et NSF)'),
    certBlock, nonCertBlock,
    h('div', { class: 'fields two' },
      sel('modalite', 'Modalité', MODALITES),
      sel('qualification', 'Qualification du formateur (facultatif)', QUALIFICATIONS)),
    h('div', { class: 'fields three' },
      num('validityMonths', 'Validité officielle (mois)', '0 = aucune date de fin de validité déclarée'),
      num('recycleMonths', 'Relance du recyclage (mois)', '0 = pas de relance'),
      num('unitPrice', 'Prix du recyclage (€ HT / stagiaire)', 'pour estimer le chiffre d’affaires')),
    txt('recycleLabel', 'Nom du recyclage dans les relances', 'ex. MAC SST'),
    t.source ? h('p', { class: 'small muted', style: 'margin:0' }, `Repère : ${t.source}`) : null,
    example,
    errBox,
    h('div', { class: 'row end' }, remove, h('button', { class: 'btn btn-secondary', type: 'button', onclick: () => { state.editId = null; render(); } }, 'Annuler'), h('button', { class: 'btn btn-primary', type: 'button', onclick: save }, 'Enregistrer')));
  update();
  return body;
}

// ---------------------------------------------------------------- réglages
function viewReglages() {
  const org = { ...state.org };
  const inp = (key, label, type = 'text', hint) => {
    const el = h('input', { type, value: org[key] || '' });
    el.addEventListener('input', () => { org[key] = el.value; });
    return field(label, el, hint);
  };
  const sig = h('textarea', { rows: 4 });
  sig.value = org.signature || '';
  sig.addEventListener('input', () => { org.signature = sig.value; });

  const licInput = h('textarea', { rows: 3, placeholder: 'ECHEA1.…', 'aria-label': 'Clé de licence', id: 'license-input' });
  const activate = async () => {
    const res = await verifyLicense(licInput.value, LICENSE_PUBLIC_KEY, TODAY);
    if (!res.valid) { toast(res.error, 'error'); return; }
    state.license = { token: licInput.value.trim().replace(/\s+/g, ''), payload: res.payload };
    state.pro = res;
    persist();
    track('license-activated');
    render();
    toast('Échéa Pro est activé. Merci !');
  };
  const p = state.pro?.payload;
  const licenceBlock = isPro()
    ? h('div', { class: 'stack' },
      h('p', { class: 'notice notice-ok', style: 'margin:0' }, h('b', {}, 'Échéa Pro actif'), ` · ${p.org || p.email || ''} · valable jusqu’au ${toLongFr(p.exp)}`),
      h('button', { class: 'btn btn-secondary btn-small', type: 'button', onclick: () => { if (window.confirm('Retirer la clé de licence de ce navigateur ?')) { state.license = null; state.pro = { valid: false }; persist(); render(); } } }, 'Retirer la clé'))
    : h('div', { class: 'stack' },
      field('Clé de licence', licInput, 'Reçue par email après votre paiement.'),
      h('div', { class: 'row' },
        h('button', { class: 'btn btn-primary', type: 'button', id: 'activate-license', onclick: activate }, 'Activer'),
        h('a', { class: 'btn btn-secondary', href: PAYMENT_LINK_MONTHLY, target: '_blank', rel: 'noopener' }, `Passer en Pro · ${PRICE_MONTHLY_HT} € HT/mois`),
        h('a', { class: 'btn btn-ghost', href: PAYMENT_LINK_YEARLY, target: '_blank', rel: 'noopener' }, `ou ${PRICE_YEARLY_HT} € HT/an`)),
      state.pro?.error && state.license ? h('p', { class: 'notice notice-warn small' }, state.pro.error) : null);

  const seen = new Set();
  const companies = Object.values(state.companies).filter((c) => {
    const k = c.siret || normKey(c.name);
    if (!k || seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  const forget = (c) => {
    for (const [k, v] of Object.entries(state.companies)) if ((c.siret && v.siret === c.siret) || normKey(v.name) === normKey(c.name)) delete state.companies[k];
    persist();
    render();
  };
  const companyRows = companies.map((c) => {
    const email = h('input', { type: 'email', value: c.email || '', 'aria-label': `Email de ${c.name}` });
    email.addEventListener('change', () => {
      for (const v of Object.values(state.companies)) if ((c.siret && v.siret === c.siret) || normKey(v.name) === normKey(c.name)) v.email = email.value.trim();
      persist();
      toast('Email enregistré.');
    });
    return h('tr', {}, h('td', {}, c.name || '—'), h('td', { class: 'mono' }, c.siret || '—'), h('td', {}, email),
      h('td', {}, h('button', { class: 'btn btn-ghost btn-small', type: 'button', onclick: () => forget(c) }, 'Oublier')));
  });

  const backupInput = h('input', { type: 'file', accept: '.json,application/json', class: 'sr-only', id: 'backup-input' });
  backupInput.addEventListener('change', async () => {
    try {
      const text = await backupInput.files[0].text();
      state = { ...importBackup(state, text), view: 'reglages' };
      persist();
      render();
      toast('Sauvegarde restaurée.');
    } catch (e) { toast(e.message || 'Sauvegarde illisible.', 'error'); }
  });

  return h('div', { class: 'stack' },
    h('div', { class: 'panel stack' },
      h('h2', { style: 'margin:0' }, 'Votre organisme'),
      h('p', { class: 'muted small', style: 'margin:0' }, 'Utilisé pour nommer les fichiers et signer les emails de relance.'),
      h('div', { class: 'fields two' }, inp('name', 'Nom de l’organisme'), inp('contactName', 'Votre nom'), inp('email', 'Email', 'email'), inp('phone', 'Téléphone', 'tel')),
      field('Signature des emails', sig, 'Laissez vide pour utiliser nom, organisme et téléphone.'),
      h('div', { class: 'row end' }, h('button', { class: 'btn btn-primary', type: 'button', id: 'save-org', onclick: () => { state.org = org; persist(); toast('Réglages enregistrés.'); } }, 'Enregistrer'))),
    h('div', { class: 'panel stack', id: 'licence' }, h('h2', { style: 'margin:0' }, 'Licence'), licenceBlock),
    h('div', { class: 'panel stack' },
      h('h2', { style: 'margin:0' }, `Entreprises clientes (${companyRows.length})`),
      companyRows.length ? h('div', { class: 'table-wrap' }, h('table', { class: 'data' }, h('thead', {}, h('tr', {}, h('th', {}, 'Entreprise'), h('th', {}, 'SIRET'), h('th', {}, 'Email des relances'), h('th', {}, ''))), h('tbody', {}, companyRows)))
        : h('p', { class: 'muted small', style: 'margin:0' }, 'Les SIRET et emails saisis pendant les imports apparaîtront ici.')),
    h('div', { class: 'panel stack' },
      h('h2', { style: 'margin:0' }, 'Vos données'),
      h('p', { class: 'small', style: 'margin:0' }, `Stockées uniquement dans ce navigateur : ${plural(state.passages.length, 'passage de formation suivi', 'passages de formation suivis')} (sans NIR), ${plural(companyRows.length, 'entreprise', 'entreprises')}, votre catalogue et vos réglages.`),
      h('div', { class: 'row' },
        h('button', { class: 'btn btn-secondary btn-small', type: 'button', onclick: () => download(`echea-sauvegarde-${TODAY}.json`, exportBackup(state), 'application/json') }, 'Exporter une sauvegarde'),
        h('label', { class: 'btn btn-secondary btn-small', for: 'backup-input' }, 'Restaurer une sauvegarde', backupInput),
        h('button', { class: 'btn btn-danger btn-small', type: 'button', id: 'wipe', onclick: () => {
          if (!window.confirm('Effacer toutes les données Échéa de ce navigateur (suivi, entreprises, catalogue, réglages, licence) ?')) return;
          clearState();
          state = { ...emptyState(), view: 'reglages', work: null, pro: { valid: false }, editId: null, recyOpts: state.recyOpts };
          render();
          toast('Toutes les données ont été effacées.');
        } }, 'Tout effacer'))),
    h('p', { class: 'small muted' }, `Besoin d’aide ? Écrivez à `, h('a', { href: `mailto:${CONTACT_EMAIL}` }, CONTACT_EMAIL), '.'));
}

// ---------------------------------------------------------------- démarrage
async function start() {
  initAnalytics();
  if (DEMO) document.getElementById('demo-banner').hidden = false;
  if (state.license?.token) state.pro = await verifyLicense(state.license.token, LICENSE_PUBLIC_KEY, TODAY);
  const tab = params.get('tab');
  if (tab && TABS.some(([id]) => id === tab)) state.view = tab;
  render();
  if (DEMO) await loadDemoFile();
}

window.addEventListener('error', () => toast('Une erreur inattendue est survenue. Rechargez la page ; vos réglages sont conservés.', 'error'));
start();
