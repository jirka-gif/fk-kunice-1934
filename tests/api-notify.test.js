// Integrační testy route handleru /api/notify (odeslání e-mailu žadateli).
// Nic se doopravdy neposílá — Resend není nastavený, takže se ověřuje, že se
// požadavek odmítne čitelně a že se to zapíše do historie.
import { describe, it, expect, beforeEach, vi } from 'vitest';

const cookieJar = { value: undefined };
vi.mock('next/headers', () => ({
  cookies: () => ({ get: (name) => (name === 'fk_session' && cookieJar.value ? { value: cookieJar.value } : undefined) }),
}));

process.env.ADMIN_PASSWORD = 'tajne-heslo';
process.env.ADMIN_EMAIL = 'spravce@fkkunice.cz';
process.env.AUTH_SECRET = 'tajny-podpis';
// Pojistka proti omylem odeslané poště je mimo produkci zapnutá — tady ji
// vědomě vypínáme, protože `fetch` je podvržený a nic ven neodejde.
process.env.FK_MAIL_LIVE = '1';
delete process.env.DATABASE_URL;
delete process.env.POSTGRES_URL;
delete process.env.RESEND_API_KEY;

const { POST } = await import('@/app/api/notify/route');
const { createSessionToken } = await import('@/lib/auth');
const { getStoredContent, saveStoredContent } = await import('@/lib/db');
const { DEFAULTS, clone } = await import('@/lib/defaults');
const { ensureSeedUser, readAuth, writeAuth, hashPassword, randomToken } = await import('@/lib/users');

const req = (body) =>
  new Request('http://localhost/api/notify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });

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

// obsah s jednou rezervací, která má vyplněný e-mail
async function seedRezervace(over = {}) {
  const content = clone(DEFAULTS);
  content.reservations = [{
    id: 'rez-1', name: 'Jan Novák', email: 'jan@novak.cz', area: 'Hlavní stadion',
    date: '12. července 2026', from: '17:00', to: '18:00', status: 'nová', source: 'web', messages: [],
    ...over,
  }];
  await saveStoredContent(content);
}

beforeEach(async () => {
  cookieJar.value = undefined;
  globalThis.__fkMemStore = { data: null };
});

describe('ochrana', () => {
  it('bez přihlášení vrátí 401', async () => {
    await seedRezervace();
    const res = await POST(req({ typ: 'rezervace', id: 'rez-1', subject: 'Předmět', text: 'Text' }));
    expect(res.status).toBe(401);
  });

  it('role bez práva na pronájem neprojde', async () => {
    await seedRezervace();
    await loginAs('trener'); // trenér má pronájem 'none'
    const res = await POST(req({ typ: 'rezervace', id: 'rez-1', subject: 'Předmět', text: 'Text' }));
    expect(res.status).toBe(403);
  });
});

describe('validace', () => {
  beforeEach(async () => { await seedRezervace(); await loginAs('spravce'); });

  it('odmítne neznámý typ záznamu', async () => {
    expect((await POST(req({ typ: 'cokoliv', id: 'rez-1', subject: 'a', text: 'b' }))).status).toBe(400);
  });

  it('odmítne prázdný předmět i text', async () => {
    expect((await POST(req({ typ: 'rezervace', id: 'rez-1', subject: '', text: 'b' }))).status).toBe(400);
    expect((await POST(req({ typ: 'rezervace', id: 'rez-1', subject: 'a', text: '  ' }))).status).toBe(400);
  });

  it('neexistující záznam vrátí 404', async () => {
    expect((await POST(req({ typ: 'rezervace', id: 'nic', subject: 'a', text: 'b' }))).status).toBe(404);
  });
});

describe('odeslání bez nastaveného Resendu', () => {
  it('vrátí čitelnou chybu a zapíše neúspěch do historie', async () => {
    await seedRezervace();
    await loginAs('spravce');
    const res = await POST(req({ typ: 'rezervace', id: 'rez-1', subject: 'Rezervace potvrzena', text: 'Dobrý den…' }));
    expect(res.status).toBe(409); // přeskočeno — chybí klíč
    const data = await res.json();
    expect(data.error).toContain('RESEND_API_KEY');

    // podstatné: v administraci musí být vidět, že e-mail NEODEŠEL
    const ulozeno = await getStoredContent();
    const zaznam = ulozeno.reservations[0];
    expect(zaznam.messages).toHaveLength(1);
    expect(zaznam.messages[0].ok).toBe(false);
    expect(zaznam.messages[0].subject).toBe('Rezervace potvrzena');
    expect(zaznam.messages[0].to).toBe('jan@novak.cz');
  });

  it('bez e-mailu u záznamu neodesílá vůbec', async () => {
    await seedRezervace({ email: '' });
    await loginAs('spravce');
    const res = await POST(req({ typ: 'rezervace', id: 'rez-1', subject: 'a', text: 'b' }));
    expect(res.status).toBe(400);
    const ulozeno = await getStoredContent();
    expect(ulozeno.reservations[0].messages).toHaveLength(0);
  });
});
