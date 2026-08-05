// Testy parseru stránky soutěže — běží nad uloženým vzorkem HTML, nikdy nevolá
// živý web (fotbal.cz scraping blokuje a HTML se mění).
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseTeamPage, parseTable, parseMatches, cellText, decodeEntities, shortName } from '@/scripts/parse-fotbal.mjs';

const html = readFileSync(join(process.cwd(), 'tests/fixtures/fotbal-sample.html'), 'utf8');
const NOW = '2026-06-16T12:00:00';

describe('pomocné funkce', () => {
  it('dekóduje české entity', () => {
    expect(decodeEntities('Struha&#345;ov &amp; syn')).toBe('Struhařov & syn');
  });
  it('vyčistí text buňky od značek a mezer', () => {
    expect(cellText('<td><a href="#">  FK   Kunice </a></td>')).toBe('FK Kunice');
  });
  it('udělá zkratku týmu', () => {
    expect(shortName('FK Kunice')).toBe('FK');
    expect(shortName('Mnichovice')).toBe('MN');
    expect(shortName('')).toBe('??');
  });
});

describe('parseTable', () => {
  const table = parseTable(html, 'Kunice');

  it('najde všech 5 týmů ve správném pořadí', () => {
    expect(table.length).toBe(5);
    expect(table.map((r) => r.pos)).toEqual([1, 2, 3, 4, 5]);
    expect(table[0].team).toBe('FK Kunice');
  });

  it('přečte odehrané zápasy a body', () => {
    expect(table[0].gp).toBe(17);
    expect(table[0].pts).toBe(38);
    expect(table[4].pts).toBe(19);
  });

  it('označí náš tým', () => {
    expect(table[0].me).toBe(true);
    expect(table.filter((r) => r.me).length).toBe(1);
  });

  it('na stránce bez tabulky vrátí prázdné pole', () => {
    expect(parseTable('<html><body><p>Nic tu není</p></body></html>', 'Kunice')).toEqual([]);
  });
});

describe('parseMatches', () => {
  const matches = parseMatches(html);

  it('najde všechny zápasy včetně různých formátů data', () => {
    expect(matches.length).toBe(6);
    expect(matches[1].dateISO.startsWith('2026-05-31')).toBe(true);
  });

  it('rozliší odehraný zápas (skóre) od plánovaného (čas)', () => {
    const played = matches.filter((m) => m.score);
    const upcoming = matches.filter((m) => !m.score);
    expect(played.length).toBe(4);
    expect(upcoming.length).toBe(2);
    expect(upcoming[0].time).toBe('16:30');
  });

  it('rozdělí domácí a hosty', () => {
    expect(matches[0].home).toBe('Sokol Struhařov');
    expect(matches[0].away).toBe('FK Kunice');
    expect(matches[0].score).toEqual({ home: 1, away: 3 });
  });

  it('do dateISO promítne i čas plánovaného zápasu', () => {
    const next = matches.find((m) => m.time === '16:30');
    expect(next.dateISO).toBe('2026-06-21T16:30:00');
  });
});

describe('parseTeamPage', () => {
  const result = parseTeamPage(html, { teamName: 'Kunice', now: NOW });

  it('vybere nejbližší plánovaný zápas', () => {
    expect(result.nextMatch.dateISO).toBe('2026-06-21T16:30:00');
    expect(result.nextMatch.home.name).toBe('TJ KAMENICE');
    expect(result.nextMatch.away.name).toBe('FK KUNICE');
    expect(result.nextMatch.when).toContain('16:30');
  });

  it('u venkovního zápasu uvede jako místo soupeře', () => {
    expect(result.nextMatch.venue).toBe('TJ Kamenice');
  });

  it('vybere poslední odehraný výsledek a spočítá výhru/prohru', () => {
    expect(result.lastMatch.dateISO).toBe('2026-06-14T00:00:00');
    expect(result.lastMatch.opp).toBe('TJ Mnichovice');
    expect(result.lastMatch.score).toBe('3:1');
    expect(result.lastMatch.result).toBe('VÝHRA');
  });

  it('u venkovní prohry otočí skóre podle nás', () => {
    const early = parseTeamPage(html, { teamName: 'Kunice', now: '2026-06-01T12:00:00' });
    // poslední odehraný k 1. 6. je 31. 5. (Kunice 2:0 doma)
    expect(early.lastMatch.score).toBe('2:0');
    expect(early.lastMatch.result).toBe('VÝHRA');
  });

  it('remízu pozná správně', () => {
    const r = parseTeamPage(html, { teamName: 'Kunice', now: '2026-06-10T12:00:00' });
    expect(r.lastMatch.score).toBe('1:1');
    expect(r.lastMatch.result).toBe('REMÍZA');
  });

  it('vrátí i tabulku', () => {
    expect(result.table.length).toBe(5);
    expect(result.table.find((t) => t.me).team).toBe('FK Kunice');
  });

  it('bez varování, když se povedlo všechno', () => {
    expect(result.warnings).toEqual([]);
  });
});

describe('odolnost parseru', () => {
  it('prázdná stránka nespadne a vrátí varování', () => {
    const r = parseTeamPage('<html><body></body></html>', { teamName: 'Kunice', now: NOW });
    expect(r.nextMatch).toBe(null);
    expect(r.lastMatch).toBe(null);
    expect(r.table).toEqual([]);
    expect(r.warnings.length).toBeGreaterThan(0);
  });

  it('stránka s chybovou hláškou (403) nevymyslí data', () => {
    const r = parseTeamPage('<html><body><h1>403 Forbidden</h1></body></html>', { teamName: 'Kunice', now: NOW });
    expect(r.matchesFound).toBe(0);
    expect(r.warnings.some((w) => w.includes('zápasy'))).toBe(true);
  });

  it('tým, který na stránce není, nevrátí cizí zápasy', () => {
    const r = parseTeamPage(html, { teamName: 'Sparta', now: NOW });
    expect(r.matchesFound).toBe(0);
    expect(r.nextMatch).toBe(null);
  });

  it('když jsou všechny zápasy odehrané, chybí jen příští zápas', () => {
    const r = parseTeamPage(html, { teamName: 'Kunice', now: '2027-01-01T00:00:00' });
    expect(r.nextMatch).toBe(null);
    expect(r.lastMatch).toBeTruthy();
    expect(r.warnings).toContain('Nenašel jsem žádný plánovaný zápas.');
  });
});
