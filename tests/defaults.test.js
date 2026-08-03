// Testy datové vrstvy: sestavení výchozího obsahu, normalizace týmů, slučování.
import { describe, it, expect } from 'vitest';
import {
  DEFAULTS,
  buildDefaults,
  mergeStored,
  normalizeTeams,
  toPlayer,
  clone,
  emptyNextMatch,
  emptyLastMatch,
  emptyMatchDetail,
} from '@/lib/defaults';

describe('buildDefaults / DEFAULTS', () => {
  it('obsahuje všechny hlavní sekce webu', () => {
    for (const key of [
      'club', 'teams', 'whyCards', 'camps', 'facilities', 'news', 'sponsors',
      'rentalPlans', 'rentalFaq', 'quickActions', 'people',
      'reservations', 'messages',
    ]) {
      expect(DEFAULTS, `chybí sekce ${key}`).toHaveProperty(key);
    }
  });

  it('má 11 týmů a každý tým má zápasová pole', () => {
    expect(DEFAULTS.teams.length).toBe(11);
    for (const t of DEFAULTS.teams) {
      expect(t).toHaveProperty('nextMatch');
      expect(t).toHaveProperty('lastMatch');
      expect(Array.isArray(t.results)).toBe(true);
      expect(Array.isArray(t.table)).toBe(true);
      expect(t).toHaveProperty('matchDetail');
    }
  });

  it('Muži A mají výsledky a detail zápasu z club.js', () => {
    const a = DEFAULTS.teams.find((t) => t.id === 'muziA');
    expect(a).toBeTruthy();
    expect(a.results.length).toBeGreaterThan(0);
    expect(a.matchDetail.events.length).toBeGreaterThan(0);
  });

  it('zprávy z kontaktního formuláře začínají prázdné', () => {
    expect(DEFAULTS.messages).toEqual([]);
  });

  it('buildDefaults vrací pokaždé nový objekt', () => {
    const a = buildDefaults();
    const b = buildDefaults();
    expect(a).not.toBe(b);
    expect(a.teams.length).toBe(b.teams.length);
  });
});

describe('toPlayer', () => {
  it('převede starý formát (string) na objekt hráče', () => {
    const p = toPlayer('Jan Novák', 0);
    expect(p.name).toBe('Jan Novák');
    expect(p.number).toBe(1);
    expect(p.position).toBe('GK');
    expect(p.photo).toBe('');
  });

  it('doplní chybějící pole u objektu a zachová vyplněná', () => {
    const p = toPlayer({ name: 'Petr Svoboda', goals: 7 }, 4);
    expect(p.name).toBe('Petr Svoboda');
    expect(p.goals).toBe(7);
    expect(p.number).toBe(5);
    expect(p).toHaveProperty('assists');
  });
});

describe('normalizeTeams', () => {
  it('doplní chybějící zápasová pole týmu', () => {
    const data = { teams: [{ id: 'muziA', players: ['Jan Novák'] }] };
    normalizeTeams(data, null);
    const t = data.teams[0];
    expect(t.nextMatch).toBeTruthy();
    expect(t.lastMatch).toBeTruthy();
    expect(Array.isArray(t.results)).toBe(true);
    expect(Array.isArray(t.table)).toBe(true);
    expect(t.matchDetail).toBeTruthy();
    expect(typeof t.players[0]).toBe('object');
  });

  it('migruje stará globální zápasová data na Muže A a smaže je z kořene', () => {
    const legacy = {
      nextMatch: { ...emptyNextMatch(), venue: 'Starý areál' },
      results: [{ opp: 'Soupeř', score: '2:1' }],
      leagueTable: [{ team: 'Kunice' }],
      matchDetail: { ...emptyMatchDetail(), header: 'STARÝ ZÁPAS' },
    };
    const data = { teams: [{ id: 'muziA', players: [] }], ...legacy };
    normalizeTeams(data, legacy);
    const a = data.teams[0];
    expect(a.nextMatch.venue).toBe('Starý areál');
    expect(a.results[0].score).toBe('2:1');
    expect(a.table[0].team).toBe('Kunice');
    expect(a.matchDetail.header).toBe('STARÝ ZÁPAS');
    expect(data.nextMatch).toBeUndefined();
    expect(data.results).toBeUndefined();
    expect(data.leagueTable).toBeUndefined();
    expect(data.matchDetail).toBeUndefined();
  });

  it('nepřepíše data ostatních týmů starými globálními daty', () => {
    const legacy = { nextMatch: { ...emptyNextMatch(), venue: 'Starý areál' } };
    const data = { teams: [{ id: 'dorost', players: [] }], ...legacy };
    normalizeTeams(data, legacy);
    expect(data.teams[0].nextMatch.venue).not.toBe('Starý areál');
  });
});

describe('mergeStored', () => {
  it('bez uloženého obsahu vrátí kopii výchozích dat', () => {
    const m = mergeStored(null);
    expect(m).not.toBe(DEFAULTS);
    expect(m.teams.length).toBe(DEFAULTS.teams.length);
  });

  it('doplní nové sekce, které v uloženém obsahu chybí', () => {
    const saved = { club: { name: 'FK Kunice 1934' } };
    const m = mergeStored(saved);
    expect(m.news).toBeTruthy();
    expect(m.sponsors).toBeTruthy();
    expect(Array.isArray(m.messages)).toBe(true);
  });

  it('uložená sekce přebije výchozí hodnotu', () => {
    const saved = clone(DEFAULTS);
    saved.sponsors = ['JEDINÝ PARTNER'];
    const m = mergeStored(saved);
    expect(m.sponsors).toEqual(['JEDINÝ PARTNER']);
  });

  it('vždy zajistí pole messages', () => {
    expect(mergeStored({ messages: 'nesmysl' }).messages).toEqual([]);
    expect(mergeStored({}).messages).toEqual([]);
  });

  it('nemutuje DEFAULTS', () => {
    const before = DEFAULTS.sponsors.length;
    const m = mergeStored({ sponsors: ['A'] });
    m.sponsors.push('B');
    expect(DEFAULTS.sponsors.length).toBe(before);
  });
});

describe('prázdné zápasové struktury', () => {
  it('mají očekávaný tvar', () => {
    expect(emptyNextMatch().home.name).toBe('KUNICE');
    expect(emptyLastMatch()).toHaveProperty('scorers');
    expect(emptyMatchDetail().score).toEqual({ home: 0, away: 0 });
  });
});
