// Recyclages à venir, regroupés par entreprise cliente, et emails de relance.
// Le registre ne contient aucun NIR : seulement ce qui sert à relancer l'entreprise.
import { validityEnd, diffDays, addDays, toFr, toLongFr } from './dates.js';
import { normKey } from './text.js';
import { stableId } from './hash.js';
import { companyKey, hasError } from './process.js';

/** Passages de formation à mémoriser, à partir des stagiaires analysés (lignes sans erreur bloquante de dates). */
export function passagesFromTrainees(trainees, catalogue) {
  const byId = Object.fromEntries(catalogue.map((t) => [t.id, t]));
  const out = [];
  for (const t of trainees) {
    const template = byId[t.templateId];
    if (!template || !t.dateFin || !t.nom) continue;
    if (hasError(t) && t.issues.some((x) => ['dateDebut', 'dateFin', 'formation', 'nom'].includes(x.field) && x.level === 'error')) continue;
    const person = `${normKey(t.nom)}|${normKey(t.prenom)}|${t.siret || normKey(t.entreprise)}`;
    out.push({
      key: stableId(`${person}|${template.id}|${t.dateFin}`, 16),
      person: stableId(person, 12),
      nom: t.nom, prenom: t.prenom, entreprise: t.entreprise, siret: t.siret,
      email: t.emailEntreprise, templateId: template.id, dateFin: t.dateFin, result: t.result,
    });
  }
  return out;
}

export function mergePassages(existing, incoming) {
  const map = new Map(existing.map((p) => [p.key, p]));
  let added = 0;
  for (const p of incoming) {
    if (!map.has(p.key)) added += 1;
    map.set(p.key, { ...map.get(p.key), ...p });
  }
  return { passages: [...map.values()], added };
}

/**
 * @param {object[]} passages registre
 * @param {object[]} catalogue
 * @param {object} opts { today, horizonDays = 365, overdueDays = 180, companies }
 * @returns {Array<{ key, entreprise, siret, email, items, firstDue, total, amount }>}
 */
export function upcomingRecyclages(passages, catalogue, opts) {
  const { today, horizonDays = 365, overdueDays = 180, companies = {} } = opts;
  const byId = Object.fromEntries(catalogue.map((t) => [t.id, t]));
  // Garder le passage le plus récent par personne et par type de recyclage (SST puis MAC SST, etc.).
  const latest = new Map();
  for (const p of passages) {
    const t = byId[p.templateId];
    if (!t || !t.recycleMonths || p.result === 'failure') continue;
    const family = `${p.person}|${normKey(t.recycleLabel || t.id)}`;
    const prev = latest.get(family);
    if (!prev || prev.dateFin < p.dateFin) latest.set(family, p);
  }
  const groups = new Map();
  for (const p of latest.values()) {
    const t = byId[p.templateId];
    const due = validityEnd(p.dateFin, t.recycleMonths);
    const days = diffDays(today, due);
    if (days > horizonDays || days < -overdueDays) continue;
    const ck = companyKey(p.entreprise, p.siret) || 'NPARTICULIERS';
    const known = companies[ck] || companies[companyKey(p.entreprise, '')] || {};
    if (!groups.has(ck)) {
      groups.set(ck, {
        key: ck, entreprise: p.entreprise || known.name || 'Stagiaires sans entreprise',
        siret: p.siret || known.siret || '', email: known.email || p.email || '', items: [],
      });
    }
    const g = groups.get(ck);
    if (!g.email && p.email) g.email = p.email;
    g.items.push({ ...p, due, days, label: t.recycleLabel || t.label, unitPrice: Number(t.unitPrice) || 0, status: days < 0 ? 'expire' : days <= 60 ? 'urgent' : days <= 120 ? 'a-relancer' : 'plus-tard' });
  }
  const list = [...groups.values()].map((g) => {
    g.items.sort((a, b) => (a.due < b.due ? -1 : 1));
    return { ...g, firstDue: g.items[0].due, total: g.items.length, amount: g.items.reduce((s, i) => s + i.unitPrice, 0) };
  });
  list.sort((a, b) => (a.firstDue < b.firstDue ? -1 : 1));
  return list;
}

/** Email de relance prêt à envoyer depuis la messagerie de l'organisme. */
export function reminderEmail(group, org = {}) {
  const labels = [...new Set(group.items.map((i) => i.label))];
  const first = group.items[0];
  const subject = `${labels.join(' / ')} : ${group.total} salarié${group.total > 1 ? 's' : ''} à recycler${first.days >= 0 ? ` avant le ${toFr(first.due)}` : ''}`;
  const lines = group.items.map((i) => {
    const who = [i.prenom, i.nom].filter(Boolean).join(' ');
    const when = i.days < 0 ? `validité expirée depuis le ${toFr(i.due)}` : `à renouveler avant le ${toFr(i.due)}`;
    return `- ${who} — ${i.label} (formation du ${toFr(i.dateFin)}) : ${when}`;
  });
  const suggested = addDays(first.due, -30);
  const body = [
    'Bonjour,',
    '',
    `Plusieurs de vos salariés formés chez ${org.name || 'nous'} arrivent au terme de la validité de leur formation :`,
    '',
    ...lines,
    '',
    first.days >= 0
      ? `Pour éviter toute interruption, nous vous proposons d'organiser le recyclage avant le ${toLongFr(first.due)}, idéalement dès le ${toLongFr(suggested)} si vos plannings le permettent.`
      : "Nous vous proposons d'organiser rapidement le recyclage pour remettre ces salariés à jour.",
    'Souhaitez-vous que nous vous transmettions nos prochaines dates, en intra ou en inter-entreprises ?',
    '',
    'Bien cordialement,',
    org.signature || [org.contactName, org.name, org.phone].filter(Boolean).join('\n') || '',
  ].join('\n');
  const mailto = `mailto:${encodeURIComponent(group.email || '')}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  return { subject, body, mailto };
}

/** Export CSV des recyclages (séparateur « ; » pour Excel). */
export function recyclagesCsv(groups) {
  const head = ['Entreprise', 'SIRET', 'Email entreprise', 'Nom', 'Prénom', 'Recyclage', 'Formation du', 'À renouveler avant le', 'Statut'];
  const statusLabel = { expire: 'Expiré', urgent: 'Moins de 60 jours', 'a-relancer': 'À relancer', 'plus-tard': 'Plus tard' };
  const esc = (v) => (/[;"\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v ?? ''));
  const rows = [head.join(';')];
  for (const g of groups) for (const i of g.items) {
    rows.push([g.entreprise, g.siret, g.email, i.nom, i.prenom, i.label, toFr(i.dateFin), toFr(i.due), statusLabel[i.status]].map(esc).join(';'));
  }
  return '﻿' + rows.join('\r\n') + '\r\n';
}
