// Testy novinek: adresy detailu (id), delší text článku, normalizace.
import { describe, it, expect } from 'vitest';
import { DEFAULTS, mergeStored, normalizeNews, emptyNews, slugify, clone } from '@/lib/defaults';

describe('slugify', () => {
  it('převede český titulek na adresu bez diakritiky', () => {
    expect(slugify('Áčko slaví postup do okresního přeboru')).toBe('acko-slavi-postup-do-okresniho-preboru');
  });

  it('ořízne interpunkci a pomlčky na krajích', () => {
    expect(slugify('  Nábor 2026/27!  ')).toBe('nabor-2026-27');
  });

  it('prázdný vstup vrátí prázdný řetězec', () => {
    expect(slugify('')).toBe('');
    expect(slugify(null)).toBe('');
  });
});

describe('výchozí novinky', () => {
  it('každá novinka má jedinečné id, perex i text článku', () => {
    const ids = DEFAULTS.news.map((n) => n.id);
    expect(ids.every(Boolean)).toBe(true);
    expect(new Set(ids).size).toBe(ids.length);
    for (const n of DEFAULTS.news) {
      expect(n.title).toBeTruthy();
      expect(n.text).toBeTruthy();
      expect(n.body).toBeTruthy();
    }
  });

  it('id odpovídá titulku', () => {
    const first = DEFAULTS.news[0];
    expect(first.id).toBe(slugify(first.title));
  });
});

describe('normalizeNews', () => {
  it('dopočítá chybějící id z titulku', () => {
    const data = normalizeNews({ news: [{ title: 'Nové hřiště' }] });
    expect(data.news[0].id).toBe('nove-hriste');
    expect(data.news[0].body).toBe('');
  });

  it('nepřepíše vlastní id', () => {
    const data = normalizeNews({ news: [{ id: 'moje-adresa', title: 'Cokoliv' }] });
    expect(data.news[0].id).toBe('moje-adresa');
  });

  it('dvě novinky se stejným titulkem dostanou různá id', () => {
    const data = normalizeNews({ news: [{ title: 'Turnaj' }, { title: 'Turnaj' }, { title: 'Turnaj' }] });
    expect(data.news.map((n) => n.id)).toEqual(['turnaj', 'turnaj-2', 'turnaj-3']);
  });

  it('novinka bez titulku dostane náhradní id', () => {
    const data = normalizeNews({ news: [{ text: 'bez titulku' }] });
    expect(data.news[0].id).toBe('novinka-1');
  });

  it('chybějící nebo poškozený seznam nespadne', () => {
    expect(normalizeNews({}).news).toEqual([]);
    expect(normalizeNews({ news: 'nesmysl' }).news).toEqual([]);
  });
});

describe('mergeStored a novinky', () => {
  it('přidaná novinka dostane id a zůstane v obsahu', () => {
    const saved = clone(DEFAULTS);
    saved.news.unshift({ ...emptyNews(), title: 'Zimní soustředění', text: 'Perex', body: 'Text' });
    const m = mergeStored(saved);
    expect(m.news[0].id).toBe('zimni-soustredeni');
    expect(m.news.length).toBe(DEFAULTS.news.length + 1);
  });

  it('starý obsah bez id se doplní, aniž by se změnilo pořadí', () => {
    const m = mergeStored({ news: [{ title: 'První' }, { title: 'Druhá' }] });
    expect(m.news.map((n) => n.title)).toEqual(['První', 'Druhá']);
    expect(m.news.map((n) => n.id)).toEqual(['prvni', 'druha']);
  });

  it('úprava textu článku přetrvá', () => {
    const saved = clone(DEFAULTS);
    saved.news[0].body = 'Nový text článku';
    expect(mergeStored(saved).news[0].body).toBe('Nový text článku');
  });
});
