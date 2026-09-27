// Mesure d'audience sans cookie (GoatCounter), désactivée tant que GOATCOUNTER_CODE est vide.
// Aucune donnée de stagiaire n'est jamais envoyée : seulement des noms d'évènements (« export-adf »…).
import { GOATCOUNTER_CODE } from '../config.js';

let loaded = false;

export function initAnalytics() {
  if (!GOATCOUNTER_CODE || loaded) return;
  loaded = true;
  const s = document.createElement('script');
  s.async = true;
  s.dataset.goatcounter = `https://${GOATCOUNTER_CODE}.goatcounter.com/count`;
  s.src = 'https://gc.zgo.at/count.js';
  document.head.appendChild(s);
}

export function track(event) {
  try {
    if (!GOATCOUNTER_CODE) return;
    const gc = window.goatcounter;
    if (gc && typeof gc.count === 'function') gc.count({ path: `evt-${event}`, title: event, event: true });
  } catch {
    /* la mesure ne doit jamais casser l'application */
  }
}

export function bindTracking(root = document) {
  root.querySelectorAll('[data-track]').forEach((el) => {
    el.addEventListener('click', () => track(el.dataset.track));
  });
}
