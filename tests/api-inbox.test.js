// Integrační testy route handleru /api/inbox (počty čekající pošty).
// Hlídá se hlavně to, že se ven nedostanou jména ani kontakty — administrace
// se na tohle ptá i na pozadí, takže by to jinak tahalo osobní údaje pořád.
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

const { GET } = await import('@/app/api/inbox/route');
const { createSessionToken } = await import('@/lib/auth');
const { DEFAULTS, clone } = await import('@/lib/defaults');
const { ensureSeedUser, readAuth, writeAuth, hashPassword, randomToken } = await import('@/lib/users');

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

// obsah s jednou čekající položkou od každého druhu
function seedPosta() {
  const c = clone(DEFAULTS);
  c.reservations = [{ id: 'rez-1', name: 'Jan Novák', email: 'jan@novak.cz', phone: '602123456', status: 'nová', messages: [] }];
  c.messages = [{ name: 'Eva Malá', email: 'eva@example.cz', text: 'dotaz', date: '2026-08-01T10:00:00.000Z', status: 'nová' }];
  c.cmsRegistrations = [{ id: 'prih-1', name: 'Malý Novák', parent: 'Jan Novák', contact: 'jan@novak.cz', status: 'nová', messages: [] }];
  c.matchProposals = [{ id: 'navrh-1', status: 'nová', warnings: [], data: {} }];
  globalThis.__fkMemStore.data = c;
  return c;
}

beforeEach(() => {
  cookieJar.value = undefined;
  globalThis.__fkMemStore = { data: null };
  globalThis.__fkAuthStore = { data: null };
});

describe('ochrana', () => {
  it('bez přihlášení vrátí 401', async () => {
    expect((await GET()).status).toBe(401);
  });
});

describe('počty', () => {
  it('spočítá, co čeká na vyřízení', async () => {
    seedPosta();
    await loginAs('spravce');
    const data = await (await GET()).json();
    expect(data).toEqual({ reservations: 1, messages: 1, registrations: 1, proposals: 1 });
  });

  it('vyřízené položky se nepočítají', async () => {
    const c = seedPosta();
    c.reservations[0].status = 'potvrzená';
    c.messages[0].status = 'vyřízená';
    c.cmsRegistrations[0].status = 'vyřízená';
    c.matchProposals[0].status = 'schválená';
    globalThis.__fkMemStore.data = c;

    await loginAs('spravce');
    const data = await (await GET()).json();
    expect(data).toEqual({ reservations: 0, messages: 0, registrations: 0, proposals: 0 });
  });

  it('bez uloženého obsahu nespadne', async () => {
    await loginAs('spravce');
    const res = await GET();
    expect(res.status).toBe(200);
    expect((await res.json()).messages).toBe(0);
  });
});

describe('soukromí', () => {
  it('nevrací jména, e-maily ani telefony', async () => {
    seedPosta();
    await loginAs('spravce');
    const text = await (await GET()).text();

    for (const citlive of ['Jan Novák', 'jan@novak.cz', '602123456', 'Eva Malá', 'eva@example.cz', 'dotaz']) {
      expect(text).not.toContain(citlive);
    }
  });

  it('odpověď obsahuje jen čtyři čísla', async () => {
    seedPosta();
    await loginAs('spravce');
    const data = await (await GET()).json();
    expect(Object.keys(data).sort()).toEqual(['messages', 'proposals', 'registrations', 'reservations']);
    expect(Object.values(data).every((v) => typeof v === 'number')).toBe(true);
  });

  it('nesmí se cachovat (jinak by pruh svítil na starých číslech)', async () => {
    await loginAs('spravce');
    expect((await GET()).headers.get('Cache-Control')).toContain('no-store');
  });
});
