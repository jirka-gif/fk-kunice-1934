// Zapisuje se opravdu to, co se stalo — a nikdy heslo.
import { describe, it, expect, beforeEach, vi } from 'vitest';

const cookieJar = { value: undefined };
vi.mock('next/headers', () => ({
  cookies: () => ({ get: (name) => (name === 'fk_session' && cookieJar.value ? { value: cookieJar.value } : undefined) }),
}));

process.env.ADMIN_PASSWORD = 'tajne-heslo';
process.env.ADMIN_EMAIL = 'super@fkkunice.cz';
process.env.AUTH_SECRET = 'tajny-podpis';
delete process.env.DATABASE_URL;
delete process.env.POSTGRES_URL;

const contentApi = await import('@/app/api/content/route');
const loginApi = await import('@/app/api/login/route');
const usersApi = await import('@/app/api/users/route');
const { createSessionToken } = await import('@/lib/auth');
const { ctiZaznamy } = await import('@/lib/audit');
const { ensureSeedUser, readAuth } = await import('@/lib/users');
const { DEFAULTS, clone } = await import('@/lib/defaults');

const json = (url, method, body) =>
  new Request(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

let superUser;
beforeEach(async () => {
  cookieJar.value = undefined;
  globalThis.__fkMemStore = { data: null };
  globalThis.__fkAuthStore = { data: null };
  globalThis.__fkAuditStore = { data: null };
  const auth = await ensureSeedUser();
  superUser = auth.users[0];
});

describe('změna obsahu', () => {
  it('zapíše kdo a které části webu změnil', async () => {
    cookieJar.value = await createSessionToken(superUser.id);
    const obsah = clone(DEFAULTS);
    obsah.news = [...obsah.news, { id: 'nova', title: 'Nová', category: 'Klub', text: '', body: '', date: '', image: '', draft: true }];

    const res = await contentApi.PUT(json('http://localhost/api/content', 'PUT', obsah));
    expect(res.status).toBe(200);

    const [z] = await ctiZaznamy();
    expect(z.akce).toBe('obsah-zmena');
    expect(z.userEmail).toBe('super@fkkunice.cz');
    expect(z.detail).toContain('news');
  });

  it('uložení bez skutečné změny žádný záznam nevytvoří', async () => {
    cookieJar.value = await createSessionToken(superUser.id);
    await contentApi.PUT(json('http://localhost/api/content', 'PUT', clone(DEFAULTS)));
    expect(await ctiZaznamy()).toHaveLength(0);
  });
});

describe('přihlášení', () => {
  it('úspěšné se zapíše a poznamená se čas u uživatele', async () => {
    const res = await loginApi.POST(json('http://localhost/api/login', 'POST', { email: 'super@fkkunice.cz', password: 'tajne-heslo' }));
    expect(res.status).toBe(200);

    const [z] = await ctiZaznamy();
    expect(z.akce).toBe('prihlaseni-ok');
    expect(z.userEmail).toBe('super@fkkunice.cz');

    const auth = await readAuth();
    expect(auth.users[0].lastLoginAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('neúspěšné se zapíše, ale bez hesla', async () => {
    const res = await loginApi.POST(json('http://localhost/api/login', 'POST', { email: 'super@fkkunice.cz', password: 'uplne-spatne-heslo' }));
    expect(res.status).toBe(401);

    const zaznamy = await ctiZaznamy();
    expect(zaznamy[0].akce).toBe('prihlaseni-chyba');
    expect(JSON.stringify(zaznamy)).not.toContain('uplne-spatne-heslo');
  });
});

describe('změny uživatelů', () => {
  it('pozvání se zapíše bez hesla, které se vygenerovalo', async () => {
    cookieJar.value = await createSessionToken(superUser.id);
    const res = await usersApi.POST(json('http://localhost/api/users', 'POST', { email: 'novy@fkkunice.cz', role: 'redaktor' }));
    const data = await res.json();
    expect(res.status).toBe(200);

    const zaznamy = await ctiZaznamy();
    expect(zaznamy[0].akce).toBe('uzivatel-zmena');
    expect(zaznamy[0].detail).toContain('novy@fkkunice.cz');
    // heslo, které API vrátilo správci, se nesmí objevit v záznamu
    expect(JSON.stringify(zaznamy)).not.toContain(data.password);
  });

  it('reset hesla se zapíše jako akce, ne jako hodnota', async () => {
    cookieJar.value = await createSessionToken(superUser.id);
    const vytvoren = await (await usersApi.POST(json('http://localhost/api/users', 'POST', { email: 'r@fkkunice.cz', role: 'redaktor' }))).json();
    const res = await usersApi.PUT(json('http://localhost/api/users', 'PUT', { id: vytvoren.user.id, resetPassword: true, password: 'nove-heslo-1234' }));
    expect(res.status).toBe(200);

    const zaznamy = await ctiZaznamy();
    expect(zaznamy[0].detail).toContain('reset hesla');
    expect(JSON.stringify(zaznamy)).not.toContain('nove-heslo-1234');
    expect(JSON.stringify(zaznamy)).not.toContain('passwordHash');
  });
});
