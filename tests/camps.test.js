// Testy kempů jako seznamu (víc kempů, archivace, migrace starého campDetail).
import { describe, it, expect } from 'vitest';
import { DEFAULTS, mergeStored, normalizeCamps, toCamp, emptyCamp, clone } from '@/lib/defaults';

describe('výchozí kempy', () => {
  it('jsou seznam a každý má vlastní id', () => {
    expect(Array.isArray(DEFAULTS.camps)).toBe(true);
    expect(DEFAULTS.camps.length).toBeGreaterThanOrEqual(2);
    const ids = DEFAULTS.camps.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.every(Boolean)).toBe(true);
  });

  it('mají údaje pro kartu na homepage i pro detail', () => {
    const c = DEFAULTS.camps[0];
    expect(c.tag).toBeTruthy();
    expect(c.title).toBeTruthy();
    expect(c.desc).toBeTruthy();
    expect(c.price).toBeTruthy();
    expect(c.badge).toBeTruthy();
    expect(c.lead).toBeTruthy();
    expect(c.perks.length).toBeGreaterThan(0);
    expect(c.program.length).toBeGreaterThan(0);
    expect(c.faq.length).toBeGreaterThan(0);
    expect(c.capacity.total).toBeGreaterThan(0);
  });

  it('žádný kemp není ve výchozím stavu archivovaný', () => {
    expect(DEFAULTS.camps.every((c) => c.archived === false)).toBe(true);
  });

  it('samostatná sekce campDetail už v obsahu není', () => {
    expect(DEFAULTS.campDetail).toBeUndefined();
  });
});

describe('toCamp / emptyCamp', () => {
  it('doplní chybějící pole a dopočítá id', () => {
    const c = toCamp({ title: 'Podzimní kemp' }, 2);
    expect(c.id).toBe('kemp-3');
    expect(c.archived).toBe(false);
    expect(c.capacity).toEqual({ taken: 0, total: 0 });
    expect(c.perks).toEqual([]);
    expect(c.faq).toEqual([]);
  });

  it('zachová vyplněné id i archivaci', () => {
    const c = toCamp({ id: 'muj-kemp', archived: true, title: 'X' }, 0);
    expect(c.id).toBe('muj-kemp');
    expect(c.archived).toBe(true);
  });

  it('emptyCamp má všechna pole, která web čte', () => {
    const c = emptyCamp();
    for (const key of ['tag', 'title', 'desc', 'badge', 'lead', 'price', 'term', 'startISO', 'capacity', 'perks', 'program', 'includes', 'coaches', 'faq']) {
      expect(c, `chybí ${key}`).toHaveProperty(key);
    }
  });
});

describe('normalizeCamps — migrace starého obsahu', () => {
  it('starý campDetail se přenese do prvního kempu', () => {
    const legacy = {
      camps: [{ tag: 'ČERVENEC', title: 'Letní kemp', desc: 'Popis', price: '4 290 Kč', term: 'týden', img: 'sunset' }],
      campDetail: {
        badge: 'LETNÍ KEMP 2026', title: 'Léto plné fotbalu', lead: 'Pět dní fotbalu',
        startISO: '2026-07-07T08:00:00', capacity: { taken: 32, total: 40 },
        perks: [{ emoji: '🏆', title: 'Profi trenéři', text: '' }],
        program: [{ time: '08:00', title: 'Rozcvička' }],
        includes: ['Strava'], coaches: [], faq: [{ q: 'Pro koho?', a: 'Pro děti.' }],
      },
    };
    const data = normalizeCamps({ ...clone(legacy) }, legacy);
    const c = data.camps[0];
    expect(c.badge).toBe('LETNÍ KEMP 2026');
    expect(c.lead).toBe('Pět dní fotbalu');
    expect(c.startISO).toBe('2026-07-07T08:00:00');
    expect(c.capacity).toEqual({ taken: 32, total: 40 });
    expect(c.perks.length).toBe(1);
    expect(c.faq.length).toBe(1);
    // titulek z karty má přednost před titulkem detailu
    expect(c.title).toBe('Letní kemp');
    expect(data.campDetail).toBeUndefined();
  });

  it('druhý kemp ze starého obsahu dostane kostru detailu, ne cizí texty', () => {
    const legacy = {
      camps: [{ title: 'První' }, { title: 'Druhý' }],
      campDetail: { badge: 'PRVNÍ KEMP', lead: 'Text prvního', program: [{ time: '08:00', title: 'Rozcvička' }], perks: [], includes: [], coaches: [], faq: [] },
    };
    const data = normalizeCamps({ ...clone(legacy) }, legacy);
    expect(data.camps[1].badge).toBe('');
    expect(data.camps[1].lead).toBe('');
    expect(data.camps[1].program.length).toBe(1);
  });

  it('nový formát nechá beze změny a jen doplní chybějící pole', () => {
    const data = normalizeCamps({ camps: [{ id: 'a', title: 'A', perks: [] }] }, {});
    expect(data.camps[0].id).toBe('a');
    expect(data.camps[0].capacity).toEqual({ taken: 0, total: 0 });
  });

  it('chybějící nebo poškozený seznam kempů nespadne', () => {
    expect(normalizeCamps({}, null).camps).toEqual([]);
    expect(normalizeCamps({ camps: 'nesmysl' }, null).camps).toEqual([]);
  });
});

describe('mergeStored a kempy', () => {
  it('archivace kempu se uloží a přetrvá', () => {
    const saved = clone(DEFAULTS);
    saved.camps[1].archived = true;
    const m = mergeStored(saved);
    expect(m.camps[1].archived).toBe(true);
    expect(m.camps.filter((c) => !c.archived).length).toBe(DEFAULTS.camps.length - 1);
  });

  it('přidaný kemp zůstane v obsahu', () => {
    const saved = clone(DEFAULTS);
    saved.camps.push({ ...emptyCamp(), id: 'novy', title: 'Podzimní kemp' });
    const m = mergeStored(saved);
    expect(m.camps.map((c) => c.title)).toContain('Podzimní kemp');
  });

  it('smazání všech kempů obsah nerozbije', () => {
    const m = mergeStored({ ...clone(DEFAULTS), camps: [] });
    expect(m.camps).toEqual([]);
    expect(m.teams.length).toBe(DEFAULTS.teams.length);
  });
});
