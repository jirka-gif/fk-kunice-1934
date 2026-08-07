// Integrační testy route handleru /api/content (bez databáze → úložiště v paměti).
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Přihlašovací cookie si v testech nastavujeme ručně.
const cookieJar = { value: undefined };
vi.mock('next/headers', () => ({
  cookies: () => ({ get: (name) => (name === 'fk_session' && cookieJar.value ? { value: cookieJar.value } : undefined) }),
}));

process.env.ADMIN_PASSWORD = 'tajne-heslo';
process.env.ADMIN_EMAIL = 'spravce@fkkunice.cz';
process.env.AUTH_SECRET = 'tajny-podpis';
delete process.env.DATABASE_URL;
delete process.env.POSTGRES_URL;

const { GET, PUT } = await import('@/app/api/content/route');
const { createSessionToken } = await import('@/lib/auth');
const { DEFAULTS, clone } = await import('@/lib/defaults');
const { hasDatabase } = await import('@/lib/db');
const { ensureSeedUser, readAuth, writeAuth, hashPassword, randomToken } = await import('@/lib/users');

// pomocník: PUT požadavek s JSON tělem
const putReq = (body, smazane) =>
  new Request('http://localhost/api/content', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      // Co administrace smazala. Bez toho server nic z příchozích seznamů
      // neodstraní — raději nechá navíc, než by ztratil poptávku.
      ...(smazane ? { 'x-fk-inbox-removed': JSON.stringify(smazane) } : {}),
    },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });

// přihlásí testovací session pro uživatele s danou rolí
async function loginAs(roleId = 'spravce') {
  await ensureSeedUser();
  const auth = await readAuth();
  let user = auth.users.find((u) => u.role === roleId);
  if (!user) {
    const { hash, salt, iterations } = await hashPassword('heslo-1234');
    user = {
      id: randomToken(9), email: `${roleId}@fkkunice.cz`, name: roleId, role: roleId,
      active: true, mustChangePassword: false, createdAt: '', passwordHash: hash, salt, iterations,
    };
    auth.users.push(user);
    await writeAuth(auth);
  }
  cookieJar.value = await createSessionToken(user.id);
  return user;
}

beforeEach(() => {
  cookieJar.value = undefined;
  globalThis.__fkMemStore = { data: null };
  globalThis.__fkAuthStore = { data: null };
});

describe('prostředí bez databáze', () => {
  it('hasDatabase() je false a web musí fungovat na výchozím obsahu', () => {
    expect(hasDatabase()).toBe(false);
  });
});

describe('GET /api/content', () => {
  it('bez uloženého obsahu vrátí výchozí data', async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.teams.length).toBe(DEFAULTS.teams.length);
    expect(json.club.name).toBe(DEFAULTS.club.name);
  });

  it('nesmí se cachovat', async () => {
    const res = await GET();
    expect(res.headers.get('Cache-Control')).toContain('no-store');
  });

  it('vrátí uložený obsah sloučený s výchozím', async () => {
    globalThis.__fkMemStore.data = { sponsors: ['JEDINÝ PARTNER'] };
    const json = await (await GET()).json();
    expect(json.sponsors.map((s) => s.name)).toEqual(['JEDINÝ PARTNER']);
    expect(json.teams.length).toBe(DEFAULTS.teams.length);
  });

  it('nikdy nevrací uživatele ani hesla', async () => {
    await loginAs('spravce');
    const json = await (await GET()).json();
    expect(json.users).toBeUndefined();
    expect(JSON.stringify(json)).not.toContain('passwordHash');
  });
});

describe('PUT /api/content — ochrana přihlášením', () => {
  it('bez cookie vrátí 401 a nic neuloží', async () => {
    const res = await PUT(putReq({ sponsors: ['HACK'] }));
    expect(res.status).toBe(401);
    expect(globalThis.__fkMemStore.data).toBe(null);
  });

  it('s podvrženou cookie vrátí 401', async () => {
    cookieJar.value = 'podvrzeny.token';
    const res = await PUT(putReq({ sponsors: ['HACK'] }));
    expect(res.status).toBe(401);
    expect(globalThis.__fkMemStore.data).toBe(null);
  });

  it('platný podpis s neexistujícím uživatelem vrátí 401', async () => {
    cookieJar.value = await createSessionToken('takovy-uzivatel-neni');
    const res = await PUT(putReq({ sponsors: ['HACK'] }));
    expect(res.status).toBe(401);
  });

  it('deaktivovaný uživatel se dovnitř nedostane', async () => {
    const user = await loginAs('spravce');
    const auth = await readAuth();
    auth.users = auth.users.map((u) => (u.id === user.id ? { ...u, active: false } : u));
    await writeAuth(auth);
    const res = await PUT(putReq({ ...clone(DEFAULTS), sponsors: ['HACK'] }));
    expect(res.status).toBe(401);
  });
});

describe('PUT /api/content — přihlášený správce', () => {
  beforeEach(async () => {
    await loginAs('spravce');
  });

  it('uloží obsah a GET ho pak vrátí', async () => {
    const res = await PUT(putReq({ ...clone(DEFAULTS), sponsors: ['NOVÝ PARTNER'] }));
    expect(res.status).toBe(200);
    expect((await res.json()).ok).toBe(true);

    const json = await (await GET()).json();
    expect(json.sponsors.map((s) => s.name)).toEqual(['NOVÝ PARTNER']);
  });

  it('odmítne neplatný JSON', async () => {
    const res = await PUT(putReq('{tohle není json'));
    expect(res.status).toBe(400);
  });

  it('odmítne pole místo objektu obsahu', async () => {
    const res = await PUT(putReq([1, 2, 3]));
    expect(res.status).toBe(400);
  });
});

describe('PUT /api/content — omezení podle role', () => {
  it('redaktor smí upravit novinky', async () => {
    await loginAs('redaktor');
    const body = clone(DEFAULTS);
    body.news[0].title = 'Redaktor to změnil';
    const res = await PUT(putReq(body));
    expect(res.status).toBe(200);
    expect((await (await GET()).json()).news[0].title).toBe('Redaktor to změnil');
  });

  it('redaktor nesmí sáhnout na nastavení klubu (403) a nic se neuloží', async () => {
    await loginAs('redaktor');
    const body = clone(DEFAULTS);
    body.club.name = 'Cizí klub';
    const res = await PUT(putReq(body));
    expect(res.status).toBe(403);
    expect((await res.json()).denied).toEqual(['club']);
    expect(globalThis.__fkMemStore.data).toBe(null);
  });

  it('trenér smí upravit soupisku, ale ne novinky', async () => {
    await loginAs('trener');
    const ok = clone(DEFAULTS);
    ok.teams[0].players[0].name = 'Nový hráč';
    expect((await PUT(putReq(ok))).status).toBe(200);

    const bad = clone(DEFAULTS);
    bad.teams[0].players[0].name = 'Nový hráč';
    bad.news[0].title = 'Tohle trenér nesmí';
    const res = await PUT(putReq(bad));
    expect(res.status).toBe(403);
    expect((await res.json()).denied).toEqual(['news']);
  });

  it('role bez práv neuloží vůbec nic', async () => {
    await loginAs('bez-prav');
    const body = clone(DEFAULTS);
    body.sponsors = ['NIKDO'];
    expect((await PUT(putReq(body))).status).toBe(403);
  });

  it('uložení beze změny projde i bez práv (nic se nemění)', async () => {
    await loginAs('bez-prav');
    const res = await PUT(putReq(clone(DEFAULTS)));
    expect(res.status).toBe(200);
  });
});

// -----------------------------------------------------------------------------
//  SOUBĚŽNÁ POŠTA
//  Administrace posílá obsah tak, jak si ho načetla při otevření stránky. Poptávka,
//  která dorazí mezitím, v něm chybí — a bez slučování by ji uložení smazalo.
// -----------------------------------------------------------------------------
describe('příchozí pošta se nepřepíše starším pohledem administrace', () => {
  const seSeznamem = (klic, polozky) => {
    const c = clone(DEFAULTS);
    c[klic] = polozky;
    return c;
  };
  const rezervace = (id, createdAt) => ({
    id, createdAt, name: `Zájemce ${id}`, email: `${id}@example.cz`,
    area: 'Hlavní stadion', dateISO: '2026-09-01', from: '18:00', to: '19:00',
    date: '1. září 2026', status: 'nová', source: 'web', messages: [],
  });

  it('poptávka doručená po načtení administrace zůstane', async () => {
    await loginAs('spravce');
    const stara = rezervace('rez-stara', '2026-08-01T09:00:00.000Z');
    const nova = rezervace('rez-nova', '2026-08-01T12:00:00.000Z');
    globalThis.__fkMemStore.data = seSeznamem('reservations', [nova, stara]);

    // administrace odesílá pohled, ve kterém nová poptávka ještě nebyla,
    // a nic nemaže — hlavička se smazanými je tedy prázdná
    const zAdmina = seSeznamem('reservations', [stara]);
    zAdmina.club = { ...zAdmina.club, motto: 'Nové motto' };
    expect((await PUT(putReq(zAdmina, {}))).status).toBe(200);

    const ulozeno = await (await GET()).json();
    expect(ulozeno.reservations.map((r) => r.id)).toEqual(['rez-nova', 'rez-stara']);
    expect(ulozeno.club.motto).toBe('Nové motto'); // úprava admina se uložila
  });

  it('smazání rezervace projde, když ho administrace ohlásí', async () => {
    await loginAs('spravce');
    const stara = rezervace('rez-stara', '2026-08-01T09:00:00.000Z');
    const novejsi = rezervace('rez-novejsi', '2026-08-01T12:00:00.000Z');
    globalThis.__fkMemStore.data = seSeznamem('reservations', [novejsi, stara]);

    const smazane = { reservations: ['id:rez-stara'] };
    expect((await PUT(putReq(seSeznamem('reservations', [novejsi]), smazane))).status).toBe(200);

    const ulozeno = await (await GET()).json();
    expect(ulozeno.reservations.map((r) => r.id)).toEqual(['rez-novejsi']);
  });

  it('smazat jde i tu úplně nejnovější položku', async () => {
    await loginAs('spravce');
    const stara = rezervace('rez-stara', '2026-08-01T09:00:00.000Z');
    const nejnovejsi = rezervace('rez-nejnovejsi', '2026-08-01T12:00:00.000Z');
    globalThis.__fkMemStore.data = seSeznamem('reservations', [nejnovejsi, stara]);

    const smazane = { reservations: ['id:rez-nejnovejsi'] };
    expect((await PUT(putReq(seSeznamem('reservations', [stara]), smazane))).status).toBe(200);

    const ulozeno = await (await GET()).json();
    expect(ulozeno.reservations.map((r) => r.id)).toEqual(['rez-stara']);
  });

  it('bez ohlášeného smazání se z příchozích seznamů nic neztratí', async () => {
    await loginAs('spravce');
    const rez = rezervace('rez-1', '2026-08-01T09:00:00.000Z');
    globalThis.__fkMemStore.data = seSeznamem('reservations', [rez]);

    // starý klient / cizí volání bez hlavičky → mazání se neprovede
    expect((await PUT(putReq(seSeznamem('reservations', [])))).status).toBe(200);

    const ulozeno = await (await GET()).json();
    expect(ulozeno.reservations.map((r) => r.id)).toEqual(['rez-1']);
  });

  it('platí i pro zprávy z kontaktu, které nemají id', async () => {
    await loginAs('spravce');
    const stara = { name: 'Jan', email: 'jan@example.cz', text: 'starý dotaz', date: '2026-08-01T09:00:00.000Z', status: 'nová' };
    const nova = { name: 'Eva', email: 'eva@example.cz', text: 'nový dotaz', date: '2026-08-01T12:00:00.000Z', status: 'nová' };
    globalThis.__fkMemStore.data = seSeznamem('messages', [nova, stara]);

    expect((await PUT(putReq(seSeznamem('messages', [stara]), {}))).status).toBe(200);
    const ulozeno = await (await GET()).json();
    expect(ulozeno.messages.map((m) => m.email)).toEqual(['eva@example.cz', 'jan@example.cz']);
  });

  it('český zápis data u rezervace nic neplete', async () => {
    await loginAs('spravce');
    // seed rezervace mají `date` jako český text a prázdné `createdAt`
    const seed = { ...rezervace('rez-seed', ''), date: '25. 6. 2026' };
    const nova = rezervace('rez-nova', '2026-08-07T10:00:00.000Z');
    globalThis.__fkMemStore.data = seSeznamem('reservations', [nova, seed]);

    expect((await PUT(putReq(seSeznamem('reservations', [seed]), {}))).status).toBe(200);

    const ulozeno = await (await GET()).json();
    expect(ulozeno.reservations.map((r) => r.id)).toContain('rez-nova');
  });

  it('starý záznam bez data vzniku jde smazat', async () => {
    await loginAs('spravce');
    const bezData = { ...rezervace('rez-stara-bez-data', ''), date: '25. 6. 2026' };
    globalThis.__fkMemStore.data = seSeznamem('reservations', [bezData]);

    const smazane = { reservations: ['id:rez-stara-bez-data'] };
    expect((await PUT(putReq(seSeznamem('reservations', []), smazane))).status).toBe(200);

    const ulozeno = await (await GET()).json();
    expect(ulozeno.reservations).toEqual([]);
  });

  it('přihláška doručená mezitím nezpůsobí 403 roli, která přihlášky needituje', async () => {
    // redaktor má registrace 'none' — mezitím doručená přihláška vypadala jako
    // jeho smazání a shodila mu uložení novinky, na kterou právo má
    await loginAs('redaktor');
    const nova = { id: 'prih-nova', createdAt: '2026-08-01T12:00:00.000Z', name: 'Malý Novák', status: 'nová', source: 'web', messages: [] };
    const zaklad = seSeznamem('cmsRegistrations', [nova]);
    globalThis.__fkMemStore.data = zaklad;

    const zAdmina = seSeznamem('cmsRegistrations', []);
    zAdmina.news = clone(zaklad.news);
    zAdmina.news[0] = { ...zAdmina.news[0], title: 'Redaktor tohle smí' };

    const res = await PUT(putReq(zAdmina, {}));
    expect(res.status).toBe(200);
    const ulozeno = await (await GET()).json();
    expect(ulozeno.cmsRegistrations.map((r) => r.id)).toEqual(['prih-nova']);
    expect(ulozeno.news[0].title).toBe('Redaktor tohle smí');
  });
});
