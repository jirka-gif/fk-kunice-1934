#!/usr/bin/env node
// =============================================================================
//  STAŽENÍ ZÁPASŮ Z FOTBAL.CZ  →  NÁVRHY DO ADMINISTRACE
//
//  Spouští se z GitHub Actions (.github/workflows/matches.yml), NE na Vercelu —
//  Playwright potřebuje skutečný prohlížeč, který se do serverless funkce nevejde.
//
//  Postup:
//    1. stáhne obsah webu (GET /api/content) a vezme si u týmů `sourceUrl`
//    2. každou stránku otevře v headless prohlížeči (fotbal.cz blokuje prosté
//       HTTP requesty → 403, proto skutečný prohlížeč a lidská hlavička)
//    3. HTML pošle do čistého parseru (scripts/parse-fotbal.mjs)
//    4. výsledek odešle jako NÁVRH na POST /api/matches (tajný token)
//
//  Skript nikdy nic nepřepisuje přímo na webu — návrh musí potvrdit člověk.
//
//  Proměnné prostředí:
//    SITE_URL       adresa webu (např. https://fkkunice.cz)
//    MATCHES_TOKEN  tajný token, stejný jako na serveru
//    TEAM_NAME      název klubu v rozpisu (výchozí „Kunice")
// =============================================================================
import { parseTeamPage } from './parse-fotbal.mjs';

const SITE_URL = (process.env.SITE_URL || 'http://localhost:3000').replace(/\/+$/, '');
const TOKEN = process.env.MATCHES_TOKEN || '';
const TEAM_NAME = process.env.TEAM_NAME || 'Kunice';
const NAV_TIMEOUT = 45_000;

const log = (...a) => console.log('[zápasy]', ...a);

async function loadTeams() {
  const res = await fetch(`${SITE_URL}/api/content`, { headers: { 'cache-control': 'no-cache' } });
  if (!res.ok) throw new Error(`GET /api/content selhalo (${res.status})`);
  const content = await res.json();
  return (content.teams || []).filter((t) => t.sourceUrl);
}

async function sendResult(payload) {
  const res = await fetch(`${SITE_URL}/api/matches`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-scraper-token': TOKEN },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`POST /api/matches selhalo (${res.status}): ${text}`);
  log('odesláno:', text);
}

async function main() {
  if (!TOKEN) throw new Error('Chybí MATCHES_TOKEN — bez něj API návrh nepřijme.');

  const teams = await loadTeams();
  if (!teams.length) {
    log('Žádný tým nemá vyplněnou adresu zdroje (sourceUrl) — není co stahovat.');
    await sendResult({ proposals: [], error: 'Žádný tým nemá vyplněnou adresu zdroje.' });
    return;
  }
  log(`týmů ke stažení: ${teams.length}`);

  // Playwright importujeme až tady, ať se skript dá spustit i bez něj (kontrola env).
  const { chromium } = await import('@playwright/test');
  const browser = await chromium.launch();
  const context = await browser.newContext({
    locale: 'cs-CZ',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
  });

  const proposals = [];
  const errors = [];

  for (const team of teams) {
    const page = await context.newPage();
    try {
      log(`${team.name} → ${team.sourceUrl}`);
      const response = await page.goto(team.sourceUrl, { waitUntil: 'domcontentloaded', timeout: NAV_TIMEOUT });
      if (response && response.status() >= 400) throw new Error(`stránka vrátila ${response.status()}`);
      // fotbal.cz dopisuje tabulky JavaScriptem — chvíli počkáme na klidnou síť
      await page.waitForLoadState('networkidle', { timeout: NAV_TIMEOUT }).catch(() => {});
      const html = await page.content();

      const parsed = parseTeamPage(html, { teamName: team.scrapeName || TEAM_NAME });
      if (!parsed.nextMatch && !parsed.lastMatch && !parsed.table.length) {
        throw new Error('ze stránky se nepodařilo přečíst žádná data (změnil se formát?)');
      }
      proposals.push({
        teamId: team.id,
        teamName: team.name,
        sourceUrl: team.sourceUrl,
        warnings: parsed.warnings,
        data: { nextMatch: parsed.nextMatch, lastMatch: parsed.lastMatch, table: parsed.table },
      });
      log(`  ✓ zápasů: ${parsed.matchesFound}, tabulka: ${parsed.table.length} řádků, varování: ${parsed.warnings.length}`);
    } catch (err) {
      const message = `${team.name}: ${err.message}`;
      errors.push(message);
      log(`  ✗ ${message}`);
    } finally {
      await page.close();
    }
  }

  await browser.close();
  await sendResult({ proposals, error: errors.length ? errors.join(' | ') : '' });

  // Když se nepovedl ani jeden tým, ukončíme s chybou → GitHub Actions pošle
  // upozornění a v adminu svítí červený stav.
  if (proposals.length === 0) {
    throw new Error(`Nepodařilo se stáhnout žádný tým. ${errors.join(' | ')}`);
  }
  if (errors.length) log(`hotovo s chybami u ${errors.length} týmů`);
  else log('hotovo bez chyb');
}

main().catch(async (err) => {
  console.error('[zápasy] SELHALO:', err.message);
  // I selhání nahlásíme webu, ať administrace ví, že data jsou stará.
  try {
    if (TOKEN) {
      await fetch(`${SITE_URL}/api/matches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-scraper-token': TOKEN },
        body: JSON.stringify({ proposals: [], error: err.message }),
      });
    }
  } catch {}
  process.exit(1);
});
