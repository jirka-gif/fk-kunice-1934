// E2E: administrace si po návratu na záložku všimne, že mezitím dorazila pošta.
//
// Obsah se načítá jednou při otevření stránky, takže poptávka odeslaná potom
// nebyla vidět až do ručního obnovení. Pruh na to upozorní a načtení nechá
// na člověku — v administraci se edituje a tiché přepsání by sebralo práci.
import { test, expect } from '@playwright/test';
import { loginToAdmin } from './helpers.js';

test('pruh upozorní na zprávu, která dorazila při otevřené administraci', async ({ page }) => {
  await loginToAdmin(page);
  await expect(page.getByText('Co je potřeba udělat')).toBeVisible();

  // dokud nic nepřijde, pruh svítit nesmí
  await expect(page.locator('[data-nova-posta]')).toHaveCount(0);

  const text = `Souběžný dotaz ${Date.now()}`;
  const res = await page.request.post('/api/submit', {
    data: { type: 'message', payload: { name: 'Eva', email: 'eva@example.cz', text } },
  });
  expect(res.ok()).toBeTruthy();

  // návrat na záložku spustí kontrolu
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));

  const pruh = page.locator('[data-nova-posta]');
  await expect(pruh).toBeVisible();
  // jednotné číslo — „1 nové zprávy" vypadá jako chyba webu
  await expect(pruh).toContainText('1 zpráva');

  // po načtení je zpráva v administraci a pruh zmizí
  await pruh.getByRole('button', { name: 'Načíst' }).click();
  await expect(page.getByText('Co je potřeba udělat')).toBeVisible();
  await expect(page.locator('[data-nova-posta]')).toHaveCount(0);

  const obsah = await (await page.request.get('/api/content')).json();
  expect(obsah.messages.map((m) => m.text)).toContain(text);
});

test('/api/inbox nepustí nepřihlášeného', async ({ page }) => {
  const res = await page.request.get('/api/inbox');
  expect(res.status()).toBe(401);
});
