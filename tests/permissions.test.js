// Testy modelu oprávnění: úrovně po sekcích a kontrola ukládání obsahu.
import { describe, it, expect } from 'vitest';
import {
  ADMIN_SECTIONS, SECTION_IDS, LEVELS, SECTION_CONTENT_KEYS, CONTENT_KEY_SECTIONS,
  emptyPermissions, normalizePermissions, canView, canEdit,
  changedContentKeys, canSaveContent, defaultRoles, permissionsForRole,
} from '@/lib/permissions';
import { DEFAULTS, clone } from '@/lib/defaults';

describe('seznam sekcí', () => {
  it('má jedinečná id a popisky', () => {
    expect(new Set(SECTION_IDS).size).toBe(SECTION_IDS.length);
    expect(ADMIN_SECTIONS.every((s) => s.label)).toBe(true);
  });

  it('každý editovatelný klíč obsahu patří nějaké sekci', () => {
    const owned = new Set(Object.values(SECTION_CONTENT_KEYS).flat());
    // klíče, které admin needituje přímo (jen je odesílá web nebo se dopočítávají)
    const skip = new Set([]);
    for (const key of Object.keys(DEFAULTS)) {
      if (skip.has(key)) continue;
      expect(owned.has(key), `klíč ${key} nemá přiřazenou sekci`).toBe(true);
    }
  });

  it('klíč teams patří týmům i zápasům', () => {
    expect(CONTENT_KEY_SECTIONS.teams).toEqual(['tymy', 'zapasy']);
  });
});

describe('normalizePermissions', () => {
  it('doplní chybějící sekce na „nevidí"', () => {
    const p = normalizePermissions({ novinky: 'edit' });
    expect(p.novinky).toBe('edit');
    expect(p.nastaveni).toBe('none');
    expect(Object.keys(p).length).toBe(SECTION_IDS.length);
  });

  it('zahodí neplatné hodnoty', () => {
    expect(normalizePermissions({ novinky: 'superadmin' }).novinky).toBe('none');
    expect(normalizePermissions(null)).toEqual(emptyPermissions());
  });

  it('zná jen tři úrovně', () => {
    expect(LEVELS).toEqual(['none', 'view', 'edit']);
  });
});

describe('canView / canEdit', () => {
  const p = normalizePermissions({ novinky: 'edit', tymy: 'view', kempy: 'none' });
  it('edit umí i prohlížet', () => {
    expect(canView(p, 'novinky')).toBe(true);
    expect(canEdit(p, 'novinky')).toBe(true);
  });
  it('view neumí editovat', () => {
    expect(canView(p, 'tymy')).toBe(true);
    expect(canEdit(p, 'tymy')).toBe(false);
  });
  it('none nevidí nic', () => {
    expect(canView(p, 'kempy')).toBe(false);
    expect(canEdit(p, 'kempy')).toBe(false);
  });
  it('bez oprávnění nesmí nic', () => {
    expect(canView(null, 'novinky')).toBe(false);
    expect(canEdit(undefined, 'novinky')).toBe(false);
  });
});

describe('changedContentKeys', () => {
  it('najde jen skutečně změněné klíče', () => {
    const a = { news: [1], club: { name: 'A' } };
    const b = { news: [1], club: { name: 'B' } };
    expect(changedContentKeys(a, b)).toEqual(['club']);
  });
  it('pozná přidaný i odebraný klíč', () => {
    expect(changedContentKeys({ a: 1 }, { a: 1, b: 2 })).toEqual(['b']);
    expect(changedContentKeys({ a: 1, b: 2 }, { a: 1 })).toEqual(['b']);
  });
  it('stejný obsah nevrací nic', () => {
    expect(changedContentKeys(clone(DEFAULTS), clone(DEFAULTS))).toEqual([]);
  });
});

describe('canSaveContent', () => {
  const redaktor = permissionsForRole(defaultRoles(), 'redaktor');

  it('povolí změnu v sekci, na kterou má právo', () => {
    const before = clone(DEFAULTS);
    const after = clone(DEFAULTS);
    after.news[0].title = 'Jiný titulek';
    expect(canSaveContent(redaktor, before, after)).toEqual({ ok: true, denied: [] });
  });

  it('odmítne změnu mimo jeho sekce a vyjmenuje ji', () => {
    const before = clone(DEFAULTS);
    const after = clone(DEFAULTS);
    after.club.name = 'Cizí klub';
    const res = canSaveContent(redaktor, before, after);
    expect(res.ok).toBe(false);
    expect(res.denied).toEqual(['club']);
  });

  it('při více změnách vypíše všechny zakázané', () => {
    const before = clone(DEFAULTS);
    const after = clone(DEFAULTS);
    after.club.name = 'X';
    after.sponsors = ['Y'];
    after.news[0].title = 'Povolená změna';
    const res = canSaveContent(redaktor, before, after);
    expect(res.ok).toBe(false);
    expect(res.denied.sort()).toEqual(['club', 'sponsors']);
  });

  it('neznámý klíč smí uložit jen ten, kdo edituje Nastavení', () => {
    const before = clone(DEFAULTS);
    const after = { ...clone(DEFAULTS), uplneNovaSekce: [1] };
    expect(canSaveContent(redaktor, before, after).ok).toBe(false);
    const spravce = permissionsForRole(defaultRoles(), 'spravce');
    expect(canSaveContent(spravce, before, after).ok).toBe(true);
  });

  it('správce smí všechno', () => {
    const spravce = permissionsForRole(defaultRoles(), 'spravce');
    const after = clone(DEFAULTS);
    after.club.name = 'X';
    after.messages = [{ status: 'nová' }];
    expect(canSaveContent(spravce, clone(DEFAULTS), after).ok).toBe(true);
  });

  it('beze změny projde i bez jakýchkoli práv', () => {
    expect(canSaveContent(emptyPermissions(), clone(DEFAULTS), clone(DEFAULTS)).ok).toBe(true);
  });
});

describe('výchozí role', () => {
  it('správce má plný přístup ke všem sekcím', () => {
    const p = permissionsForRole(defaultRoles(), 'spravce');
    expect(SECTION_IDS.every((id) => p[id] === 'edit')).toBe(true);
  });

  it('žádná další role nesmí spravovat uživatele', () => {
    for (const r of defaultRoles().filter((r) => r.id !== 'spravce')) {
      expect(r.permissions.uzivatele, `role ${r.id}`).toBe('none');
    }
  });

  it('neznámá role nemá žádná práva', () => {
    const p = permissionsForRole(defaultRoles(), 'takova-neni');
    expect(SECTION_IDS.every((id) => p[id] === 'none')).toBe(true);
  });
});
