// E2E: zpráva z kontaktního formuláře se objeví v adminu a dá se vyřídit.
import { test, expect } from '@playwright/test';
import { loginToAdmin, openAdminSection } from './helpers.js';

test('zpráva z webu dorazí do sekce Zprávy a jde označit jako vyřízená', async ({ page }) => {
  const name = `Tazatel ${Date.now()}`;

  // 1) odeslání z veřejného formuláře
  await page.goto('/kontakt');
  await page.getByPlaceholder('Jméno a příjmení').fill(name);
  await page.getByPlaceholder('E-mail').fill('tazatel@example.com');
  await page.getByPlaceholder('Vaše zpráva').fill('Mám dotaz k náboru.');
  await Promise.all([
    page.waitForResponse((r) => r.url().includes('/api/submit') && r.request().method() === 'POST'),
    page.getByText('Odeslat zprávu', { exact: true }).click(),
  ]);

  // 2) v adminu je mezi novými
  await loginToAdmin(page);
  await openAdminSection(page, 'zpravy');
  await expect(page.getByText(name)).toBeVisible();

  // 3) detail a vyřízení
  await page.getByText(name).click();
  await expect(page.getByText('Mám dotaz k náboru.')).toBeVisible();
  await page.getByRole('button', { name: 'Označit jako vyřízenou' }).click();
  await page.waitForResponse((r) => r.url().includes('/api/content') && r.request().method() === 'PUT' && r.ok());

  // 4) ve složce Nové už není, ve Vyřízených ano
  await page.getByRole('button', { name: /^Nové/ }).click();
  await expect(page.getByText(name)).toHaveCount(0);
  await page.getByRole('button', { name: /^Vyřízené/ }).click();
  await expect(page.getByText(name)).toBeVisible();
});

test('přehled v adminu ukazuje reálné počty', async ({ page }) => {
  await loginToAdmin(page);
  await expect(page.getByText('Nové zprávy')).toBeVisible();
  await expect(page.getByText('Nové rezervace').first()).toBeVisible();
  await expect(page.getByText('Vypsané kempy')).toBeVisible();
  await expect(page.getByText('Nejbližší zápasy')).toBeVisible();

  // klik na kartu přepne do příslušné sekce
  await page.getByText('Nové zprávy').click();
  await expect(page.getByText('Zprávy odeslané z kontaktního formuláře na webu')).toBeVisible();
});
