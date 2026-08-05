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
