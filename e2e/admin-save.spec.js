// E2E: úprava v administraci se uloží na server a přetrvá po reloadu.
import { test, expect } from '@playwright/test';
import { loginToAdmin, openAdminSection } from './helpers.js';

test('úprava nastavení klubu přetrvá po reloadu i na webu', async ({ page }) => {
  const motto = `E2E motto ${Date.now()}`;

  await loginToAdmin(page);
  await openAdminSection(page, 'nastaveni');

  const field = page.getByLabel('Motto');
  await expect(field).toBeVisible();
  await field.fill(motto);

  // uložení na server je debounced (700 ms) — počkáme na skutečný PUT
  await page.waitForResponse((r) => r.url().includes('/api/content') && r.request().method() === 'PUT' && r.ok());

  // 1) obsah je opravdu na serveru
  const content = await (await page.request.get('/api/content')).json();
  expect(content.club.motto).toBe(motto);

  // 2) po reloadu adminu je hodnota stále vyplněná
  await page.reload();
  await openAdminSection(page, 'nastaveni');
  await expect(page.getByLabel('Motto')).toHaveValue(motto);
});

test('text hero na hlavní stránce se dá upravit v adminu a projeví se na webu', async ({ page }) => {
  const title = `Hero ${Date.now()}`;

  await loginToAdmin(page);
  await openAdminSection(page, 'domu');
  await page.getByLabel('Hlavní nadpis').fill(title);
  await page.waitForResponse((r) => r.url().includes('/api/content') && r.request().method() === 'PUT' && r.ok());

  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(title);
});

test('text v patičce se dá upravit v adminu a projeví se na webu', async ({ page }) => {
  const claim = `CLAIM ${Date.now()}`;

  await loginToAdmin(page);
  await openAdminSection(page, 'domu');
  await page.getByRole('button', { name: 'Patička' }).click();
  await page.getByLabel('Claim vpravo dole').fill(claim);
  await page.waitForResponse((r) => r.url().includes('/api/content') && r.request().method() === 'PUT' && r.ok());

  await page.goto('/');
  await expect(page.getByText(claim)).toBeVisible();
});
