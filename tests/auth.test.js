// Testy přihlašování: kontrola hesla, podpis a ověření session cookie.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const ORIGINAL_ENV = { ...process.env };

// lib/auth.js čte env až za běhu funkcí, ale kvůli jistotě modul mezi testy
// načítáme čerstvě (resetModules), aby se nesdílel stav.
async function loadAuth() {
  vi.resetModules();
  return import('@/lib/auth');
}

beforeEach(() => {
  process.env.ADMIN_PASSWORD = 'tajne-heslo';
  process.env.AUTH_SECRET = 'tajny-podpis';
});
afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  vi.useRealTimers();
});

describe('checkPassword', () => {
  it('přijme správné heslo', async () => {
    const { checkPassword } = await loadAuth();
    expect(checkPassword('tajne-heslo')).toBe(true);
  });

  it('odmítne špatné, prázdné i nestringové heslo', async () => {
    const { checkPassword } = await loadAuth();
    expect(checkPassword('spatne')).toBe(false);
    expect(checkPassword('')).toBe(false);
    expect(checkPassword(null)).toBe(false);
    expect(checkPassword(undefined)).toBe(false);
    expect(checkPassword(123)).toBe(false);
  });

  it('bez ADMIN_PASSWORD použije výchozí vývojové heslo', async () => {
    delete process.env.ADMIN_PASSWORD;
    const { checkPassword } = await loadAuth();
    expect(checkPassword('fkkunice')).toBe(true);
    expect(checkPassword('cokoliv')).toBe(false);
  });
});

describe('session token', () => {
  it('vytvořený token projde ověřením', async () => {
    const { createSessionToken, verifySessionToken } = await loadAuth();
    const token = await createSessionToken();
    expect(token).toContain('.');
    expect(await verifySessionToken(token)).toBe(true);
  });

  it('odmítne chybějící nebo poškozený token', async () => {
    const { verifySessionToken } = await loadAuth();
    expect(await verifySessionToken(undefined)).toBe(false);
    expect(await verifySessionToken('')).toBe(false);
    expect(await verifySessionToken('bez-tecky')).toBe(false);
    expect(await verifySessionToken(42)).toBe(false);
  });

  it('odmítne token s podvrženým podpisem', async () => {
    const { createSessionToken, verifySessionToken } = await loadAuth();
    const token = await createSessionToken();
    const [body] = token.split('.');
    expect(await verifySessionToken(`${body}.podvrzeny-podpis`)).toBe(false);
  });

  it('odmítne token podepsaný jiným tajemstvím', async () => {
    const a = await loadAuth();
    const token = await a.createSessionToken();
    process.env.AUTH_SECRET = 'uplne-jiny-podpis';
    const b = await loadAuth();
    expect(await b.verifySessionToken(token)).toBe(false);
  });

  it('odmítne token po vypršení platnosti', async () => {
    const { createSessionToken, verifySessionToken } = await loadAuth();
    const token = await createSessionToken();
    // posuneme čas o 8 dní (platnost je 7 dní)
    const realNow = Date.now;
    Date.now = () => realNow() + 8 * 24 * 60 * 60 * 1000;
    try {
      expect(await verifySessionToken(token)).toBe(false);
    } finally {
      Date.now = realNow;
    }
  });
});

describe('cookieOptions', () => {
  it('cookie je httpOnly a platná pro celý web', async () => {
    const { cookieOptions, SESSION_COOKIE } = await loadAuth();
    expect(SESSION_COOKIE).toBe('fk_session');
    expect(cookieOptions.httpOnly).toBe(true);
    expect(cookieOptions.path).toBe('/');
    expect(cookieOptions.sameSite).toBe('lax');
  });
});
