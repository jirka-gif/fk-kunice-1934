// Integrační testy route handleru /api/content (bez databáze → úložiště v paměti).
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Přihlašovací cookie si v testech nastavujeme ručně.
const cookieJar = { value: undefined };
vi.mock('next/headers', () => ({
  cookies: () => ({ get: (name) => (name === 'fk_session' && cookieJar.value ? { value: cookieJar.value } : undefined) }),
}));

process.env.ADMIN_PASSWORD = 'tajne-heslo';
process.env.AUTH_SECRET = 'tajny-podpis';
delete process.env.DATABASE_URL;
delete process.env.POSTGRES_URL;

const { GET, PUT } = await import('@/app/api/content/route');
const { createSessionToken } = await import('@/lib/auth');
const { DEFAULTS } = await import('@/lib/defaults');
const { hasDatabase } = await import('@/lib/db');

// pomocník: PUT požadavek s JSON tělem
const putReq = (body) =>
  new Request('http://localhost/api/content', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });

beforeEach(() => {
  cookieJar.value = undefined;
  globalThis.__fkMemStore = { data: null };
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
    expect(json.sponsors).toEqual(['JEDINÝ PARTNER']);
    expect(json.teams.length).toBe(DEFAULTS.teams.length);
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
});

describe('PUT /api/content — přihlášený admin', () => {
  beforeEach(async () => {
    cookieJar.value = await createSessionToken();
  });

  it('uloží obsah a GET ho pak vrátí', async () => {
    const res = await PUT(putReq({ ...DEFAULTS, sponsors: ['NOVÝ PARTNER'] }));
    expect(res.status).toBe(200);
    expect((await res.json()).ok).toBe(true);

    const json = await (await GET()).json();
    expect(json.sponsors).toEqual(['NOVÝ PARTNER']);
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
