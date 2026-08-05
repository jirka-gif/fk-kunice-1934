// Testy veřejného API dostupnosti termínů a odesílání upozornění e-mailem.
import { describe, it, expect, beforeEach, vi } from 'vitest';

delete process.env.DATABASE_URL;
delete process.env.POSTGRES_URL;

const { GET } = await import('@/app/api/availability/route');
const { DEFAULTS, clone } = await import('@/lib/defaults');

const get = (qs) => GET(new Request(`http://localhost/api/availability?${qs}`));

// termín v budoucnu, ať neplete kontrola „už je pozdě"
const den = new Date(Date.now() + 7 * 86400000);
const DATE = `${den.getFullYear()}-${String(den.getMonth() + 1).padStart(2, '0')}-${String(den.getDate()).padStart(2, '0')}`;
const MONTH = DATE.slice(0, 7);

function obsahS(reservations) {
  const c = clone(DEFAULTS);
  c.reservations = reservations;
  return c;
}

beforeEach(() => {
  globalThis.__fkMemStore = { data: null };
});

describe('GET /api/availability — den', () => {
  it('vrátí termíny dne a označí obsazené', async () => {
    globalThis.__fkMemStore.data = obsahS([
      { id: 'a', name: 'Tajné jméno', contact: 'tajny@email.cz', area: 'Hlavní stadion', dateISO: DATE, from: '10:00', status: 'nová' },
    ]);
    const data = await (await get(`area=Hlavní stadion&date=${DATE}`)).json();
    expect(data.slots.length).toBeGreaterThan(0);
    expect(data.slots.find((s) => s.time === '10:00')).toMatchObject({ free: false, reason: 'obsazeno' });
    expect(data.freeCount).toBe(data.totalCount - 1);
  });

  it('nikdy neprozradí, kdo si termín zabral', async () => {
    globalThis.__fkMemStore.data = obsahS([
      { id: 'a', name: 'Tajné jméno', contact: 'tajny@email.cz', area: 'Hlavní stadion', dateISO: DATE, from: '10:00', status: 'nová' },
    ]);
    const text = await (await get(`area=Hlavní stadion&date=${DATE}`)).text();
    expect(text).not.toContain('Tajné jméno');
    expect(text).not.toContain('tajny@email.cz');
  });

  it('nepotvrzená poptávka drží termín stejně jako potvrzená', async () => {
    globalThis.__fkMemStore.data = obsahS([
      { id: 'a', name: 'X', area: 'Hlavní stadion', dateISO: DATE, from: '11:00', status: 'nová' },
      { id: 'b', name: 'Y', area: 'Hlavní stadion', dateISO: DATE, from: '12:00', status: 'zamítnutá' },
    ]);
    const data = await (await get(`area=Hlavní stadion&date=${DATE}`)).json();
    expect(data.slots.find((s) => s.time === '11:00').free).toBe(false);
    expect(data.slots.find((s) => s.time === '12:00').free).toBe(true);
  });

  it('obsazenost jedné plochy nezasahuje do druhé', async () => {
    globalThis.__fkMemStore.data = obsahS([
      { id: 'a', name: 'X', area: 'Hlavní stadion', dateISO: DATE, from: '10:00', status: 'nová' },
    ]);
    const data = await (await get(`area=Umělá tráva&date=${DATE}`)).json();
    expect(data.slots.find((s) => s.time === '10:00').free).toBe(true);
  });

  it('zavřený den označí jako zavřený', async () => {
    const c = obsahS([]);
    c.rentalSettings = { ...c.rentalSettings, closedDays: [DATE] };
    globalThis.__fkMemStore.data = c;
    const data = await (await get(`area=Hlavní stadion&date=${DATE}`)).json();
    expect(data.closed).toBe(true);
    expect(data.freeCount).toBe(0);
  });

  it('bez uloženého obsahu vrátí volné termíny z výchozího nastavení', async () => {
    const data = await (await get(`area=Hlavní stadion&date=${DATE}`)).json();
    expect(data.totalCount).toBe(14); // 08:00–22:00 po hodině
    expect(data.freeCount).toBe(14);
  });
});

describe('GET /api/availability — měsíc', () => {
  it('vrátí stav každého dne v měsíci', async () => {
    const data = await (await get(`area=Hlavní stadion&month=${MONTH}`)).json();
    expect(data.days.length).toBeGreaterThanOrEqual(28);
    expect(data.days.every((d) => ['volno', 'částečně', 'plno', 'zavřeno', 'mimo'].includes(d.state))).toBe(true);
  });

  it('den s jednou rezervací je „částečně"', async () => {
    globalThis.__fkMemStore.data = obsahS([
      { id: 'a', name: 'X', area: 'Hlavní stadion', dateISO: DATE, from: '10:00', status: 'potvrzená' },
    ]);
    const data = await (await get(`area=Hlavní stadion&month=${MONTH}`)).json();
    expect(data.days.find((d) => d.date === DATE).state).toBe('částečně');
  });

  it('dny v minulosti jsou „mimo"', async () => {
    const data = await (await get(`area=Hlavní stadion&month=2020-01`)).json();
    expect(data.days.every((d) => d.state === 'mimo')).toBe(true);
  });
});

describe('GET /api/availability — vstup', () => {
  it('bez parametru vrátí 400 s nápovědou', async () => {
    const res = await get('area=X');
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain('YYYY-MM');
  });

  it('nesmyslné datum vrátí 400', async () => {
    expect((await get('area=X&date=vcera')).status).toBe(400);
  });

  it('odpověď se nesmí cachovat', async () => {
    const res = await get(`area=X&date=${DATE}`);
    expect(res.headers.get('Cache-Control')).toContain('no-store');
  });
});

describe('upozornění e-mailem', () => {
  const ORIGINAL = { ...process.env };
  const load = async () => { vi.resetModules(); return import('@/lib/mail'); };

  it('bez klíče se e-mail neposílá, ale nic nespadne', async () => {
    delete process.env.RESEND_API_KEY;
    const { sendMail, mailConfigured } = await load();
    expect(mailConfigured()).toBe(false);
    const out = await sendMail({ to: 'klub@fkkunice.cz', subject: 'x', text: 'y' });
    expect(out).toMatchObject({ ok: false, skipped: true });
    expect(out.error).toContain('RESEND_API_KEY');
    process.env = { ...ORIGINAL };
  });

  it('bez adresy příjemce se e-mail neposílá', async () => {
    const { sendMail } = await load();
    const out = await sendMail({ to: '', subject: 'x', text: 'y' });
    expect(out.skipped).toBe(true);
  });

  it('s nastaveným klíčem odešle požadavek na Resend', async () => {
    process.env.RESEND_API_KEY = 'test-klic';
    process.env.MAIL_FROM = 'web@fkkunice.cz';
    const { sendMail } = await load();
    const fetchImpl = vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ id: 'mail1' }) }));
    const out = await sendMail({ to: 'klub@fkkunice.cz', subject: 'Nová poptávka', text: 'obsah' }, fetchImpl);
    expect(out.ok).toBe(true);
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toContain('api.resend.com');
    expect(JSON.parse(init.body).to).toEqual(['klub@fkkunice.cz']);
    process.env = { ...ORIGINAL };
  });

  it('chybu z Resendu vrátí čitelně', async () => {
    process.env.RESEND_API_KEY = 'test-klic';
    process.env.MAIL_FROM = 'web@fkkunice.cz';
    const { sendMail } = await load();
    const fetchImpl = vi.fn(async () => ({ ok: false, status: 422, json: async () => ({ error: { message: 'Doména není ověřená' } }) }));
    const out = await sendMail({ to: 'klub@fkkunice.cz', subject: 'x', text: 'y' }, fetchImpl);
    expect(out.ok).toBe(false);
    expect(out.error).toContain('Doména není ověřená');
    process.env = { ...ORIGINAL };
  });

  it('text upozornění obsahuje vše, co klub potřebuje vědět', async () => {
    const { reservationMail } = await load();
    const m = reservationMail({ area: 'Hlavní stadion', date: '10. července 2026', from: '18:00', to: '19:00', name: 'Petr Svoboda', contact: '777123456', note: 'Turnaj' });
    expect(m.subject).toContain('Hlavní stadion');
    expect(m.text).toContain('18:00–19:00');
    expect(m.text).toContain('Petr Svoboda');
    expect(m.text).toContain('777123456');
    expect(m.text).toContain('Turnaj');
    expect(m.text).toContain('Pronájem → Rezervace');
  });
});
