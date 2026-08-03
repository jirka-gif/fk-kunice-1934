// E2E: veřejné formuláře (kontakt, pronájem) odesílají data na server.
import { test, expect } from '@playwright/test';

test('kontaktní formulář odešle zprávu a zobrazí potvrzení', async ({ page }) => {
  await page.goto('/kontakt');
  await page.getByPlaceholder('Jméno a příjmení').fill('E2E Tester');
  await page.getByPlaceholder('E-mail').fill('e2e@example.com');
  await page.getByPlaceholder('Vaše zpráva').fill('Testovací zpráva z e2e testu.');

  const [res] = await Promise.all([
    page.waitForResponse((r) => r.url().includes('/api/submit') && r.request().method() === 'POST'),
    page.getByText('Odeslat zprávu →').click(),
  ]);
  expect(res.ok()).toBe(true);
  await expect(page.getByText('Zpráva odeslána')).toBeVisible();

  // zpráva se uložila do obsahu
  const content = await (await page.request.get('/api/content')).json();
  expect(content.messages.some((m) => m.name === 'E2E Tester' && m.status === 'nová')).toBe(true);
});

test('formulář pronájmu odešle poptávku a zobrazí potvrzení', async ({ page }) => {
  await page.goto('/pronajem');
  await page.getByPlaceholder('Jméno a příjmení').fill('E2E Nájemce');
  await page.getByPlaceholder('Telefon').fill('777123456');
  await page.getByPlaceholder('E-mail').fill('najemce@example.com');
  await page.getByPlaceholder('Poznámka (počet osob, čas, účel)').fill('Turnaj, 20 osob.');

  const [res] = await Promise.all([
    page.waitForResponse((r) => r.url().includes('/api/submit') && r.request().method() === 'POST'),
    page.getByText('Odeslat poptávku →').click(),
  ]);
  expect(res.ok()).toBe(true);
  await expect(page.getByText('Poptávka odeslána')).toBeVisible();

  const content = await (await page.request.get('/api/content')).json();
  expect(content.reservations.some((r) => r.name === 'E2E Nájemce' && r.status === 'nová')).toBe(true);
});
