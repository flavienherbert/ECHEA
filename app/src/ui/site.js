// Pages publiques : liens de paiement, sources, bandeau d'échéance, contact.
import {
  PAYMENT_LINK_MONTHLY, PAYMENT_LINK_YEARLY, STRIPE_MODE, CONTACT_EMAIL, REPO_URL, SOURCES,
  PRICE_MONTHLY_HT, PRICE_YEARLY_HT,
} from '../config.js';
import { nextGeneralDeadline } from '../core/deadlines.js';
import { todayIso, toLongFr } from '../core/dates.js';
import { initAnalytics, bindTracking } from './analytics.js';

function setup() {
  const pay = { monthly: PAYMENT_LINK_MONTHLY, yearly: PAYMENT_LINK_YEARLY };
  document.querySelectorAll('[data-pay]').forEach((a) => { a.href = pay[a.dataset.pay]; });
  document.querySelectorAll('[data-source]').forEach((a) => { if (SOURCES[a.dataset.source]) a.href = SOURCES[a.dataset.source]; });
  document.querySelectorAll('[data-repo]').forEach((a) => { a.href = REPO_URL; });
  document.querySelectorAll('[data-contact]').forEach((a) => {
    a.href = `mailto:${CONTACT_EMAIL}`;
    if (a.dataset.contact === 'text') a.textContent = CONTACT_EMAIL;
  });
  document.querySelectorAll('[data-price-monthly]').forEach((el) => { el.textContent = PRICE_MONTHLY_HT; });
  document.querySelectorAll('[data-price-yearly]').forEach((el) => { el.textContent = PRICE_YEARLY_HT; });
  if (STRIPE_MODE === 'test') document.querySelectorAll('[data-test-mode]').forEach((el) => { el.hidden = false; });

  const bar = document.getElementById('deadline-bar');
  const next = nextGeneralDeadline(todayIso());
  if (bar && next) {
    bar.querySelector('[data-deadline-date]').textContent = toLongFr(next.date);
    bar.querySelector('[data-deadline-text]').textContent = next.text;
    bar.hidden = false;
  }
  initAnalytics();
  bindTracking();
}

setup();
