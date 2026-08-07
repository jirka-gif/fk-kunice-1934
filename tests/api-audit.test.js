// Záznam změn smí číst jen Super správce. Ostatní role, včetně Správce, ne.
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

const { GET } = await import('@/app/api/audit/route');
const { createSessionToken } = await import('@/lib/auth');
const { zapisZaznam, AKCE } = await import('@/lib/audit');
const { ensureSeedUser, readAuth, writeAuth, hashPassword, randomToken } = await import('@/lib/users');

const req = (qs = '') => new Request(`http://localhost/api/audit${qs}`);

async function pridej(role, email) {
  const auth = await readAuth();
  const { hash, salt, iterations } = await hashPassword('heslo-1234');
  const user = { id: randomToken(9), email, name: email, role, active: true, mustChangePassword: false, createdAt: '', passwordHash: hash, salt, iterations };
  auth.users.push(user);
  await writeAuth(auth);
  return user;
}

let superUser;
beforeEach(async () => {
  cookieJar.value = undefined;
  globalThis.__fkMemStore = { data: null };
  globalThis.__fkAuthStore = { data: null };
  globalThis.__fkAuditStore = { data: null };
  const auth = await ensureSeedUser();
  superUser = auth.users[0];
});

describe('kdo se k záznamu dostane', () => {
  it('bez přihlášení 401', async () => {
    expect((await GET(req())).status).toBe(401);
  });

  it('Správce dostane 403 — na záznam právo nemá', async () => {
    const spravce = await pridej('spravce', 'spravce@fkkunice.cz');
    cookieJar.value = await createSessionToken(spravce.id);
    expect((await GET(req())).status).toBe(403);
  });

  it('Redaktor dostane 403', async () => {
    const redaktor = await pridej('redaktor', 'redaktor@fkkunice.cz');
    cookieJar.value = await createSessionToken(redaktor.id);
    expect((await GET(req())).status).toBe(403);
  });

  it('Super správce záznam vidí', async () => {
    await zapisZaznam({ akce: AKCE.obsahZmena, user: superUser, detail: 'news' });
    cookieJar.value = await createSessionToken(superUser.id);
    const res = await GET(req());
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.zaznamy).toHaveLength(1);
    expect(data.zaznamy[0].detail).toBe('news');
  });
});

describe('filtry a strop', () => {
  beforeEach(async () => {
    for (let i = 0; i < 5; i++) await zapisZaznam({ akce: AKCE.obsahZmena, user: superUser, detail: `zmena ${i}` });
    await zapisZaznam({ akce: AKCE.prihlaseniOk, user: superUser, detail: '' });
    cookieJar.value = await createSessionToken(superUser.id);
  });

  it('filtruje podle akce', async () => {
    const data = await (await GET(req('?akce=prihlaseni-ok'))).json();
    expect(data.zaznamy).toHaveLength(1);
    expect(data.celkem).toBe(1);
  });

  it('respektuje limit a hlásí celkový počet', async () => {
    const data = await (await GET(req('?limit=2'))).json();
    expect(data.zaznamy).toHaveLength(2);
    expect(data.celkem).toBe(6);
  });

  it('nesmyslný limit spadne na výchozí hodnotu', async () => {
    const data = await (await GET(req('?limit=abc'))).json();
    expect(data.zaznamy.length).toBeGreaterThan(0);
  });
});
