// Testy uživatelů: hashování hesel, přihlášení a API /api/users, /api/roles, /api/me.
import { describe, it, expect, beforeEach, vi } from 'vitest';

const cookieJar = { value: undefined };
vi.mock('next/headers', () => ({
  cookies: () => ({ get: (name) => (name === 'fk_session' && cookieJar.value ? { value: cookieJar.value } : undefined) }),
}));

process.env.ADMIN_PASSWORD = 'tajne-heslo';
process.env.ADMIN_EMAIL = 'spravce@fkkunice.cz';
process.env.AUTH_SECRET = 'tajny-podpis';
delete process.env.DATABASE_URL;
delete process.env.POSTGRES_URL;

const users = await import('@/lib/users');
const { createSessionToken } = await import('@/lib/auth');
const usersApi = await import('@/app/api/users/route');
const rolesApi = await import('@/app/api/roles/route');
const meApi = await import('@/app/api/me/route');
const loginApi = await import('@/app/api/login/route');

const json = (url, method, body) =>
  new Request(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

async function loginAs(roleId) {
  await users.ensureSeedUser();
  const auth = await users.readAuth();
  let user = auth.users.find((u) => u.role === roleId);
  if (!user) {
    const { hash, salt, iterations } = await users.hashPassword('heslo-1234');
    user = {
      id: users.randomToken(9), email: `${roleId}@fkkunice.cz`, name: roleId, role: roleId,
      active: true, mustChangePassword: false, createdAt: '', passwordHash: hash, salt, iterations,
    };
    auth.users.push(user);
    await users.writeAuth(auth);
  }
  cookieJar.value = await createSessionToken(user.id);
  return user;
}

beforeEach(() => {
  cookieJar.value = undefined;
  globalThis.__fkAuthStore = { data: null };
  globalThis.__fkMemStore = { data: null };
});

describe('hashování hesel', () => {
  it('heslo se nikdy neukládá v čitelné podobě', async () => {
    const auth = await users.ensureSeedUser();
    const u = auth.users[0];
    expect(u.passwordHash).toBeTruthy();
    expect(u.passwordHash).not.toBe('tajne-heslo');
    expect(u.salt).toBeTruthy();
    expect(u.iterations).toBeGreaterThanOrEqual(100000);
    expect(JSON.stringify(u)).not.toContain('tajne-heslo');
  });

  it('stejné heslo dá pokaždé jiný hash (jiná sůl)', async () => {
    const a = await users.hashPassword('stejne-heslo');
    const b = await users.hashPassword('stejne-heslo');
    expect(a.salt).not.toBe(b.salt);
    expect(a.hash).not.toBe(b.hash);
  });

  it('ověření projde jen se správným heslem', async () => {
    const { hash, salt, iterations } = await users.hashPassword('spravne-heslo');
    const u = { passwordHash: hash, salt, iterations };
    expect(await users.verifyPassword('spravne-heslo', u)).toBe(true);
    expect(await users.verifyPassword('spatne-heslo', u)).toBe(false);
    expect(await users.verifyPassword('', u)).toBe(false);
    expect(await users.verifyPassword('cokoliv', null)).toBe(false);
  });

  it('krátké heslo neprojde kontrolou síly', () => {
    expect(users.isStrongEnough('kratke')).toBe(false);
    expect(users.isStrongEnough('dost-dlouhe-heslo')).toBe(true);
  });
});

describe('první spuštění', () => {
  it('založí správce z proměnných prostředí', async () => {
    const auth = await users.ensureSeedUser();
    expect(auth.users.length).toBe(1);
    expect(auth.users[0].email).toBe('spravce@fkkunice.cz');
    // první uživatel nového webu je Super správce — jinak by záznam změn
    // neviděl vůbec nikdo
    expect(auth.users[0].role).toBe('superspravce');
  });

  it('podruhé už nic nezakládá', async () => {
    await users.ensureSeedUser();
    const auth = await users.ensureSeedUser();
    expect(auth.users.length).toBe(1);
  });
});

describe('POST /api/login', () => {
  it('správný e-mail a heslo přihlásí', async () => {
    const res = await loginApi.POST(json('http://localhost/api/login', 'POST', { email: 'spravce@fkkunice.cz', password: 'tajne-heslo' }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.user.email).toBe('spravce@fkkunice.cz');
    expect(data.user.passwordHash).toBeUndefined();
    expect(res.headers.get('set-cookie')).toContain('fk_session=');
  });

  it('špatné heslo vrátí 401', async () => {
    const res = await loginApi.POST(json('http://localhost/api/login', 'POST', { email: 'spravce@fkkunice.cz', password: 'spatne' }));
    expect(res.status).toBe(401);
  });

  it('neznámý e-mail vrátí 401', async () => {
    const res = await loginApi.POST(json('http://localhost/api/login', 'POST', { email: 'nikdo@example.com', password: 'tajne-heslo' }));
    expect(res.status).toBe(401);
  });

  it('deaktivovaný uživatel se nepřihlásí', async () => {
    await users.ensureSeedUser();
    const auth = await users.readAuth();
    auth.users = auth.users.map((u) => ({ ...u, active: false }));
    await users.writeAuth(auth);
    const res = await loginApi.POST(json('http://localhost/api/login', 'POST', { email: 'spravce@fkkunice.cz', password: 'tajne-heslo' }));
    expect(res.status).toBe(401);
  });
});

describe('GET /api/me', () => {
  it('bez přihlášení vrátí 401', async () => {
    expect((await meApi.GET()).status).toBe(401);
  });

  it('vrátí uživatele s jeho oprávněními a bez hesla', async () => {
    await loginAs('redaktor');
    const res = await meApi.GET();
    expect(res.status).toBe(200);
    const { user } = await res.json();
    expect(user.role).toBe('redaktor');
    expect(user.permissions.novinky).toBe('edit');
    expect(user.permissions.nastaveni).toBe('none');
    expect(user.passwordHash).toBeUndefined();
    expect(user.salt).toBeUndefined();
  });
});

describe('PUT /api/me — změna vlastního hesla', () => {
  it('projde jen se správným současným heslem', async () => {
    await users.ensureSeedUser();
    const auth = await users.readAuth();
    cookieJar.value = await createSessionToken(auth.users[0].id);

    const bad = await meApi.PUT(json('http://localhost/api/me', 'PUT', { currentPassword: 'spatne', newPassword: 'nove-heslo-123' }));
    expect(bad.status).toBe(400);

    const ok = await meApi.PUT(json('http://localhost/api/me', 'PUT', { currentPassword: 'tajne-heslo', newPassword: 'nove-heslo-123' }));
    expect(ok.status).toBe(200);
    expect(await users.authenticate('spravce@fkkunice.cz', 'nove-heslo-123')).toBeTruthy();
    expect(await users.authenticate('spravce@fkkunice.cz', 'tajne-heslo')).toBe(null);
  });

  it('odmítne příliš krátké nové heslo', async () => {
    await users.ensureSeedUser();
    const auth = await users.readAuth();
    cookieJar.value = await createSessionToken(auth.users[0].id);
    const res = await meApi.PUT(json('http://localhost/api/me', 'PUT', { currentPassword: 'tajne-heslo', newPassword: 'krat' }));
    expect(res.status).toBe(400);
  });
});

describe('/api/users — jen pro sekci Uživatelé a role', () => {
  it('bez přihlášení 401', async () => {
    expect((await usersApi.GET()).status).toBe(401);
  });

  it('redaktor dostane 403', async () => {
    await loginAs('redaktor');
    expect((await usersApi.GET()).status).toBe(403);
    const res = await usersApi.POST(json('http://localhost/api/users', 'POST', { email: 'novy@fkkunice.cz', role: 'redaktor' }));
    expect(res.status).toBe(403);
  });

  it('správce vidí seznam bez hesel', async () => {
    await loginAs('spravce');
    const res = await usersApi.GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.users.length).toBeGreaterThan(0);
    expect(JSON.stringify(data)).not.toContain('passwordHash');
  });

  it('správce založí uživatele a dostane vygenerované heslo', async () => {
    await loginAs('spravce');
    const res = await usersApi.POST(json('http://localhost/api/users', 'POST', { email: 'Novy@FKKunice.cz', name: 'Nový', role: 'redaktor' }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.user.email).toBe('novy@fkkunice.cz');
    expect(data.password.length).toBeGreaterThan(8);
    expect(data.user.mustChangePassword).toBe(true);
    expect(await users.authenticate('novy@fkkunice.cz', data.password)).toBeTruthy();
  });

  it('nedovolí dva účty se stejným e-mailem ani neznámou roli', async () => {
    await loginAs('spravce');
    await usersApi.POST(json('http://localhost/api/users', 'POST', { email: 'a@b.cz', role: 'redaktor' }));
    expect((await usersApi.POST(json('http://localhost/api/users', 'POST', { email: 'a@b.cz', role: 'redaktor' }))).status).toBe(409);
    expect((await usersApi.POST(json('http://localhost/api/users', 'POST', { email: 'c@d.cz', role: 'neexistuje' }))).status).toBe(400);
    expect((await usersApi.POST(json('http://localhost/api/users', 'POST', { email: 'bez-zavinace', role: 'redaktor' }))).status).toBe(400);
  });

  it('deaktivace odebere přístup', async () => {
    const me = await loginAs('spravce');
    const created = await (await usersApi.POST(json('http://localhost/api/users', 'POST', { email: 'e@f.cz', role: 'redaktor', password: 'heslo-1234' }))).json();
    await usersApi.PUT(json('http://localhost/api/users', 'PUT', { id: created.user.id, active: false }));
    expect(await users.authenticate('e@f.cz', 'heslo-1234')).toBe(null);
    expect(me.id).toBeTruthy();
  });

  it('nejde odstranit posledního správce', async () => {
    // Zakládající uživatel webu je Super správce; `loginAs` přidá ještě
    // Správce. Dokud existují dva, zamknout se ven nejde — proto se jeden
    // nejdřív odstraní a teprve pak se zkouší sáhnout na toho posledního.
    const me = await loginAs('superspravce');
    const auth = await users.readAuth();
    auth.users = auth.users.filter((u) => u.id === me.id);
    await users.writeAuth(auth);

    const off = await usersApi.PUT(json('http://localhost/api/users', 'PUT', { id: me.id, active: false }));
    expect(off.status).toBe(400);
    const down = await usersApi.PUT(json('http://localhost/api/users', 'PUT', { id: me.id, role: 'redaktor' }));
    expect(down.status).toBe(400);
  });

  it('sám sebe nesmí smazat', async () => {
    const me = await loginAs('spravce');
    const res = await usersApi.DELETE(new Request(`http://localhost/api/users?id=${me.id}`, { method: 'DELETE' }));
    expect(res.status).toBe(400);
  });

  it('reset hesla vygeneruje nové a staré přestane platit', async () => {
    await loginAs('spravce');
    const created = await (await usersApi.POST(json('http://localhost/api/users', 'POST', { email: 'g@h.cz', role: 'redaktor', password: 'stare-heslo-1' }))).json();
    const res = await usersApi.PUT(json('http://localhost/api/users', 'PUT', { id: created.user.id, resetPassword: true }));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(await users.authenticate('g@h.cz', 'stare-heslo-1')).toBe(null);
    expect(await users.authenticate('g@h.cz', data.password)).toBeTruthy();
  });
});

describe('/api/roles', () => {
  it('redaktor role neuloží (403)', async () => {
    await loginAs('redaktor');
    const res = await rolesApi.PUT(json('http://localhost/api/roles', 'PUT', { roles: [] }));
    expect(res.status).toBe(403);
  });

  it('správce uloží upravenou matici oprávnění', async () => {
    await loginAs('spravce');
    const { roles } = await (await rolesApi.GET()).json();
    const next = roles.map((r) => (r.id === 'redaktor' ? { ...r, permissions: { ...r.permissions, pronajem: 'edit' } } : r));
    const res = await rolesApi.PUT(json('http://localhost/api/roles', 'PUT', { roles: next }));
    expect(res.status).toBe(200);
    const auth = await users.readAuth();
    expect(auth.roles.find((r) => r.id === 'redaktor').permissions.pronajem).toBe('edit');
  });

  it('roli Správce nelze oslabit ani smazat', async () => {
    await loginAs('spravce');
    const { roles } = await (await rolesApi.GET()).json();
    const weakened = roles.map((r) => (r.id === 'spravce' ? { ...r, permissions: { ...r.permissions, uzivatele: 'none' } } : r));
    await rolesApi.PUT(json('http://localhost/api/roles', 'PUT', { roles: weakened }));
    const auth = await users.readAuth();
    expect(auth.roles.find((r) => r.id === 'spravce').permissions.uzivatele).toBe('edit');

    const without = roles.filter((r) => r.id !== 'spravce');
    expect((await rolesApi.PUT(json('http://localhost/api/roles', 'PUT', { roles: without }))).status).toBe(400);
  });

  it('nejde smazat roli, kterou někdo používá', async () => {
    await loginAs('spravce');
    await usersApi.POST(json('http://localhost/api/users', 'POST', { email: 'i@j.cz', role: 'redaktor' }));
    const { roles } = await (await rolesApi.GET()).json();
    const without = roles.filter((r) => r.id !== 'redaktor');
    const res = await rolesApi.PUT(json('http://localhost/api/roles', 'PUT', { roles: without }));
    expect(res.status).toBe(400);
  });
});

describe('oddělené úložiště', () => {
  it('uživatelé nejsou v obsahu webu', async () => {
    await users.ensureSeedUser();
    expect(globalThis.__fkAuthStore.data.users.length).toBe(1);
    expect(globalThis.__fkMemStore.data).toBe(null);
  });

  it('poškozený záznam se opraví na výchozí stav', () => {
    const auth = users.normalizeAuth({ users: 'nesmysl', roles: 42 });
    expect(auth.users).toEqual([]);
    expect(auth.roles.some((r) => r.id === 'spravce')).toBe(true);
  });
});
