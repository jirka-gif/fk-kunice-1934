// E2E: ochrana administrace přihlášením.
import { test, expect } from '@playwright/test';
import { ADMIN_EMAIL, ADMIN_PASSWORD, loginToAdmin } from './helpers.js';

test('/admin bez přihlášení přesměruje na přihlašovací stránku', async ({ page }) => {
  await page.goto('/admin');
  await expect(page).toHaveURL(/\/admin\/login/);
  await expect(page.getByPlaceholder('Heslo')).toBeVisible();
});

test('přesměrování si zapamatuje původní cíl v parametru from', async ({ page }) => {
  await page.goto('/admin');
  await expect(page).toHaveURL(/from=%2Fadmin/);
});

test('špatné heslo zobrazí chybu a nepustí dál', async ({ page }) => {
  await page.goto('/admin/login');
  await page.getByPlaceholder('E-mail').fill(ADMIN_EMAIL);
  await page.getByPlaceholder('Heslo').fill('uplne-spatne-heslo');
  await page.getByRole('button', { name: 'Přihlásit se' }).click();
  await expect(page.getByText('Nesprávný e-mail nebo heslo')).toBeVisible();
  await expect(page).toHaveURL(/\/admin\/login/);
});

test('neznámý e-mail se nepřihlásí', async ({ page }) => {
  await page.goto('/admin/login');
  await page.getByPlaceholder('E-mail').fill('nikdo@example.com');
  await page.getByPlaceholder('Heslo').fill(ADMIN_PASSWORD);
  await page.getByRole('button', { name: 'Přihlásit se' }).click();
  await expect(page.getByText('Nesprávný e-mail nebo heslo')).toBeVisible();
});

test('správné heslo pustí do administrace', async ({ page }) => {
  await loginToAdmin(page);
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByText('ADMIN', { exact: true })).toBeVisible();
});

test('odhlášení vrátí ochranu /admin', async ({ page }) => {
  await loginToAdmin(page);
  await page.request.post('/api/logout');
  await page.goto('/admin');
  await expect(page).toHaveURL(/\/admin\/login/);
});

test('PUT /api/content bez přihlášení vrátí 401', async ({ request }) => {
  const res = await request.put('/api/content', { data: { sponsors: ['HACK'] } });
  expect(res.status()).toBe(401);
});

test('PUT /api/content s přihlášením projde', async ({ page }) => {
  await page.goto('/admin/login');
  const login = await page.request.post('/api/login', { data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD } });
  expect(login.ok()).toBe(true);
  const res = await page.request.put('/api/content', { data: { sponsors: ['E2E PARTNER'] } });
  expect(res.ok()).toBe(true);
});
