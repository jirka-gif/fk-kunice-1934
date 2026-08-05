// Testy pozadí dlaždic — nahraná fotka i pojmenovaný barevný přechod.
import { describe, it, expect } from 'vitest';
import { photo, PH } from '@/lib/design';

describe('photo()', () => {
  it('pojmenovaný přechod vrátí jako gradient', () => {
    expect(photo('char')).toBe(PH.char);
    expect(photo('sunset')).toBe(PH.sunset);
  });

  it('nahranou fotku zabalí do url(), ať ji CSS vezme', () => {
    const dataUrl = 'data:image/jpeg;base64,AAAA';
    expect(photo(dataUrl)).toBe(`url(${dataUrl})`);
  });

  it('odkaz na obrázek taky zabalí', () => {
    expect(photo('https://example.cz/foto.jpg')).toBe('url(https://example.cz/foto.jpg)');
    expect(photo('/hero-1934.jpg')).toBe('url(/hero-1934.jpg)');
  });

  it('prázdná hodnota dá výchozí přechod, takže dlaždice nikdy nezeje', () => {
    expect(photo('')).toBe(PH.slate);
    expect(photo(null)).toBe(PH.slate);
    expect(photo(undefined)).toBe(PH.slate);
  });

  it('vlastní CSS projde beze změny (zpětná kompatibilita)', () => {
    expect(photo('linear-gradient(90deg,#000,#fff)')).toBe('linear-gradient(90deg,#000,#fff)');
  });
});
