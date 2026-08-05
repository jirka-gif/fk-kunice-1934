// E2E: veřejné formuláře (kontakt, pronájem) odesílají data na server.
import { test, expect } from '@playwright/test';

test('kontaktní formulář odešle zprávu a zobrazí potvrzení', async ({ page }) => {
  await page.goto('/kontakt');
  await page.getByPlaceholder('Jméno a příjmení', { exact: true }).fill('E2E Tester');
  await page.getByPlaceholder('E-mail', { exact: true }).fill('e2e@example.com');
  await page.getByPlaceholder('Vaše zpráva').fill('Testovací zpráva z e2e testu.');

  const [res] = await Promise.all([
    page.waitForResponse((r) => r.url().includes('/api/submit') && r.request().method() === 'POST'),
    page.getByText('Odeslat zprávu', { exact: true }).click(),
  ]);
  expect(res.ok()).toBe(true);
  await expect(page.getByText('Zpráva odeslána')).toBeVisible();

  // zpráva se uložila do obsahu
  const content = await (await page.request.get('/api/content')).json();
  expect(content.messages.some((m) => m.name === 'E2E Tester' && m.status === 'nová')).toBe(true);
});

// Poptávka pronájmu má vlastní tok (kalendář + výběr času) — testuje ji
// e2e/rezervace.spec.js, kde se dá ověřit i obsazenost termínů.
