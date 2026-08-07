// E2E: potvrzení rezervace nabídne předvyplněnou zprávu žadateli — ze všech míst.
//
// Dřív byla tři různá „Potvrdit": v rozbaleném detailu otevřelo koncept, ale
// v řádku seznamu a fajfka v Přehledu jen tiše přepnuly stav. Žadatel se tak
// o rozhodnutí nedozvěděl a v administraci po tom nezůstala stopa.
import { test, expect } from '@playwright/test';
import { loginToAdmin, openAdminSection, poptavkaZWebu } from './helpers.js';

test('„Potvrdit" v řádku seznamu otevře předvyplněnou zprávu', async ({ page }) => {
  await loginToAdmin(page);
  const { jmeno, email } = await poptavkaZWebu(page);

  await page.reload();
  await openAdminSection(page, 'pronajem');

  const radek = page.locator('div', { hasText: jmeno }).last();
  await expect(radek).toBeVisible();

  await page.getByRole('button', { name: 'Potvrdit', exact: true }).first().click();

  // koncept se otevře sám a je předvyplněný
  await expect(page.getByText(`Zpráva pro ${email}`)).toBeVisible();
  await expect(page.getByLabel('Předmět')).toHaveValue(/Rezervace potvrzena/);
  await expect(page.getByLabel('Text')).toHaveValue(/vaši rezervaci potvrzujeme/);

  // ukládání je zpožděné o 700 ms — bez čekání bychom četli starý stav
  await page.waitForResponse((r) => r.url().includes('/api/content') && r.request().method() === 'PUT' && r.ok());

  // stav se přitom opravdu změnil
  const obsah = await (await page.request.get('/api/content')).json();
  expect(obsah.reservations.find((r) => r.name === jmeno).status).toBe('potvrzená');
});

test('nic neodejde bez kliknutí na Odeslat', async ({ page }) => {
  await loginToAdmin(page);
  const { jmeno } = await poptavkaZWebu(page);

  await page.reload();
  await openAdminSection(page, 'pronajem');
  await page.getByRole('button', { name: 'Potvrdit', exact: true }).first().click();
  await expect(page.getByLabel('Předmět')).toHaveValue(/Rezervace potvrzena/);

  // dokud se neklikne na Odeslat, v historii záznamu nesmí nic být
  const obsah = await (await page.request.get('/api/content')).json();
  expect(obsah.reservations.find((r) => r.name === jmeno).messages).toEqual([]);
});

test('Přehled vede na vyřízení do Pronájmu, netiskne stav potají', async ({ page }) => {
  await loginToAdmin(page);
  const { jmeno } = await poptavkaZWebu(page);

  await page.reload();
  await expect(page.getByText('Nové rezervace')).toBeVisible();

  const karta = page.locator('div').filter({ hasText: jmeno }).last();
  await expect(karta).toBeVisible();

  await page.getByRole('button', { name: 'Vyřídit' }).first().click();

  // jsme v Pronájmu s rozbalenou tou správnou poptávkou
  await expect(page.getByText('Pronájem areálu')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Potvrdit rezervaci' })).toBeVisible();

  // a stav se cestou sám nezměnil
  const obsah = await (await page.request.get('/api/content')).json();
  expect(obsah.reservations.find((r) => r.name === jmeno).status).toBe('nová');
});
