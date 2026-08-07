// E2E: přihláška do klubu — od formuláře na webu po vyřízení v adminu.
import { test, expect } from '@playwright/test';
import { loginToAdmin, openAdminSection } from './helpers.js';

test('přihláška z webu dorazí do adminu a jde vyřídit', async ({ page }) => {
  const jmeno = `Zájemce ${Date.now()}`;

  // 1) odeslání z veřejného formuláře
  await page.goto('/kontakt');
  await page.getByPlaceholder('Jméno a příjmení zájemce').fill(jmeno);
  await page.getByPlaceholder('Telefon nebo e-mail').fill('rodic@example.com');
  await page.getByPlaceholder('Jméno rodiče (u dětí)').fill('Jana Nováková');
  await Promise.all([
    page.waitForResponse((r) => r.url().includes('/api/submit') && r.request().method() === 'POST'),
    page.getByText('Odeslat přihlášku').click(),
  ]);
  await expect(page.getByText('Přihláška odeslána')).toBeVisible();

  // 2) uložila se jako nová se skutečnými poli
  const content = await (await page.request.get('/api/content')).json();
  const r = content.cmsRegistrations.find((x) => x.name === jmeno);
  expect(r).toBeTruthy();
  expect(r.status).toBe('nová');
  expect(r.contact).toBe('rodic@example.com');
  expect(r.parent).toBe('Jana Nováková');
  expect(r.team).toBeTruthy(); // předvyplněná kategorie

  // 3) v adminu je mezi novými a dá se vyřídit
  await loginToAdmin(page);
  await openAdminSection(page, 'registrace');
  await expect(page.getByText(jmeno).first()).toBeVisible();
  await page.getByText(jmeno).first().click();
  await page.getByRole('button', { name: 'Označit jako vyřízenou' }).click();
  await page.waitForResponse((rq) => rq.url().includes('/api/content') && rq.request().method() === 'PUT' && rq.ok());

  await page.getByRole('button', { name: /^Nové/ }).click();
  await expect(page.getByText(jmeno)).toHaveCount(0);
  await page.getByRole('button', { name: /^Vyřízené/ }).click();
  // jméno je i v rozbaleném detailu a v předvyplněné zprávě rodiči
  await expect(page.getByText(jmeno).first()).toBeVisible();
});

test('přihláška bez jména se neodešle', async ({ page }) => {
  await page.goto('/kontakt');
  await page.getByPlaceholder('Telefon nebo e-mail').fill('nekdo@example.com');
  await page.getByText('Odeslat přihlášku').click();
  await expect(page.getByText('Vyplň prosím jméno zájemce.')).toBeVisible();
});

test('přihláška bez kontaktu se neodešle', async ({ page }) => {
  await page.goto('/kontakt');
  await page.getByPlaceholder('Jméno a příjmení zájemce').fill('Někdo Bez Kontaktu');
  await page.getByText('Odeslat přihlášku').click();
  await expect(page.getByText(/Vyplň prosím kontakt/)).toBeVisible();
});
