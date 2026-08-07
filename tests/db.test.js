// Testy perzistence bez databáze — web musí fungovat i bez DATABASE_URL.
import { describe, it, expect, beforeEach } from 'vitest';

delete process.env.DATABASE_URL;
delete process.env.POSTGRES_URL;

const { getStoredContent, saveStoredContent, hasDatabase } = await import('@/lib/db');

beforeEach(() => {
  globalThis.__fkMemStore = { data: null };
});

describe('lib/db bez DATABASE_URL', () => {
  it('hlásí, že databáze není k dispozici', () => {
    expect(hasDatabase()).toBe(false);
  });

  it('bez uloženého obsahu vrátí null (volající spadne na DEFAULTS)', async () => {
    expect(await getStoredContent()).toBe(null);
  });

  it('uloží do paměti a přečte zpět', async () => {
    const res = await saveStoredContent({ sponsors: ['PARTNER'] });
    expect(res).toEqual({ ok: true, store: 'memory' });
    expect(await getStoredContent()).toEqual({ sponsors: ['PARTNER'] });
  });

  it('další uložení přepíše předchozí', async () => {
    await saveStoredContent({ sponsors: ['A'] });
    await saveStoredContent({ sponsors: ['B'] });
    expect((await getStoredContent()).sponsors).toEqual(['B']);
  });
});

// Souborový režim (`FK_LOCAL_STORE=1`) musí znát všechna tři úložiště.
// Chybějící název souboru se v testech neprojeví — zapisovalo by se do
// `.data/undefined` a záznam by tiše mizel. Přesně to se jednou stalo.
describe('názvy souborů lokálního úložiště', () => {
  it('obsah, uživatelé i záznam mají svůj soubor', async () => {
    const zdroj = await import('node:fs/promises').then((fs) => fs.readFile('lib/db.js', 'utf8'));
    const radek = zdroj.split('\n').find((l) => l.includes('const LOCAL_FILES'));
    expect(radek).toContain("content:");
    expect(radek).toContain("auth:");
    expect(radek).toContain("audit:");
    expect(radek).not.toContain('undefined');
  });
});
