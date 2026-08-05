// E2E: generátor vizuálu, sekce Sociální sítě a chování při chybě publikace.
import { test, expect } from '@playwright/test';
import { loginToAdmin, openAdminSection } from './helpers.js';

test('generátor vizuálu vrátí obrázek pro vzorová data', async ({ request }) => {
  const res = await request.get('/api/og/match?title=V%C3%9DHRA&home=FK%20KUNICE&away=TJ%20MNICHOVICE&score=3:1&competition=III.%20t%C5%99%C3%ADda&date=14.%206.%202026&scorers=A.%20Pokorn%C3%BD');
  expect(res.status()).toBe(200);
  expect(res.headers()['content-type']).toContain('image/png');
  const body = await res.body();
  expect(body.length).toBeGreaterThan(5000); // opravdový obrázek, ne prázdná odpověď
});

test('vizuál se vygeneruje i bez parametrů (výchozí šablona)', async ({ request }) => {
  const res = await request.get('/api/og/match');
  expect(res.status()).toBe(200);
  expect(res.headers()['content-type']).toContain('image/png');
});

test('vizuál s nahranou fotkou se poskládá podle uloženého příspěvku', async ({ page }) => {
  await loginToAdmin(page);
  const content = await (await page.request.get('/api/content')).json();
  // maličká fotka jako data URL — přesně tak ji ukládá nahrávání v administraci
  const photo = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  content.socialPosts = [{
    id: 'e2e-fotka', createdAt: '2026-07-25T18:00:00.000Z', status: 'koncept',
    targets: ['facebook'], text: 'test', attempts: 0, lastError: '', history: [],
    visual: { title: 'KONEC', home: 'SK POŘÍČANY', away: 'FK KUNICE', score: '4:3', competition: '', date: '', scorers: '', hashtag: '#jednotajedeme', photo },
  }, ...content.socialPosts];
  expect((await page.request.put('/api/content', { data: content })).ok()).toBe(true);

  // v adrese je jen id příspěvku, ne obrovská data URL
  const res = await page.request.get('/api/og/match?post=e2e-fotka');
  expect(res.status()).toBe(200);
  expect(res.headers()['content-type']).toContain('image/png');
  expect((await res.body()).length).toBeGreaterThan(5000);
});

test('nahraný znak soupeře se použije podle názvu týmu', async ({ page }) => {
  await loginToAdmin(page);
  const logo = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const content = await (await page.request.get('/api/content')).json();
  content.opponents = [{ id: 'poricany', name: 'SK Poříčany', logo }];
  expect((await page.request.put('/api/content', { data: content })).ok()).toBe(true);

  // uloží se s dopočítaným id a najde se i při jiném zápisu názvu
  const after = await (await page.request.get('/api/content')).json();
  expect(after.opponents[0].id).toBe('poricany');

  const res = await page.request.get('/api/og/match?home=SK%20PO%C5%98%C3%8D%C4%8CANY&away=FK%20KUNICE&score=4:3');
  expect(res.status()).toBe(200);
  expect(res.headers()['content-type']).toContain('image/png');
  expect((await res.body()).length).toBeGreaterThan(5000);

  // úklid, ať další testy vidí výchozí stav
  content.opponents = [];
  await page.request.put('/api/content', { data: content });
});

test('tlačítko doplní soupeře ze zápasů a znak se pak nahraje k nim', async ({ page }) => {
  await loginToAdmin(page);
  // začneme s prázdným seznamem
  const before = await (await page.request.get('/api/content')).json();
  before.opponents = [];
  await page.request.put('/api/content', { data: before });

  await openAdminSection(page, 'socialni');
  await page.getByRole('button', { name: 'Doplnit soupeře ze zápasů' }).click();
  await page.waitForResponse((r) => r.url().includes('/api/content') && r.request().method() === 'PUT' && r.ok());

  const after = await (await page.request.get('/api/content')).json();
  expect(after.opponents.length).toBeGreaterThan(3);
  // nikdy nenabídne nás samotné a každý klub je právě jednou
  expect(after.opponents.some((o) => o.id === 'kunice')).toBe(false);
  expect(new Set(after.opponents.map((o) => o.id)).size).toBe(after.opponents.length);
  // řádky jsou připravené na nahrání znaku
  expect(after.opponents.every((o) => o.name && o.logo === '')).toBe(true);

  // seznam je vidět i v administraci
  await expect(page.getByText('Znaky soupeřů')).toBeVisible();

  // úklid
  after.opponents = [];
  await page.request.put('/api/content', { data: after });
});

test('neznámé id příspěvku vizuál nerozbije', async ({ request }) => {
  const res = await request.get('/api/og/match?post=takovy-neexistuje&score=1:0');
  expect(res.status()).toBe(200);
  expect(res.headers()['content-type']).toContain('image/png');
});

test('/api/social bez přihlášení odmítne', async ({ request }) => {
  const res = await request.post('/api/social', { data: { id: 'cokoliv' } });
  expect(res.status()).toBe(401);
});

test('admin vytvoří příspěvek, upraví text a uvidí náhled vizuálu', async ({ page }) => {
  await loginToAdmin(page);
  await openAdminSection(page, 'socialni');

  await page.getByRole('button', { name: '+ Nový příspěvek' }).click();
  await page.getByLabel('Domácí').fill('FK KUNICE');
  await page.getByLabel('Hosté').fill('TJ TESTOVACÍ');
  await page.getByLabel('Skóre').fill('5:0');
  await page.getByRole('button', { name: 'Přegenerovat text ze šablony' }).click();
  await page.waitForResponse((r) => r.url().includes('/api/content') && r.request().method() === 'PUT' && r.ok());

  await expect(page.getByLabel('Text příspěvku')).toHaveValue(/5:0/);

  // náhled ukazuje skutečně vygenerovaný obrázek
  const img = page.locator('img[data-og-preview]').first();
  await expect(img).toBeVisible();
  const src = await img.getAttribute('src');
  expect(src).toContain('/api/og/match?');
  const res = await page.request.get(src);
  expect(res.status()).toBe(200);

  const content = await (await page.request.get('/api/content')).json();
  expect(content.socialPosts.some((p) => p.visual.away === 'TJ TESTOVACÍ')).toBe(true);
});

test('zveřejnění bez tokenů Mety selže a chyba se zapíše do historie', async ({ page }) => {
  await loginToAdmin(page);
  await openAdminSection(page, 'socialni');
  await page.getByRole('button', { name: '+ Nový příspěvek' }).click();
  await page.getByLabel('Skóre').fill('2:2');
  await page.waitForResponse((r) => r.url().includes('/api/content') && r.request().method() === 'PUT' && r.ok());

  const content = await (await page.request.get('/api/content')).json();
  const post = content.socialPosts[0];

  // testovací prostředí nemá nastavené tokeny Mety → publikace musí selhat čitelně
  const res = await page.request.post('/api/social', { data: { id: post.id } });
  expect(res.status()).toBe(502);
  const data = await res.json();
  expect(data.ok).toBe(false);
  expect(data.post.status).toBe('chyba');
  expect(data.post.attempts).toBe(1);
  expect(data.post.lastError).toContain('META_PAGE');
  expect(data.post.history.length).toBeGreaterThan(0);
  expect(data.imageUrl).toContain('/api/og/match');

  // chyba je uložená i v obsahu, takže ji admin uvidí i po reloadu
  const after = await (await page.request.get('/api/content')).json();
  expect(after.socialPosts.find((p) => p.id === post.id).status).toBe('chyba');
});

test('potvrzený výsledek zápasu založí koncept příspěvku', async ({ page }) => {
  await page.request.post('/api/matches', {
    headers: { 'x-scraper-token': 'e2e-scraper-token' },
    data: {
      proposals: [{
        teamId: 'muziB',
        teamName: 'Muži B',
        sourceUrl: 'https://www.fotbal.cz/vzorek',
        warnings: [],
        data: {
          nextMatch: null,
          lastMatch: { opp: 'SK Sociální test', score: '6:1', result: 'VÝHRA', scorers: 'J. Testovací 3×', dateISO: '2026-06-14T00:00:00' },
          table: [],
        },
      }],
    },
  });

  await loginToAdmin(page);
  await openAdminSection(page, 'zapasy');
  await page.getByRole('button', { name: /Návrhy z fotbal\.cz/ }).click();
  await page.getByText(/Zkontrolovat/).first().click();
  await page.getByRole('button', { name: 'Potvrdit a zapsat k týmu' }).click();
  await page.waitForResponse((r) => r.url().includes('/api/content') && r.request().method() === 'PUT' && r.ok());

  const content = await (await page.request.get('/api/content')).json();
  const post = content.socialPosts.find((p) => p.visual.away === 'SK SOCIÁLNÍ TEST');
  expect(post).toBeTruthy();
  expect(post.status).toBe('koncept');
  expect(post.visual.score).toBe('6:1');
  expect(post.text).toContain('6:1');
});
