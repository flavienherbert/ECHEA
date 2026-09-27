// Les 10 scénarios du brief, sur desktop et mobile.
import { test, expect } from '@playwright/test';
import { readFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { createPrivateKey } from 'node:crypto';
import { issue } from '../../scripts/license/license.mjs';
import { cloneDefaults, GUIDE_EXAMPLE_SST } from '../../app/src/core/catalogue.js';

const SAMPLE = fileURLToPath(new URL('../../app/public/exemple-stagiaires.xlsx', import.meta.url));
const NO_COLUMNS = fileURLToPath(new URL('../fixtures/sans-colonnes.csv', import.meta.url));
const PDF = fileURLToPath(new URL('../fixtures/document.pdf', import.meta.url));

function seedCatalogue() {
  const catalogue = cloneDefaults();
  for (const t of catalogue) Object.assign(t, GUIDE_EXAMPLE_SST);
  return { version: 1, org: { name: 'OF Test Playwright' }, catalogue, aliases: {}, companies: {}, passages: [], license: null, options: { unknownResult: 'success', includeBeforeObligation: false } };
}

async function collectErrors(page) {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  return errors;
}

async function noHorizontalScroll(page) {
  const { sw, iw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth }));
  expect(sw).toBeLessThanOrEqual(iw + 1);
}

test('1-2. Le visiteur arrive et comprend l’offre', async ({ page }) => {
  const errors = await collectErrors(page);
  await page.goto('./');
  await expect(page).toHaveTitle(/Échéa/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Passeport de prévention');
  await expect(page.locator('#deadline-bar')).toBeVisible();
  await expect(page.locator('#tarifs')).toContainText('29');
  await expect(page.locator('#tarifs')).toContainText('290');
  const pay = page.locator('[data-pay="monthly"]');
  await expect(pay).toHaveAttribute('href', /^https:\/\/buy\.stripe\.com\//);
  await expect(page.locator('[data-pay="yearly"]')).toHaveAttribute('href', /^https:\/\/buy\.stripe\.com\//);
  await expect(page.locator('#faq details')).toHaveCount(9);
  await noHorizontalScroll(page);
  expect(errors).toEqual([]);
});

test('3. Le visiteur clique sur le bouton principal et arrive dans l’application', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('link', { name: 'Essayer avec mon fichier' }).first().click();
  await expect(page).toHaveURL(/app\.html$/);
  await expect(page.getByText('Déposez votre fichier de stagiaires')).toBeVisible();
  await noHorizontalScroll(page);
});

test('4. Pas de compte : l’organisme se paramètre et c’est conservé', async ({ page }) => {
  await page.goto('./app.html?tab=reglages');
  await page.getByLabel('Nom de l’organisme').fill('Sécurité Formation Test');
  await page.getByRole('button', { name: 'Enregistrer' }).first().click();
  await expect(page.locator('#toast')).toContainText('enregistrés');
  await page.reload();
  await expect(page.getByLabel('Nom de l’organisme')).toHaveValue('Sécurité Formation Test');
});

test('5. Les codes d’une formation se complètent dans l’éditeur', async ({ page }) => {
  await page.goto('./app.html?tab=formations');
  const card = page.locator('#tpl-sst');
  await card.getByRole('button', { name: 'Modifier' }).click();
  await card.getByRole('button', { name: 'Utiliser cet exemple' }).click();
  await card.getByRole('button', { name: 'Enregistrer' }).click();
  await expect(page.locator('#tpl-sst .chip')).toHaveText('prête');
});

test('5-6-8. Import du fichier, corrections, export conforme, sauvegarde du suivi', async ({ page }) => {
  const errors = await collectErrors(page);
  await page.addInitScript((seed) => { if (!sessionStorage.getItem('seeded')) { localStorage.setItem('echea:v1', seed); sessionStorage.setItem('seeded', '1'); } }, JSON.stringify(seedCatalogue()));
  await page.goto('./app.html');
  await page.locator('#file-input').setInputFiles(SAMPLE);
  await expect(page.getByText('Colonnes obligatoires reconnues')).toBeVisible();
  await expect(page.locator('table.data tbody tr')).toHaveCount(6);
  await page.locator('#run-check').click();

  const kpis = page.locator('.kpi');
  await expect(kpis.nth(0)).toContainText('28');
  await expect(kpis.nth(2)).toContainText('7');

  // Correction du NIR à clé fausse (ligne 8) : on garde les 13 premiers caractères.
  const fix = page.getByLabel('Corriger NIR ligne 8');
  const value = (await fix.inputValue()).replace(/\s/g, '').slice(0, 13);
  await fix.fill(value);
  await fix.press('Enter');
  await expect(kpis.nth(2)).toContainText('6');

  // SIRET de l'entreprise sans SIRET, saisi une fois.
  await page.getByLabel('SIRET de Garage Moreau').fill('90400456700015');
  await page.getByLabel('SIRET de Garage Moreau').press('Enter');
  await expect(page.locator('#toast')).toBeVisible();
  const invalid = await page.locator('#toast').textContent();
  if (/invalide/.test(invalid)) {
    // SIRET de test à clé fausse : on en calcule un valide.
    throw new Error(`SIRET refusé : ${invalid}`);
  }
  await expect(kpis.nth(2)).toContainText('3');

  await page.locator('#go-export').click();
  await expect(page.getByRole('heading', { name: 'Vos fichiers pour le Passeport de prévention' })).toBeVisible();

  const [jdr] = await Promise.all([page.waitForEvent('download'), page.locator('#dl-jdr').click()]);
  const jdrText = readFileSync(await jdr.path(), 'utf8');
  const jdrLines = jdrText.split('\r\n').filter(Boolean);
  expect(jdrLines[0].split('|')).toHaveLength(29);
  expect(jdrLines[0].startsWith('ID_DECLARATION|REFERENCE_DECLARATION|ID_UNIQUE_PARTENAIRE|TYPE_JDR|NOM_JDR')).toBe(true);
  expect(jdrLines.length - 1).toBe(9);
  expect(jdr.suggestedFilename()).toMatch(/^PASSEPORT_JDR_OF_TEST_PLAYWRIGHT_\d{8}_9_STAGIAIRES\.csv$/);

  const [adf] = await Promise.all([page.waitForEvent('download'), page.locator('#dl-adf').click()]);
  const adfLines = readFileSync(await adf.path(), 'utf8').split('\r\n').filter(Boolean);
  expect(adfLines[0].split('|')).toHaveLength(20);
  for (const l of adfLines.slice(1)) expect(l.split('|')).toHaveLength(20);
  expect(adfLines.length - 1).toBe(11);

  // Le suivi des recyclages est conservé après rechargement.
  await page.reload();
  await page.getByRole('tab', { name: /Recyclages/ }).click();
  await expect(page.locator('.company').first()).toContainText('Menuiserie Lefèvre');
  await page.locator('.company').first().getByRole('button', { name: 'Préparer l’email' }).click();
  await expect(page.locator('#dialog')).toContainText('Relance · Menuiserie Lefèvre');
  await expect(page.getByLabel('Objet')).toHaveValue(/MAC SST/);
  await page.locator('#dialog').getByRole('button', { name: 'Fermer' }).click();
  expect(errors).toEqual([]);
});

test('7. Paiement : liens Stripe et activation de la clé Pro', async ({ page }) => {
  const keyPath = `${homedir()}/.echea/license-private.pem`;
  test.skip(!existsSync(keyPath), 'clé privée absente');
  const { token } = issue({ org: 'OF Test', email: 'test@example.com', months: 2 }, createPrivateKey(readFileSync(keyPath, 'utf8')));
  await page.goto('./app.html?tab=reglages');
  await expect(page.getByRole('link', { name: /Passer en Pro/ })).toHaveAttribute('href', /buy\.stripe\.com/);
  await page.locator('#license-input').fill('ECHEA1.faux.jeton');
  await page.locator('#activate-license').click();
  await expect(page.locator('#toast')).toContainText(/Signature invalide|illisible|mal formée/);
  await page.locator('#license-input').fill(token);
  await page.locator('#activate-license').click();
  await expect(page.locator('#licence')).toContainText('Échéa Pro actif');
  await expect(page.locator('#plan-badge')).toHaveText('Pro');
  await page.reload();
  await expect(page.locator('#plan-badge')).toHaveText('Pro');
});

test('8. « Tout effacer » supprime les données du navigateur', async ({ page }) => {
  await page.addInitScript((seed) => { if (!sessionStorage.getItem('seeded')) { localStorage.setItem('echea:v1', seed); sessionStorage.setItem('seeded', '1'); } }, JSON.stringify(seedCatalogue()));
  await page.goto('./app.html?tab=reglages');
  await expect(page.getByLabel('Nom de l’organisme')).toHaveValue('OF Test Playwright');
  page.once('dialog', (d) => d.accept());
  await page.locator('#wipe').click();
  await expect(page.locator('#toast')).toContainText('effacées');
  const stored = await page.evaluate(() => localStorage.getItem('echea:v1'));
  expect(stored).toBeNull();
});

test('9. Mode démo et affichage mobile', async ({ page }) => {
  await page.goto('./app.html?demo=1');
  await expect(page.locator('#demo-banner')).toBeVisible();
  await expect(page.getByText('exemple-stagiaires.xlsx')).toBeVisible();
  await page.locator('#run-check').click();
  await expect(page.locator('.kpi').first()).toContainText('28');
  await noHorizontalScroll(page);
  const stored = await page.evaluate(() => localStorage.getItem('echea:v1'));
  expect(stored).toBeNull();
});

test('10. Les erreurs de fichier sont expliquées', async ({ page }) => {
  await page.goto('./app.html');
  await page.locator('#file-input').setInputFiles(PDF);
  await expect(page.locator('#import-error')).toContainText('Format non pris en charge');
  await page.locator('#file-input').setInputFiles(NO_COLUMNS);
  await expect(page.getByRole('alert')).toContainText('Colonne obligatoire non trouvée');
  await expect(page.locator('#run-check')).toBeDisabled();
});

test('Pages légales et page merci accessibles', async ({ page }) => {
  for (const p of ['mentions-legales.html', 'cgv.html', 'confidentialite.html', 'merci.html?plan=annuel']) {
    const res = await page.goto(`./${p}`);
    expect(res.status()).toBe(200);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await noHorizontalScroll(page);
  }
  await expect(page.locator('#plan-line')).toContainText('Abonnement annuel');
});
