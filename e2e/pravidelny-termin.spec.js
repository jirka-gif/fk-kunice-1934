// E2E: pravidelný termín z webu je nezávazné přání, sérii zapíná klub.
//
// Kdyby se opakování zabíralo hned při odeslání, jedna neschválená poptávka by
// zablokovala půl roku kalendáře. Proto se drží jen vybraný termín a další
// týdny zůstávají volné, dokud klub přání nepotvrdí.
import { test, expect } from '@playwright/test';
import { loginToAdmin, openAdminSection, volnyTermin } from './helpers.js';

test('návštěvník si řekne o pravidelný termín a klub ho zapne', async ({ page }) => {
  const area = 'Hlavní stadion';
  const { dateISO, from } = await volnyTermin(page, area);

  // za týden ve stejný čas musí být volno, ať se pozná, že přání neblokuje
  const zaTyden = (() => {
    const d = new Date(`${dateISO}T00:00:00`);
    d.setDate(d.getDate() + 7);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();

  const jmeno = `Pravidelný ${Date.now()}`;
  const odeslani = await page.request.post('/api/submit', {
    data: {
      type: 'reservation',
      payload: { name: jmeno, email: 'pravidelny@example.cz', area, dateISO, from, repeat: 'weekly', repeatUntil: '2027-06-30' },
    },
  });
  expect(odeslani.ok()).toBeTruthy();

  // 1) další týden je pořád volný — přání nic nezabralo
  const dostupnost = await (await page.request.get(`/api/availability?area=${encodeURIComponent(area)}&date=${zaTyden}`)).json();
  expect(dostupnost.slots.find((s) => s.time === from).free).toBe(true);

  // 2) v administraci je přání vidět
  await loginToAdmin(page);
  await openAdminSection(page, 'pronajem');
  await page.getByText(jmeno).first().click();

  const prani = page.locator('[data-prani-opakovani]');
  await expect(prani).toBeVisible();
  await expect(prani).toContainText('každý týden');

  // 3) klub opakování zapne
  await prani.getByRole('button', { name: 'Zapnout opakování' }).click();
  await page.waitForResponse((r) => r.url().includes('/api/content') && r.request().method() === 'PUT' && r.ok());

  const obsah = await (await page.request.get('/api/content')).json();
  const rez = obsah.reservations.find((r) => r.name === jmeno);
  expect(rez.repeat).toBe('weekly');
  expect(rez.repeatUntil).toBe('2027-06-30');
  expect(rez.repeatWanted).toBe(''); // přání je vyřízené, nenabízí se znovu

  // 4) teprve teď je další týden obsazený
  const po = await (await page.request.get(`/api/availability?area=${encodeURIComponent(area)}&date=${zaTyden}`)).json();
  expect(po.slots.find((s) => s.time === from).free).toBe(false);
});

test('bez zaškrtnutí se nic neopakuje', async ({ page }) => {
  const area = 'Hlavní stadion';
  const { dateISO, from } = await volnyTermin(page, area);

  const jmeno = `Jednorázový ${Date.now()}`;
  await page.request.post('/api/submit', {
    data: { type: 'reservation', payload: { name: jmeno, email: 'x@example.cz', area, dateISO, from } },
  });

  await loginToAdmin(page);
  await openAdminSection(page, 'pronajem');
  await page.getByText(jmeno).first().click();

  await expect(page.locator('[data-prani-opakovani]')).toHaveCount(0);
});
