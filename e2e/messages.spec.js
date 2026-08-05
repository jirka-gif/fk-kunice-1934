// E2E: zpráva z kontaktního formuláře se objeví v adminu a dá se vyřídit.
import { test, expect } from '@playwright/test';
import { loginToAdmin, openAdminSection } from './helpers.js';

test('zpráva z webu dorazí do sekce Zprávy a jde označit jako vyřízená', async ({ page }) => {
  const name = `Tazatel ${Date.now()}`;

  // 1) odeslání z veřejného formuláře
  await page.goto('/kontakt');
  await page.getByPlaceholder('Jméno a příjmení', { exact: true }).fill(name);
  await page.getByPlaceholder('E-mail', { exact: true }).fill('tazatel@example.com');
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

test('přehled ukazuje jen to, co opravdu čeká, a vede rovnou tam', async ({ page }) => {
  // necháme dorazit zprávu, ať máme jistý úkol
  await page.request.post('/api/submit', {
    data: { type: 'message', payload: { name: `Úkol ${Date.now()}`, email: 'x@y.cz', text: 'dotaz' } },
  });

  await loginToAdmin(page);
  await expect(page.getByText('Co je potřeba udělat')).toBeVisible();
  await expect(page.getByText('Nové zprávy')).toBeVisible();

  // tlačítko u úkolu otevře příslušnou sekci
  await page.getByRole('button', { name: 'Přečíst' }).first().click();
  await expect(page.getByText('Zprávy odeslané z kontaktního formuláře na webu')).toBeVisible();
});

test('vyřízené úkoly z přehledu zmizí', async ({ page }) => {
  await loginToAdmin(page);
  const content = await (await page.request.get('/api/content')).json();
  // všechno označíme za vyřízené
  content.messages = content.messages.map((m) => ({ ...m, status: 'vyřízená' }));
  content.cmsRegistrations = content.cmsRegistrations.map((r) => ({ ...r, status: 'vyřízená' }));
  content.reservations = content.reservations.map((r) => ({ ...r, status: 'potvrzená' }));
  content.matchProposals = content.matchProposals.map((p) => ({ ...p, status: 'schválená' }));
  content.socialPosts = content.socialPosts.map((p) => ({ ...p, status: 'odesláno' }));
  await page.request.put('/api/content', { data: content });

  await page.reload();
  await expect(page.getByText('Všechno vyřízené. Nic tu na tebe nečeká.')).toBeVisible();
  await expect(page.getByText('Nové zprávy')).toHaveCount(0);
});
