// Testy registru znaků soupeřů — párování názvů a doplnění do vizuálu.
import { describe, it, expect } from 'vitest';
import { DEFAULTS, mergeStored, clone, opponentKey, normalizeOpponents, findOpponentLogo, emptyOpponent, collectOpponentNames, cleanClubName } from '@/lib/defaults';

const LOGO = 'data:image/png;base64,AAAA';

describe('opponentKey', () => {
  it('odstraní diakritiku i velikost písmen', () => {
    expect(opponentKey('SK Poříčany')).toBe(opponentKey('sk poricany'));
    expect(opponentKey('TJ Velké Popovice')).toBe(opponentKey('Velke Popovice'));
  });

  it('zahodí zkratku klubu na začátku, ať název sedne i bez ní', () => {
    expect(opponentKey('SK Poříčany')).toBe('poricany');
    expect(opponentKey('Poříčany')).toBe('poricany');
    expect(opponentKey('FK Kunice')).toBe('kunice');
  });

  it('samotnou zkratku nechá být (jinak by nezbylo nic)', () => {
    expect(opponentKey('Sokol')).toBe('sokol');
  });

  it('sloučí věkové kategorie a béčka pod jeden klub — znak má klub jeden', () => {
    expect(opponentKey('SK Mukařov U15')).toBe('mukarov');
    expect(opponentKey('SK Mukařov příp. B')).toBe('mukarov');
    expect(opponentKey('TJ Velké Popovice U15 B')).toBe('velke-popovice');
    expect(opponentKey('FK Kunice B')).toBe('kunice');
  });

  it('prázdný vstup vrátí prázdný klíč', () => {
    expect(opponentKey('')).toBe('');
    expect(opponentKey(null)).toBe('');
  });
});

describe('findOpponentLogo', () => {
  const opponents = [
    { id: 'poricany', name: 'SK Poříčany', logo: LOGO },
    { id: 'mukarov', name: 'SK Mukařov', logo: '' },
  ];

  it('najde znak i při jiném zápisu názvu', () => {
    expect(findOpponentLogo(opponents, 'SK POŘÍČANY')).toBe(LOGO);
    expect(findOpponentLogo(opponents, 'poricany')).toBe(LOGO);
  });

  it('soupeř bez nahraného znaku vrátí prázdno (vykreslí se zkratka)', () => {
    expect(findOpponentLogo(opponents, 'SK Mukařov')).toBe('');
  });

  it('neznámý soupeř vrátí prázdno', () => {
    expect(findOpponentLogo(opponents, 'TJ Kamenice')).toBe('');
    expect(findOpponentLogo([], 'Cokoliv')).toBe('');
    expect(findOpponentLogo(null, 'Cokoliv')).toBe('');
  });
});

describe('normalizeOpponents', () => {
  it('dopočítá id z názvu a doplní chybějící pole', () => {
    const d = normalizeOpponents({ opponents: [{ name: 'SK Poříčany' }] });
    expect(d.opponents[0].id).toBe('poricany');
    expect(d.opponents[0].logo).toBe('');
  });

  it('poškozený vstup nespadne', () => {
    expect(normalizeOpponents({}).opponents).toEqual([]);
    expect(normalizeOpponents({ opponents: 'nesmysl' }).opponents).toEqual([]);
  });

  it('výchozí obsah žádné znaky nemá', () => {
    expect(DEFAULTS.opponents).toEqual([]);
  });

  it('nahraný znak přetrvá uložení', () => {
    const saved = clone(DEFAULTS);
    saved.opponents = [{ ...emptyOpponent(), name: 'SK Poříčany', logo: LOGO }];
    const m = mergeStored(saved);
    expect(m.opponents[0].logo).toBe(LOGO);
    expect(findOpponentLogo(m.opponents, 'Poříčany')).toBe(LOGO);
  });
});

describe('cleanClubName', () => {
  it('odstraní označení týmu, název klubu nechá', () => {
    expect(cleanClubName('FK Brandýs U19')).toBe('FK Brandýs');
    expect(cleanClubName('SK Mukařov příp. B')).toBe('SK Mukařov');
    expect(cleanClubName('TJ Velké Popovice')).toBe('TJ Velké Popovice');
  });

  it('nesmaže název, který sám vypadá jako označení', () => {
    expect(cleanClubName('Dorost')).toBe('Dorost');
    expect(cleanClubName('')).toBe('');
  });
});

describe('collectOpponentNames', () => {
  it('posbírá soupeře z tabulek, výsledků i příštích zápasů', () => {
    const names = collectOpponentNames(DEFAULTS);
    expect(names.length).toBeGreaterThan(3);
    expect(names.some((n) => n.toLowerCase().includes('mukařov'))).toBe(true);
  });

  it('nikdy nenabídne nás samotné — ani béčko nebo mládež', () => {
    expect(collectOpponentNames(DEFAULTS).some((n) => opponentKey(n) === 'kunice')).toBe(false);
    expect(collectOpponentNames(DEFAULTS).some((n) => n.toLowerCase().includes('kunice'))).toBe(false);
  });

  it('nenabídne zástupný text ani názvy psané verzálkami z příštího zápasu', () => {
    const names = collectOpponentNames(DEFAULTS);
    expect(names).not.toContain('SOUPEŘ');
    expect(names.every((n) => /[a-zá-ž]/.test(n))).toBe(true);
  });

  it('každý klub je v seznamu jen jednou, bez věkových kategorií', () => {
    const names = collectOpponentNames(DEFAULTS);
    expect(names.some((n) => /U1\d|příp\.| B$/.test(n))).toBe(false);
  });

  it('stejný klub vrátí jen jednou', () => {
    const names = collectOpponentNames(DEFAULTS);
    const keys = names.map(opponentKey);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('vezme i soupeře ze stažených návrhů, ale bez duplicit', () => {
    const content = clone(DEFAULTS);
    content.matchProposals = [{
      id: 'n1', teamId: 'muziA', status: 'nová', warnings: [],
      data: { nextMatch: null, lastMatch: { opp: 'TJ Úplně Nový' }, table: [{ team: 'SK Mukařov' }] },
    }];
    const names = collectOpponentNames(content);
    expect(names).toContain('TJ Úplně Nový');
    expect(names.filter((n) => opponentKey(n) === 'mukarov').length).toBe(1);
  });

  it('prázdný obsah nespadne', () => {
    expect(collectOpponentNames({})).toEqual([]);
  });
});
