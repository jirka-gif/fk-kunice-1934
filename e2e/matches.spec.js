// E2E: návrh zápasu z fotbal.cz — od příjmu přes API až po schválení v adminu.
import { test, expect } from '@playwright/test';
import { loginToAdmin, openAdminSection } from './helpers.js';

const TOKEN = 'e2e-scraper-token';

const proposal = (teamId = 'muziA') => ({
  teamId,
  teamName: 'Muži A',
  sourceUrl: 'https://www.fotbal.cz/souteze/vzorek',
  warnings: [],
  data: {
    nextMatch: {
      home: { short: 'TK', name: 'TJ KAMENICE', side: 'Domácí' },
      away: { short: 'FK', name: 'FK KUNICE', side: 'Hosté' },
      when: '21. 6. 2026 · 16:30', venue: 'TJ Kamenice', dateISO: '2026-06-21T16:30:00',
    },
    lastMatch: { opp: 'FK Testovací soupeř', score: '4:2', result: 'VÝHRA', scorers: '' },
    table: [
      { pos: 1, team: 'FK Kunice', gp: 17, pts: 38, me: true },
      { pos: 2, team: 'SK Mukařov', gp: 17, pts: 33, me: false },
    ],
  },
});

test('bez tokenu API návrh nepřijme', async ({ request }) => {
  const res = await request.post('/api/matches', { data: { proposals: [proposal()] } });
  expect(res.status()).toBe(401);
});

test('se špatným tokenem API návrh nepřijme', async ({ request }) => {
  const res = await request.post('/api/matches', {
    data: { proposals: [proposal()] },
    headers: { 'x-scraper-token': 'spatny-token' },
  });
  expect(res.status()).toBe(401);
});

test('návrh dorazí do adminu a schválení ho zapíše k týmu', async ({ page }) => {
  // 1) scraper pošle návrh
  const res = await page.request.post('/api/matches', {
    data: { proposals: [proposal()] },
    headers: { 'x-scraper-token': TOKEN },
  });
  expect(res.status(), await res.text()).toBe(200);

  // 2) na webu se zatím nic nezměnilo — návrh čeká na potvrzení
  const before = await (await page.request.get('/api/content')).json();
  const teamBefore = before.teams.find((t) => t.id === 'muziA');
  expect(teamBefore.lastMatch.opp).not.toBe('FK Testovací soupeř');
  expect(before.matchProposals.length).toBeGreaterThan(0);

  // 3) admin návrh vidí a potvrdí
  await loginToAdmin(page);
  await openAdminSection(page, 'zapasy');
  await page.getByRole('button', { name: /Návrhy z fotbal\.cz/ }).click();
  await expect(page.getByText('Muži A').first()).toBeVisible();
  await page.getByText(/Zkontrolovat/).first().click();
  await expect(page.getByLabel('Soupeř')).toHaveValue('FK Testovací soupeř');
  await page.getByRole('button', { name: 'Potvrdit a zapsat k týmu' }).click();
  await page.waitForResponse((r) => r.url().includes('/api/content') && r.request().method() === 'PUT' && r.ok());

  // 4) data jsou u týmu a návrh zmizel ze seznamu nevyřízených
  const after = await (await page.request.get('/api/content')).json();
  const teamAfter = after.teams.find((t) => t.id === 'muziA');
  expect(teamAfter.lastMatch.opp).toBe('FK Testovací soupeř');
  expect(teamAfter.lastMatch.score).toBe('4:2');
  expect(teamAfter.nextMatch.venue).toBe('TJ Kamenice');
  expect(teamAfter.table[0].team).toBe('FK Kunice');
  expect(after.matchProposals.find((p) => p.teamId === 'muziA').status).toBe('schválená');
});

test('stav stahování se ukáže v adminu a selhání se pozná', async ({ page }) => {
  await page.request.post('/api/matches', {
    data: { proposals: [], error: 'fotbal.cz vrátil 403' },
    headers: { 'x-scraper-token': TOKEN },
  });

  await loginToAdmin(page);
  await openAdminSection(page, 'zapasy');
  await expect(page.getByText('Poslední stahování selhalo.')).toBeVisible();
  await expect(page.getByText(/403/)).toBeVisible();
});

test('u týmu se dá nastavit adresa zdroje', async ({ page }) => {
  await loginToAdmin(page);
  await openAdminSection(page, 'zapasy');
  const url = `https://www.fotbal.cz/souteze/test-${Date.now()}`;
  await page.getByLabel('Adresa soutěže na fotbal.cz').fill(url);
  await page.waitForResponse((r) => r.url().includes('/api/content') && r.request().method() === 'PUT' && r.ok());

  const content = await (await page.request.get('/api/content')).json();
  expect(content.teams.some((t) => t.sourceUrl === url)).toBe(true);
});
