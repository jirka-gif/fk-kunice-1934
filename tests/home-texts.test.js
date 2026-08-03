// Testy editovatelných textů hlavní stránky a patičky.
import { describe, it, expect } from 'vitest';
import { DEFAULTS, mergeStored, fillDefaults, clone } from '@/lib/defaults';

describe('výchozí texty hlavní stránky', () => {
  it('homeTexts obsahuje hero i všechny nadpisy sekcí', () => {
    const t = DEFAULTS.homeTexts;
    expect(t.hero.title).toBeTruthy();
    expect(t.hero.script).toBeTruthy();
    expect(t.hero.perex).toContain('\n');
    expect(t.hero.ctas.length).toBe(3);
    for (const key of ['match', 'teams', 'why', 'camps', 'rental', 'news', 'gallery']) {
      expect(t[key].eyebrow, `chybí nadnadpis sekce ${key}`).toBeTruthy();
      expect(t[key].title, `chybí nadpis sekce ${key}`).toBeTruthy();
    }
    expect(t.sponsors.title).toBeTruthy();
  });

  it('footer obsahuje oba sloupce odkazů, kontakt a spodní řádek', () => {
    const f = DEFAULTS.footer;
    expect(f.columnA.links.length).toBeGreaterThan(0);
    expect(f.columnB.links.length).toBeGreaterThan(0);
    expect(f.columnA.links[0]).toHaveProperty('label');
    expect(f.columnA.links[0]).toHaveProperty('href');
    expect(f.copyright).toBeTruthy();
    expect(f.claim).toBeTruthy();
    expect(f.social).toEqual({ instagram: '', facebook: '', twitter: '' });
  });
});

describe('fillDefaults', () => {
  it('doplní chybějící klíče, ale nepřepíše vyplněné', () => {
    const out = fillDefaults({ a: 'moje', b: { c: 'moje c' } }, { a: 'def', b: { c: 'def c', d: 'def d' }, e: 'def e' });
    expect(out).toEqual({ a: 'moje', b: { c: 'moje c', d: 'def d' }, e: 'def e' });
  });

  it('pole nechává beze změny (nesluje je po prvcích)', () => {
    const out = fillDefaults({ links: [{ label: 'A' }] }, { links: [{ label: 'X' }, { label: 'Y' }] });
    expect(out.links).toEqual([{ label: 'A' }]);
  });

  it('chybějící objekt nahradí kopií výchozího', () => {
    const defs = { x: { y: 1 } };
    const out = fillDefaults(undefined, defs);
    out.x.y = 2;
    expect(defs.x.y).toBe(1);
  });
});

describe('mergeStored a texty', () => {
  it('uložená úprava textu přetrvá', () => {
    const saved = clone(DEFAULTS);
    saved.homeTexts.hero.title = 'Nový nadpis';
    saved.footer.claim = 'NOVÝ CLAIM';
    const m = mergeStored(saved);
    expect(m.homeTexts.hero.title).toBe('Nový nadpis');
    expect(m.footer.claim).toBe('NOVÝ CLAIM');
  });

  it('starý obsah bez homeTexts a footer dostane výchozí texty', () => {
    const m = mergeStored({ sponsors: ['A'] });
    expect(m.homeTexts.hero.title).toBe(DEFAULTS.homeTexts.hero.title);
    expect(m.footer.columnA.links.length).toBe(DEFAULTS.footer.columnA.links.length);
  });

  it('částečně uložené texty se doplní o nově přidané klíče', () => {
    const m = mergeStored({ homeTexts: { hero: { title: 'Jen nadpis' } } });
    expect(m.homeTexts.hero.title).toBe('Jen nadpis');
    expect(m.homeTexts.hero.script).toBe(DEFAULTS.homeTexts.hero.script);
    expect(m.homeTexts.news.title).toBe(DEFAULTS.homeTexts.news.title);
  });

  it('doplní i chybějící údaje klubu (patička je čte)', () => {
    const m = mergeStored({ club: { name: 'FK Kunice' } });
    expect(m.club.address.street).toBe(DEFAULTS.club.address.street);
    expect(m.club.email).toBe(DEFAULTS.club.email);
  });

  it('whyCards jsou editovatelné jako běžná sekce', () => {
    const m = mergeStored({ whyCards: [{ title: 'Jediná karta', text: '', icon: 'star' }] });
    expect(m.whyCards.length).toBe(1);
    expect(m.whyCards[0].title).toBe('Jediná karta');
  });
});
