// E2E: uživatelé, role a jejich vynucení v administraci i v API.
import { test, expect } from '@playwright/test';
import { ADMIN_EMAIL, ADMIN_PASSWORD, loginToAdmin, openAdminSection } from './helpers.js';
import { ADMIN_GROUPS, ADMIN_SECTIONS } from '../lib/permissions.js';

// Založí uživatele přes API a vrátí { email, password }.
async function createUser(page, role) {
  const email = `${role}-${Date.now()}@fkkunice.cz`;
  const password = 'testovaci-heslo-1';
  const res = await page.request.post('/api/users', { data: { email, name: `Test ${role}`, role, password } });
  expect(res.ok(), await res.text()).toBe(true);
  return { email, password };
}

test('správce vidí sekci Uživatelé a role, redaktor ne', async ({ page }) => {
  await loginToAdmin(page);
  // menu je seskupené — sekce se nabídne po otevření skupiny
  await openAdminSection(page, 'uzivatele');
  await expect(page.getByText('Kdo se dostane do administrace a co tam smí')).toBeVisible();

  const redaktor = await createUser(page, 'redaktor');
  await page.request.post('/api/logout');

  await loginToAdmin(page, redaktor.email, redaktor.password);
  // do skupiny se mu Uživatelé ani Nastavení vůbec nezařadí
  await expect(page.locator('[data-group-has~="uzivatele"]')).toHaveCount(0);
  await expect(page.locator('[data-group-has~="nastaveni"]')).toHaveCount(0);
  // ale novinky ano
  await expect(page.locator('[data-group-has~="novinky"]')).toBeVisible();
});

test('menu je seskupené, ne řada jednotlivých sekcí', async ({ page }) => {
  await loginToAdmin(page);
  // první správce má roli Super správce, takže vidí všechny skupiny
  const skupiny = page.locator('[data-group]');
  await expect(skupiny).toHaveCount(ADMIN_GROUPS.length);
  expect(ADMIN_GROUPS.length).toBeLessThan(ADMIN_SECTIONS.length);

  // skupina s víc sekcemi nabídne uvnitř záložky
  await page.locator('[data-group="obsah"]').click();
  await expect(page.locator('[data-sec="novinky"]')).toBeVisible();
  await expect(page.locator('[data-sec="kempy"]')).toBeVisible();
});

test('sekce jen pro čtení se dá otevřít, ale needituje', async ({ page }) => {
  await loginToAdmin(page);
  const redaktor = await createUser(page, 'redaktor');
  await page.request.post('/api/logout');

  await loginToAdmin(page, redaktor.email, redaktor.password);
  await openAdminSection(page, 'tymy'); // redaktor má u týmů jen „view"
  await expect(page.getByText('Tuhle sekci máš jen pro čtení — úpravy ti server neuloží.')).toBeVisible();
  // fieldset s disabled vypne úplně všechna pole i tlačítka v sekci
  await expect(page.locator('fieldset[disabled] input').first()).toBeDisabled();
  await expect(page.locator('fieldset[disabled] button').first()).toBeDisabled();
});

test('API odmítne úpravu mimo oprávnění role (403)', async ({ page }) => {
  await loginToAdmin(page);
  const redaktor = await createUser(page, 'redaktor');
  await page.request.post('/api/logout');

  await loginToAdmin(page, redaktor.email, redaktor.password);
  const content = await (await page.request.get('/api/content')).json();

  // novinky smí
  content.news[0].title = 'Redaktorem upraveno';
  const ok = await page.request.put('/api/content', { data: content });
  expect(ok.status()).toBe(200);

  // nastavení klubu nesmí
  content.club.name = 'Cizí klub';
  const denied = await page.request.put('/api/content', { data: content });
  expect(denied.status()).toBe(403);
  expect((await denied.json()).denied).toEqual(['club']);

  // a opravdu se to neuložilo
  const after = await (await page.request.get('/api/content')).json();
  expect(after.club.name).not.toBe('Cizí klub');
});

test('/api/users a /api/roles jsou pro běžnou roli zakázané', async ({ page }) => {
  await loginToAdmin(page);
  const trener = await createUser(page, 'trener');
  await page.request.post('/api/logout');

  await loginToAdmin(page, trener.email, trener.password);
  expect((await page.request.get('/api/users')).status()).toBe(403);
  expect((await page.request.get('/api/roles')).status()).toBe(403);
  expect((await page.request.post('/api/users', { data: { email: 'x@y.cz', role: 'spravce' } })).status()).toBe(403);
});

test('deaktivovaný uživatel se nedostane do administrace', async ({ page }) => {
  await loginToAdmin(page);
  const redaktor = await createUser(page, 'redaktor');
  const list = await (await page.request.get('/api/users')).json();
  const created = list.users.find((u) => u.email === redaktor.email);
  const off = await page.request.put('/api/users', { data: { id: created.id, active: false } });
  expect(off.ok()).toBe(true);
  await page.request.post('/api/logout');

  await page.goto('/admin/login');
  await page.getByPlaceholder('E-mail').fill(redaktor.email);
  await page.getByPlaceholder('Heslo').fill(redaktor.password);
  await page.getByRole('button', { name: 'Přihlásit se' }).click();
  await expect(page.getByText('Nesprávný e-mail nebo heslo')).toBeVisible();
});

test('změna oprávnění role se hned projeví', async ({ page }) => {
  await loginToAdmin(page);
  const redaktor = await createUser(page, 'redaktor');

  // správce dá redaktorům právo editovat partnery
  const { roles } = await (await page.request.get('/api/roles')).json();
  const next = roles.map((r) => (r.id === 'redaktor' ? { ...r, permissions: { ...r.permissions, partneri: 'edit' } } : r));
  expect((await page.request.put('/api/roles', { data: { roles: next } })).ok()).toBe(true);
  await page.request.post('/api/logout');

  await loginToAdmin(page, redaktor.email, redaktor.password);
  const content = await (await page.request.get('/api/content')).json();
  content.sponsors = [...content.sponsors, 'NOVÝ PARTNER OD REDAKTORA'];
  expect((await page.request.put('/api/content', { data: content })).status()).toBe(200);

  // uklidíme zpět, ať další testy vidí výchozí nastavení
  await page.request.post('/api/logout');
  await loginToAdmin(page);
  await page.request.put('/api/roles', { data: { roles } });
});

test('uživatel si změní vlastní heslo', async ({ page }) => {
  await loginToAdmin(page);
  const redaktor = await createUser(page, 'redaktor');
  await page.request.post('/api/logout');

  await loginToAdmin(page, redaktor.email, redaktor.password);
  await page.getByRole('button', { name: 'Změnit heslo' }).click();
  await expect(page.getByText('Můj účet')).toBeVisible();
  await page.getByLabel('Současné heslo').fill(redaktor.password);
  await page.getByLabel('Nové heslo (aspoň 8 znaků)').fill('uplne-nove-heslo');
  await page.getByLabel('Nové heslo znovu').fill('uplne-nove-heslo');
  await page.getByRole('button', { name: 'Změnit heslo' }).last().click();
  await expect(page.getByText('Heslo změněno.')).toBeVisible();

  await page.request.post('/api/logout');
  await loginToAdmin(page, redaktor.email, 'uplne-nove-heslo');
  await expect(page).toHaveURL(/\/admin$/);
});

test('administrace pozve nového uživatele a ukáže první heslo', async ({ page }) => {
  await loginToAdmin(page);
  await openAdminSection(page, 'uzivatele');

  const email = `pozvany-${Date.now()}@fkkunice.cz`;
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel('Jméno').fill('Pozvaný Uživatel');
  await page.getByRole('button', { name: 'Pozvat' }).click();

  await expect(page.getByText(new RegExp(`Uživatel ${email} založen`))).toBeVisible();
  await expect(page.getByText(email).first()).toBeVisible();
  expect(ADMIN_PASSWORD).toBeTruthy();
  expect(ADMIN_EMAIL).toBeTruthy();
});
