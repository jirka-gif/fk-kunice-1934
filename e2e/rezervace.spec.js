// E2E: poptávka pronájmu — od kalendáře přes odeslání až po potvrzení v adminu.
import { test, expect } from '@playwright/test';
import { loginToAdmin, openAdminSection } from './helpers.js';

// termín v budoucnu, uvnitř povoleného horizontu
const den = new Date(Date.now() + 7 * 86400000);
const DATE = `${den.getFullYear()}-${String(den.getMonth() + 1).padStart(2, '0')}-${String(den.getDate()).padStart(2, '0')}`;

// vyprázdní rezervace, ať testy nezávisí na tom, co zbylo po předchozích
async function vycistit(page) {
  await loginToAdmin(page);
  const content = await (await page.request.get('/api/content')).json();
  content.reservations = [];
  expect((await page.request.put('/api/content', { data: content })).ok()).toBe(true);
}

test('kalendář nabízí volné termíny a obsazený je přeškrtnutý', async ({ page }) => {
  await vycistit(page);

  // obsadíme jeden termín
  const content = await (await page.request.get('/api/content')).json();
  content.reservations = [{
    id: 'obsazeno', name: 'Někdo', contact: '', area: 'Hlavní stadion',
    dateISO: DATE, from: '10:00', to: '11:00', status: 'nová', source: 'web', note: '',
  }];
  await page.request.put('/api/content', { data: content });

  const den = await (await page.request.get(`/api/availability?area=Hlavní stadion&date=${DATE}`)).json();
  expect(den.slots.find((s) => s.time === '10:00')).toMatchObject({ free: false, reason: 'obsazeno' });
  expect(den.slots.find((s) => s.time === '11:00').free).toBe(true);
});

test('poptávka projde a dorazí do adminu jako nevyřízená', async ({ page }) => {
  await vycistit(page);

  const res = await page.request.post('/api/submit', {
    data: {
      type: 'reservation',
      payload: { name: 'E2E Nájemce', contact: '777123456', area: 'Hlavní stadion', dateISO: DATE, from: '15:00', note: 'Turnaj' },
    },
  });
  expect(res.status()).toBe(200);

  const content = await (await page.request.get('/api/content')).json();
  const r = content.reservations.find((x) => x.name === 'E2E Nájemce');
  expect(r).toBeTruthy();
  expect(r.status).toBe('nová');
  expect(r.dateISO).toBe(DATE);
  expect(r.from).toBe('15:00');
  expect(r.to).toBe('16:00');

  // administrace načítá obsah při otevření — po nové poptávce ji obnovíme
  await page.reload();
  await openAdminSection(page, 'pronajem');
  await expect(page.getByText('E2E Nájemce')).toBeVisible();
});

test('stejný termín podruhé nikdo nepoptá', async ({ page }) => {
  await vycistit(page);
  const poptavka = (name) => ({
    type: 'reservation',
    payload: { name, contact: '', area: 'Hlavní stadion', dateISO: DATE, from: '16:00', note: '' },
  });

  expect((await page.request.post('/api/submit', { data: poptavka('První') })).status()).toBe(200);

  const druha = await page.request.post('/api/submit', { data: poptavka('Druhý') });
  expect(druha.status()).toBe(409);
  expect((await druha.json()).error).toContain('obsazený');

  // a opravdu se neuložila
  const content = await (await page.request.get('/api/content')).json();
  expect(content.reservations.filter((r) => r.dateISO === DATE && r.from === '16:00').length).toBe(1);
});

test('zamítnutá rezervace termín zase uvolní', async ({ page }) => {
  await vycistit(page);
  await page.request.post('/api/submit', {
    data: { type: 'reservation', payload: { name: 'Ke zamítnutí', contact: '', area: 'Hlavní stadion', dateISO: DATE, from: '17:00', note: '' } },
  });

  let den = await (await page.request.get(`/api/availability?area=Hlavní stadion&date=${DATE}`)).json();
  expect(den.slots.find((s) => s.time === '17:00').free).toBe(false);

  const content = await (await page.request.get('/api/content')).json();
  content.reservations = content.reservations.map((r) => (r.from === '17:00' ? { ...r, status: 'zamítnutá' } : r));
  await page.request.put('/api/content', { data: content });

  den = await (await page.request.get(`/api/availability?area=Hlavní stadion&date=${DATE}`)).json();
  expect(den.slots.find((s) => s.time === '17:00').free).toBe(true);
});

test('stránka pronájmu ukáže kalendář a po výběru dne i časy', async ({ page }) => {
  await vycistit(page);
  await page.goto('/pronajem');

  // kalendář se vykreslí a nabídne dny
  const den = page.getByRole('button', { name: new RegExp(`^${new Date(DATE).getDate()}\\.`) }).first();
  await expect(den).toBeVisible();
  await den.click();

  // po výběru dne se objeví volné časy
  await expect(page.getByText(/Volné časy/)).toBeVisible();
  await expect(page.getByRole('button', { name: '15:00' })).toBeVisible();
});

test('vlastní rozbalovací nabídka ploch funguje', async ({ page }) => {
  await page.goto('/pronajem');
  const vyber = page.getByRole('combobox', { name: 'Plocha' }).first();
  await expect(vyber).toBeVisible();
  await vyber.click();
  const nabidka = page.getByRole('listbox').first();
  await expect(nabidka).toBeVisible();
  const volba = nabidka.getByRole('option').nth(1);
  const nazev = (await volba.textContent()).trim();
  await volba.click();
  await expect(nabidka).toHaveCount(0);
  await expect(vyber).toContainText(nazev);
});

test('admin nastaví otevírací dobu a web se podle ní řídí', async ({ page }) => {
  await vycistit(page);
  await openAdminSection(page, 'pronajem');
  await page.getByRole('button', { name: 'Otevírací doba' }).click();
  await page.getByLabel('Otevřeno od').fill('09:00');
  await page.getByLabel('Otevřeno do').fill('12:00');
  await page.waitForResponse((r) => r.url().includes('/api/content') && r.request().method() === 'PUT' && r.ok());

  const den = await (await page.request.get(`/api/availability?area=Hlavní stadion&date=${DATE}`)).json();
  expect(den.slots.map((s) => s.time)).toEqual(['09:00', '10:00', '11:00']);

  // uklidíme zpět na výchozí dobu
  const content = await (await page.request.get('/api/content')).json();
  content.rentalSettings = { ...content.rentalSettings, openFrom: '08:00', openTo: '22:00' };
  await page.request.put('/api/content', { data: content });
});
