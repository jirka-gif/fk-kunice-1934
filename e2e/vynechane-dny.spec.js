// E2E: u opakované rezervace jdou vynechat konkrétní dny.
//
// Bez toho se dlouhodobý pronájem nedá provozovat přes prázdniny a turnaje —
// pole `skipDates` v datech bylo, ale nikde se nedalo vyplnit.
import { test, expect } from '@playwright/test';
import { loginToAdmin, openAdminSection, volnyTermin } from './helpers.js';

const posun = (dateISO, dnu) => {
  const d = new Date(`${dateISO}T00:00:00`);
  d.setDate(d.getDate() + dnu);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

test('vynechaný den se v kalendáři uvolní, série jede dál', async ({ page }) => {
  const area = 'Hlavní stadion';
  const { dateISO, from } = await volnyTermin(page, area);
  const zaTyden = posun(dateISO, 7);
  const zaDvaTydny = posun(dateISO, 14);

  const jmeno = `Série ${Date.now()}`;
  await page.request.post('/api/submit', {
    data: { type: 'reservation', payload: { name: jmeno, email: 'serie@example.cz', area, dateISO, from, repeat: 'weekly' } },
  });

  await loginToAdmin(page);
  await openAdminSection(page, 'pronajem');
  await page.getByText(jmeno).first().click();

  // klub zapne opakování
  await page.locator('[data-prani-opakovani]').getByRole('button', { name: 'Zapnout opakování' }).click();
  await page.waitForResponse((r) => r.url().includes('/api/content') && r.request().method() === 'PUT' && r.ok());

  // teď je obsazený i termín za týden
  const pred = await (await page.request.get(`/api/availability?area=${encodeURIComponent(area)}&date=${zaTyden}`)).json();
  expect(pred.slots.find((s) => s.time === from).free).toBe(false);

  // editor vynechaných dnů se objeví až u opakované rezervace
  const dny = page.locator('[data-vynechane-dny]');
  await expect(dny).toBeVisible();

  await dny.getByRole('button', { name: /Přidat/ }).click();
  await dny.locator('input').first().fill(zaTyden);
  await page.waitForResponse((r) => r.url().includes('/api/content') && r.request().method() === 'PUT' && r.ok());

  // ten den je zase volný…
  const po = await (await page.request.get(`/api/availability?area=${encodeURIComponent(area)}&date=${zaTyden}`)).json();
  expect(po.slots.find((s) => s.time === from).free).toBe(true);

  // …ale série pokračuje
  const dalsi = await (await page.request.get(`/api/availability?area=${encodeURIComponent(area)}&date=${zaDvaTydny}`)).json();
  expect(dalsi.slots.find((s) => s.time === from).free).toBe(false);
});

test('u jednorázové rezervace se vynechané dny vůbec nenabízejí', async ({ page }) => {
  const area = 'Hlavní stadion';
  const { dateISO, from } = await volnyTermin(page, area);

  const jmeno = `Jednorázová ${Date.now()}`;
  await page.request.post('/api/submit', {
    data: { type: 'reservation', payload: { name: jmeno, email: 'x@example.cz', area, dateISO, from } },
  });

  await loginToAdmin(page);
  await openAdminSection(page, 'pronajem');
  await page.getByText(jmeno).first().click();

  await expect(page.locator('[data-vynechane-dny]')).toHaveCount(0);
});
