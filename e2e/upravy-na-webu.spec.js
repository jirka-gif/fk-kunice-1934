// Úpravy pevných textů přímo na webu: balíček se otevře tlačítkem Upravit,
// změna se zapíše až po Uložit a Zrušit ji zahodí.
import { test, expect } from '@playwright/test';
import { loginToAdmin } from './helpers.js';

test('návštěvník žádná tlačítka úprav nevidí', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-prepinac-uprav]')).toHaveCount(0);
  await expect(page.locator('[data-blok]')).toHaveCount(0);
});

test('přihlášený přepíše nadpis přímo na webu a uloží se', async ({ page }) => {
  await loginToAdmin(page);
  await page.goto('/?upravy=1');

  const blok = page.locator('[data-blok="Úvodní text"]');
  await expect(blok).toBeVisible();
  await blok.getByRole('button', { name: 'Upravit' }).click();

  const pole = blok.locator('[data-upravitelny="homeTexts.hero.title"]');
  await pole.click();
  await pole.fill('');
  await pole.pressSequentially('Nový nadpis webu');
  await expect(blok.getByText('Neuloženo')).toBeVisible();

  await blok.getByRole('button', { name: 'Uložit' }).click();
  await expect(blok.getByText('Neuloženo')).toHaveCount(0);

  await page.waitForTimeout(1200); // debounce uložení na server
  await page.goto('/');
  // nadpis je verzálkami přes CSS, proto porovnáváme bez ohledu na velikost písmen
  await expect(page.getByRole('heading', { level: 1 })).toContainText(/nový nadpis webu/i);
});

test('Zrušit vrátí původní text a na web nic nezapíše', async ({ page }) => {
  await loginToAdmin(page);
  await page.goto('/?upravy=1');

  const blok = page.locator('[data-blok="Nadpis — týmy"]');
  await blok.getByRole('button', { name: 'Upravit' }).click();
  const pole = blok.locator('[data-upravitelny="homeTexts.teams.title"]');
  const puvodni = (await pole.innerText()).trim();

  await pole.click();
  await pole.fill('');
  await pole.pressSequentially('Nesmysl');
  await blok.getByRole('button', { name: 'Zrušit' }).click();

  await page.waitForTimeout(1000);
  await page.goto('/');
  await expect(page.locator('body')).toContainText(new RegExp(puvodni.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
  await expect(page.locator('body')).not.toContainText(/nesmysl/i);
});

test('v administraci není hlavní menu webu, jen pruh se zpátky na web', async ({ page }) => {
  await loginToAdmin(page);
  await expect(page.getByRole('link', { name: '← Zpět na web' })).toHaveCount(1);
  await expect(page.getByRole('link', { name: 'Pronájem', exact: true })).toHaveCount(0);
  await expect(page.getByRole('link', { name: /Upravit web/ })).toBeVisible();
});
