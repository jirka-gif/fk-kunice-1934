// Testy registru znaků soupeřů — párování názvů a doplnění do vizuálu.
import { describe, it, expect } from 'vitest';
import { DEFAULTS, mergeStored, clone, opponentKey, normalizeOpponents, findOpponentLogo, emptyOpponent } from '@/lib/defaults';

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
