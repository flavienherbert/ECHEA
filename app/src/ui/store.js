// Persistance locale (navigateur). Aucun NIR n'est jamais enregistré ici.
import { cloneDefaults } from '../core/catalogue.js';

const KEY = 'echea:v1';

export function emptyState() {
  return {
    version: 1,
    org: { name: '', contactName: '', email: '', phone: '', signature: '' },
    catalogue: cloneDefaults(),
    aliases: {}, // intitulé normalisé → id de formation
    companies: {}, // clé entreprise → { name, siret, email }
    passages: [], // suivi des recyclages (sans NIR)
    license: null, // { token, payload }
    options: { unknownResult: 'success', includeBeforeObligation: false },
    catalogueVersion: 1,
  };
}

export function loadState() {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return emptyState();
    const data = JSON.parse(raw);
    const base = emptyState();
    const merged = { ...base, ...data, org: { ...base.org, ...data.org }, options: { ...base.options, ...data.options } };
    // Ajoute les nouvelles formations par défaut apparues dans une mise à jour.
    const ids = new Set((merged.catalogue || []).map((t) => t.id));
    for (const t of base.catalogue) if (!ids.has(t.id)) merged.catalogue.push(t);
    return merged;
  } catch {
    return emptyState();
  }
}

export function saveState(state) {
  try {
    const { version, org, catalogue, aliases, companies, passages, license, options, catalogueVersion } = state;
    window.localStorage.setItem(KEY, JSON.stringify({ version, org, catalogue, aliases, companies, passages, license, options, catalogueVersion }));
    return true;
  } catch {
    return false;
  }
}

export function clearState() {
  try { window.localStorage.removeItem(KEY); } catch { /* stockage indisponible */ }
}

export function exportBackup(state) {
  const { org, catalogue, aliases, companies, passages, options } = state;
  return JSON.stringify({ app: 'echea', exportedAt: new Date().toISOString(), org, catalogue, aliases, companies, passages, options }, null, 2);
}

export function importBackup(state, text) {
  const data = JSON.parse(text);
  if (data.app !== 'echea') throw new Error('Ce fichier n’est pas une sauvegarde Échéa.');
  return {
    ...state,
    org: { ...state.org, ...data.org },
    catalogue: Array.isArray(data.catalogue) ? data.catalogue : state.catalogue,
    aliases: data.aliases || {},
    companies: data.companies || {},
    passages: Array.isArray(data.passages) ? data.passages.map(({ nir, ...rest }) => rest) : [],
    options: { ...state.options, ...data.options },
  };
}
