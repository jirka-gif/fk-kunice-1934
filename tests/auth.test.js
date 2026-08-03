// Testy přihlašovací session: podpis, expirace a id uživatele v cookie.
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

describe('session token', () => {
  it('vytvořený token projde ověřením a nese id uživatele', async () => {
    const { createSessionToken, verifySessionToken, sessionUserId } = await loadAuth();
    const token = await createSessionToken('uzivatel-1');
    expect(token).toContain('.');
    expect(await verifySessionToken(token)).toBe(true);
    expect(await sessionUserId(token)).toBe('uzivatel-1');
  });

  it('odmítne chybějící nebo poškozený token', async () => {
    const { verifySessionToken, sessionUserId } = await loadAuth();
    expect(await verifySessionToken(undefined)).toBe(false);
    expect(await verifySessionToken('')).toBe(false);
    expect(await verifySessionToken('bez-tecky')).toBe(false);
    expect(await verifySessionToken(42)).toBe(false);
    expect(await sessionUserId('bez-tecky')).toBe(null);
  });

  it('odmítne token s podvrženým podpisem', async () => {
    const { createSessionToken, verifySessionToken } = await loadAuth();
    const token = await createSessionToken('uzivatel-1');
    const [body] = token.split('.');
    expect(await verifySessionToken(`${body}.podvrzeny-podpis`)).toBe(false);
  });

  it('nejde podvrhnout cizí id — podpis přestane sedět', async () => {
    const { createSessionToken, sessionUserId, verifySessionToken } = await loadAuth();
    const token = await createSessionToken('uzivatel-1');
    const [, sig] = token.split('.');
    const fakeBody = btoa(JSON.stringify({ uid: 'spravce', exp: Math.floor(Date.now() / 1000) + 999 }))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    expect(await verifySessionToken(`${fakeBody}.${sig}`)).toBe(false);
    expect(await sessionUserId(`${fakeBody}.${sig}`)).toBe(null);
  });

  it('odmítne token podepsaný jiným tajemstvím', async () => {
    const a = await loadAuth();
    const token = await a.createSessionToken('uzivatel-1');
    process.env.AUTH_SECRET = 'uplne-jiny-podpis';
    const b = await loadAuth();
    expect(await b.verifySessionToken(token)).toBe(false);
  });

  it('odmítne token po vypršení platnosti', async () => {
    const { createSessionToken, verifySessionToken } = await loadAuth();
    const token = await createSessionToken('uzivatel-1');
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
