// Role Super správce nesmí být samoobslužná: přidělit ji ani sáhnout na
// takového uživatele smí jen ten, kdo ji sám má. Kontroluje to server —
// rozhraní se dá obejít, proto se to testuje na API.
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

const { POST, PUT, DELETE } = await import('@/app/api/users/route');
const { createSessionToken } = await import('@/lib/auth');
const { SUPER_ROLE } = await import('@/lib/permissions');
const { ensureSeedUser, readAuth, writeAuth, hashPassword, randomToken } = await import('@/lib/users');

const req = (metoda, body) =>
  new Request('http://localhost/api/users', {
    method: metoda,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

// vytvoří uživatele s danou rolí a vrátí ho
async function pridej(role, email) {
  const auth = await readAuth();
  const { hash, salt, iterations } = await hashPassword('heslo-1234');
  const user = {
    id: randomToken(9), email, name: email, role,
    active: true, mustChangePassword: false, createdAt: '', passwordHash: hash, salt, iterations,
  };
  auth.users.push(user);
  await writeAuth(auth);
  return user;
}

async function prihlas(user) {
  cookieJar.value = await createSessionToken(user.id);
}

let superUser;
beforeEach(async () => {
  cookieJar.value = undefined;
  // Uživatelé bydlí ve vlastním úložišti (`__fkAuthStore`), ne v obsahu webu —
  // bez jeho vynulování by si testy přenášely uživatele mezi sebou.
  globalThis.__fkMemStore = { data: null };
  globalThis.__fkAuthStore = { data: null };
  // první uživatel nového webu je Super správce
  const auth = await ensureSeedUser();
  superUser = auth.users[0];
});

describe('kdo smí pracovat s rolí Super správce', () => {
  it('první uživatel webu je Super správce', () => {
    expect(superUser.role).toBe(SUPER_ROLE);
  });

  it('Správce nesmí založit dalšího Super správce', async () => {
    const spravce = await pridej('spravce', 'spravce@fkkunice.cz');
    await prihlas(spravce);
    const res = await POST(req('POST', { email: 'novy@fkkunice.cz', role: SUPER_ROLE }));
    expect(res.status).toBe(403);
  });

  it('Správce nesmí povýšit sám sebe', async () => {
    const spravce = await pridej('spravce', 'spravce@fkkunice.cz');
    await prihlas(spravce);
    const res = await PUT(req('PUT', { id: spravce.id, role: SUPER_ROLE }));
    expect(res.status).toBe(403);
    const auth = await readAuth();
    expect(auth.users.find((u) => u.id === spravce.id).role).toBe('spravce');
  });

  it('Správce nesmí zasáhnout do účtu Super správce', async () => {
    const spravce = await pridej('spravce', 'spravce@fkkunice.cz');
    await prihlas(spravce);
    expect((await PUT(req('PUT', { id: superUser.id, active: false }))).status).toBe(403);
    expect((await PUT(req('PUT', { id: superUser.id, resetPassword: true }))).status).toBe(403);
    const res = await DELETE(new Request(`http://localhost/api/users?id=${superUser.id}`, { method: 'DELETE' }));
    expect(res.status).toBe(403);
  });

  it('Super správce roli přidělit smí', async () => {
    const redaktor = await pridej('redaktor', 'redaktor@fkkunice.cz');
    await prihlas(superUser);
    const res = await PUT(req('PUT', { id: redaktor.id, role: SUPER_ROLE }));
    expect(res.status).toBe(200);
    const auth = await readAuth();
    expect(auth.users.find((u) => u.id === redaktor.id).role).toBe(SUPER_ROLE);
  });
});

describe('nikdo se nesmí zamknout ven', () => {
  it('poslední aktivní správce nejde deaktivovat ani přeřadit', async () => {
    await prihlas(superUser);
    const res = await PUT(req('PUT', { id: superUser.id, active: false }));
    expect(res.status).toBe(400);
  });

  it('Správce se počítá jako přístup do administrace', async () => {
    const spravce = await pridej('spravce', 'spravce@fkkunice.cz');
    await prihlas(superUser);
    // když existuje aktivní Správce, smí Super správce sám sebe deaktivovat
    const res = await PUT(req('PUT', { id: superUser.id, active: false }));
    expect(res.status).toBe(200);
    expect(spravce.role).toBe('spravce');
  });
});
