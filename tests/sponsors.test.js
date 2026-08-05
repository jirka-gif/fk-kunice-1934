// Testy partnerů: logo místo textu a převod starého zápisu.
import { describe, it, expect } from 'vitest';
import { DEFAULTS, mergeStored, clone, normalizeSponsors, emptySponsor } from '@/lib/defaults';

const LOGO = 'data:image/png;base64,AAAA';

describe('normalizeSponsors', () => {
  it('starý zápis (jen text) převede na objekt a nic neztratí', () => {
    const d = normalizeSponsors({ sponsors: ['STAVOSPOL', 'ENERGY'] });
    expect(d.sponsors.map((s) => s.name)).toEqual(['STAVOSPOL', 'ENERGY']);
    expect(d.sponsors[0].logo).toBe('');
    expect(d.sponsors[0].id).toBe('stavospol');
  });

  it('nový zápis s logem i odkazem nechá být', () => {
    const d = normalizeSponsors({ sponsors: [{ name: 'ŠKODA', logo: LOGO, url: 'https://skoda.cz' }] });
    expect(d.sponsors[0].logo).toBe(LOGO);
    expect(d.sponsors[0].url).toBe('https://skoda.cz');
  });

  it('vyhodí úplně prázdné řádky', () => {
    expect(normalizeSponsors({ sponsors: ['', {}, { name: 'OK' }] }).sponsors.length).toBe(1);
  });

  it('partner se samotným logem projde (nemusí mít název)', () => {
    expect(normalizeSponsors({ sponsors: [{ logo: LOGO }] }).sponsors.length).toBe(1);
  });

  it('poškozený vstup nespadne', () => {
    expect(normalizeSponsors({}).sponsors).toEqual([]);
    expect(normalizeSponsors({ sponsors: 'nesmysl' }).sponsors).toEqual([]);
  });
});

describe('partneři ve výchozím obsahu', () => {
  it('jsou objekty připravené na nahrání loga', () => {
    expect(DEFAULTS.sponsors.length).toBeGreaterThan(0);
    for (const sp of DEFAULTS.sponsors) {
      expect(sp).toHaveProperty('name');
      expect(sp).toHaveProperty('logo');
      expect(sp).toHaveProperty('url');
    }
  });

  it('nahrané logo přetrvá uložení', () => {
    const saved = clone(DEFAULTS);
    saved.sponsors[0].logo = LOGO;
    saved.sponsors[0].url = 'https://example.cz';
    const m = mergeStored(saved);
    expect(m.sponsors[0].logo).toBe(LOGO);
    expect(m.sponsors[0].url).toBe('https://example.cz');
  });

  it('emptySponsor má tvar, se kterým admin počítá', () => {
    expect(emptySponsor()).toEqual({ id: '', name: '', logo: '', url: '' });
  });
});
