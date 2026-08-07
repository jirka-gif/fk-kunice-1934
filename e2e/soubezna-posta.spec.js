// E2E: pošta doručená během otevřené administrace se uložením nesmí ztratit.
//
// Administrace posílá při ukládání celý obsah tak, jak si ho načetla. Dřív tím
// přepsala seznam rezervací starší verzí a poptávka, která mezitím dorazila,
// zmizela. Tenhle test to hlídá v opravdovém prohlížeči, ne jen na route handleru.
import { test, expect } from '@playwright/test';
import { loginToAdmin, openAdminSection } from './helpers.js';

// Volný termín z pohledu serveru — bere se z veřejné dostupnosti, ať test
// nespadne na tom, že si vymyslíme obsazený nebo zavřený čas.
async function volnyTermin(page, area) {
  const dnes = new Date();
  for (let i = 3; i < 40; i++) {
    const d = new Date(dnes.getTime() + i * 86400000);
    const dateISO = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const res = await page.request.get(`/api/availability?area=${encodeURIComponent(area)}&date=${dateISO}`);
    if (!res.ok()) continue;
    const json = await res.json();
    const volny = (json.slots || []).find((s) => s.free);
    if (volny) return { dateISO, from: volny.time };
  }
  throw new Error('Nenašel se volný termín pro test.');
}

test('poptávka doručená během otevřené administrace přežije uložení', async ({ page }) => {
  await loginToAdmin(page);

  // 1) administrace má načtený obsah BEZ nové poptávky
  await openAdminSection(page, 'nastaveni');
  await expect(page.getByLabel('Motto')).toBeVisible();

  const content = await (await page.request.get('/api/content')).json();
  const area = content.rentalPlans?.[0]?.name || 'Hlavní stadion';
  const { dateISO, from } = await volnyTermin(page, area);

  // 2) mezitím dorazí poptávka z webu — administrace o ní neví
  const jmeno = `Souběh ${Date.now()}`;
  const odeslani = await page.request.post('/api/submit', {
    data: {
      type: 'reservation',
      payload: { name: jmeno, email: 'soubeh@example.cz', area, dateISO, from, note: 'e2e' },
    },
  });
  expect(odeslani.ok()).toBeTruthy();

  // 3) administrace uloží svou (starší) verzi obsahu
  const motto = `Souběžné motto ${Date.now()}`;
  await page.getByLabel('Motto').fill(motto);
  await page.waitForResponse((r) => r.url().includes('/api/content') && r.request().method() === 'PUT' && r.ok());

  // 4) na serveru musí být OBOJÍ — úprava admina i poptávka, kterou neviděl
  const po = await (await page.request.get('/api/content')).json();
  expect(po.club.motto).toBe(motto);
  expect(po.reservations.map((r) => r.name)).toContain(jmeno);
});

test('smazání rezervace z administrace se souběhem nerozbilo', async ({ page }) => {
  await loginToAdmin(page);
  await openAdminSection(page, 'pronajem');

  // založíme rezervaci rovnou v administraci (telefonická), ať je co mazat
  await page.getByRole('button', { name: '+ Nová rezervace (telefon / osobně)' }).click();
  const jmeno = `Ke smazání ${Date.now()}`;
  await page.getByLabel('Jméno / firma').first().fill(jmeno);
  await page.waitForResponse((r) => r.url().includes('/api/content') && r.request().method() === 'PUT' && r.ok());

  const pred = await (await page.request.get('/api/content')).json();
  expect(pred.reservations.map((r) => r.name)).toContain(jmeno);

  // smazání — musí projít i u té úplně nejnovější položky
  page.once('dialog', (d) => d.accept());
  await page.getByRole('button', { name: 'Smazat rezervaci' }).first().click();
  await page.waitForResponse((r) => r.url().includes('/api/content') && r.request().method() === 'PUT' && r.ok());

  const po = await (await page.request.get('/api/content')).json();
  expect(po.reservations.map((r) => r.name)).not.toContain(jmeno);
});
