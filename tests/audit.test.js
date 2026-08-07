// Záznam změn a přihlášení — vlastní úložiště, ořez, odolnost proti chybě.
import { describe, it, expect, beforeEach } from 'vitest';

delete process.env.DATABASE_URL;
delete process.env.POSTGRES_URL;

const { zapisZaznam, ctiZaznamy, normalizeZaznamy, MAX_ZAZNAMU, AKCE } = await import('@/lib/audit');
const { getStoredContent } = await import('@/lib/db');

const uzivatel = { id: 'u1', email: 'super@fkkunice.cz', name: 'Super správce' };

beforeEach(() => {
  globalThis.__fkAuditStore = { data: null };
  globalThis.__fkMemStore = { data: null };
});

describe('zápis a čtení', () => {
  it('uloží kdo, kdy, co a jaká akce', async () => {
    await zapisZaznam({ akce: AKCE.obsahZmena, user: uzivatel, detail: 'news, camps' });
    const [z] = await ctiZaznamy();
    expect(z.akce).toBe('obsah-zmena');
    expect(z.userEmail).toBe('super@fkkunice.cz');
    expect(z.detail).toBe('news, camps');
    expect(z.at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('nejnovější je první', async () => {
    await zapisZaznam({ akce: AKCE.prihlaseniOk, user: uzivatel, detail: 'prvni' });
    await zapisZaznam({ akce: AKCE.prihlaseniOk, user: uzivatel, detail: 'druhy' });
    const zaznamy = await ctiZaznamy();
    expect(zaznamy[0].detail).toBe('druhy');
  });

  it('nepřeteče — drží se posledních MAX_ZAZNAMU', async () => {
    const zaznamy = Array.from({ length: MAX_ZAZNAMU + 25 }, (_, i) => ({ id: `z-${i}`, at: '', akce: 'obsah-zmena', detail: String(i) }));
    globalThis.__fkAuditStore = { data: { zaznamy } };
    await zapisZaznam({ akce: AKCE.obsahZmena, user: uzivatel, detail: 'novy' });
    const out = await ctiZaznamy();
    expect(out.length).toBe(MAX_ZAZNAMU);
    expect(out[0].detail).toBe('novy');
  });
});

describe('oddělení od veřejného obsahu', () => {
  it('záznam se neuloží do obsahu webu, který je veřejný', async () => {
    await zapisZaznam({ akce: AKCE.prihlaseniOk, user: uzivatel, detail: 'test' });
    const obsah = await getStoredContent();
    expect(JSON.stringify(obsah || {})).not.toContain('prihlaseni-ok');
    expect(JSON.stringify(obsah || {})).not.toContain('super@fkkunice.cz');
  });
});

describe('odolnost', () => {
  it('neúplný starý záznam se doplní, ne zahodí', () => {
    const out = normalizeZaznamy({ zaznamy: [{ akce: 'obsah-zmena' }, null] });
    expect(out).toHaveLength(2);
    expect(out[0].userEmail).toBe('');
    expect(out[0].id).toBeTruthy();
  });

  it('prázdné úložiště vrátí prázdný seznam, ne chybu', async () => {
    expect(await ctiZaznamy()).toEqual([]);
  });
});
