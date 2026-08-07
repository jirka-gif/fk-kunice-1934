// Integrační testy route handleru /api/mail (stav pošty + zkušební e-mail).
// Nic se doopravdy neposílá: buď Resend není nastavený, nebo se `fetch` podvrhne.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

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
delete process.env.MAIL_FROM;

const { GET, POST } = await import('@/app/api/mail/route');
const { createSessionToken } = await import('@/lib/auth');
const { ensureSeedUser, readAuth, writeAuth, hashPassword, randomToken } = await import('@/lib/users');

const req = (body) =>
  new Request('http://localhost/api/mail', {
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

beforeEach(() => {
  cookieJar.value = undefined;
  globalThis.__fkMemStore = { data: null };
});

afterEach(() => {
  delete process.env.RESEND_API_KEY;
  delete process.env.MAIL_FROM;
  vi.unstubAllGlobals();
});

describe('ochrana', () => {
  it('stav bez přihlášení vrátí 401', async () => {
    expect((await GET()).status).toBe(401);
  });

  it('zkušební e-mail bez přihlášení vrátí 401', async () => {
    expect((await POST(req({ to: 'kdokoli@example.cz' }))).status).toBe(401);
  });

  it('role bez práva na pronájem stav nevidí', async () => {
    await loginAs('trener'); // trenér má pronájem 'none'
    expect((await GET()).status).toBe(403);
  });

  it('role, která pronájem jen prohlíží, stav vidí, ale neodesílá', async () => {
    await loginAs('redaktor'); // redaktor má pronájem 'view'
    expect((await GET()).status).toBe(200);
    expect((await POST(req({ to: 'kdokoli@example.cz' }))).status).toBe(403);
  });
});

describe('stav pošty', () => {
  beforeEach(async () => { await loginAs('spravce'); });

  it('bez klíče hlásí, že pošta nefunguje, a řekne proč', async () => {
    const data = await (await GET()).json();
    expect(data.configured).toBe(false);
    expect(data.error).toContain('RESEND_API_KEY');
  });

  it('s klíčem a odesílatelem hlásí připojeno', async () => {
    process.env.RESEND_API_KEY = 'test-klic';
    process.env.MAIL_FROM = 'web@fkkunice.cz';
    const data = await (await GET()).json();
    expect(data.configured).toBe(true);
    expect(data.from).toBe('web@fkkunice.cz');
  });

  it('klíč se do prohlížeče nikdy nedostane', async () => {
    process.env.RESEND_API_KEY = 'super-tajny-klic';
    process.env.MAIL_FROM = 'web@fkkunice.cz';
    const text = await (await GET()).text();
    expect(text).not.toContain('super-tajny-klic');
  });
});

describe('zkušební e-mail', () => {
  beforeEach(async () => { await loginAs('spravce'); });

  it('odmítne nesmyslnou adresu', async () => {
    expect((await POST(req({ to: 'tohle-neni-mail' }))).status).toBe(400);
    expect((await POST(req({ to: '' }))).status).toBe(400);
  });

  it('bez nastavené pošty vrátí 409 a čitelnou hlášku', async () => {
    const res = await POST(req({ to: 'klub@fkkunice.cz' }));
    expect(res.status).toBe(409);
    const data = await res.json();
    expect(data.skipped).toBe(true);
    expect(data.error).toContain('RESEND_API_KEY');
  });

  it('s nastavenou poštou odešle a vrátí adresu', async () => {
    process.env.RESEND_API_KEY = 'test-klic';
    process.env.MAIL_FROM = 'web@fkkunice.cz';
    const volani = [];
    vi.stubGlobal('fetch', async (url, opts) => {
      volani.push({ url, body: JSON.parse(opts.body) });
      return { ok: true, status: 200, json: async () => ({ id: 'msg-1' }) };
    });

    const res = await POST(req({ to: 'klub@fkkunice.cz' }));
    expect(res.status).toBe(200);
    expect((await res.json()).to).toBe('klub@fkkunice.cz');
    expect(volani).toHaveLength(1);
    expect(volani[0].url).toContain('api.resend.com');
    expect(volani[0].body.to).toEqual(['klub@fkkunice.cz']);
    expect(volani[0].body.from).toBe('web@fkkunice.cz');
  });

  it('když Resend odmítne, vrátí 502 s jeho hláškou', async () => {
    process.env.RESEND_API_KEY = 'test-klic';
    process.env.MAIL_FROM = 'web@fkkunice.cz';
    vi.stubGlobal('fetch', async () => ({
      ok: false, status: 403, json: async () => ({ error: { message: 'Domain is not verified' } }),
    }));

    const res = await POST(req({ to: 'klub@fkkunice.cz' }));
    expect(res.status).toBe(502);
    expect((await res.json()).error).toContain('Domain is not verified');
  });

  // Resend posílá důvod i takhle — bez tohohle by v administraci svítilo
  // jen „selhalo (403)" a nikdo by nevěděl, že chybí ověřená doména.
  it('přečte důvod i z pole message, ne jen z error', async () => {
    process.env.RESEND_API_KEY = 'test-klic';
    process.env.MAIL_FROM = 'onboarding@resend.dev';
    vi.stubGlobal('fetch', async () => ({
      ok: false,
      status: 403,
      json: async () => ({ statusCode: 403, name: 'validation_error', message: 'You can only send testing emails to your own email address' }),
    }));

    const res = await POST(req({ to: 'nekdo@jinde.cz' }));
    expect(res.status).toBe(502);
    expect((await res.json()).error).toContain('your own email address');
  });
});
