// Integrační testy route handleru /api/submit (veřejné odeslání formulářů).
import { describe, it, expect, beforeEach } from 'vitest';

delete process.env.DATABASE_URL;
delete process.env.POSTGRES_URL;

const { POST } = await import('@/app/api/submit/route');
const { DEFAULTS } = await import('@/lib/defaults');

const req = (body) =>
  new Request('http://localhost/api/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });

beforeEach(() => {
  globalThis.__fkMemStore = { data: null };
});

describe('validace vstupu', () => {
  it('odmítne neplatný JSON', async () => {
    expect((await POST(req('{rozbite'))).status).toBe(400);
  });

  it('odmítne neznámý typ', async () => {
    expect((await POST(req({ type: 'cokoliv', payload: {} }))).status).toBe(400);
  });
});

describe('type: message (kontaktní formulář)', () => {
  it('přidá zprávu se stavem "nová" a datem', async () => {
    const res = await POST(req({ type: 'message', payload: { name: 'Jan Novák', email: 'jan@example.com', text: 'Dobrý den' } }));
    expect(res.status).toBe(200);

    const msgs = globalThis.__fkMemStore.data.messages;
    expect(msgs.length).toBe(1);
    expect(msgs[0].name).toBe('Jan Novák');
    expect(msgs[0].email).toBe('jan@example.com');
    expect(msgs[0].text).toBe('Dobrý den');
    expect(msgs[0].status).toBe('nová');
    expect(new Date(msgs[0].date).toString()).not.toBe('Invalid Date');
  });

  it('novější zpráva je první v seznamu', async () => {
    await POST(req({ type: 'message', payload: { name: 'První', text: 'a' } }));
    await POST(req({ type: 'message', payload: { name: 'Druhá', text: 'b' } }));
    const msgs = globalThis.__fkMemStore.data.messages;
    expect(msgs.map((m) => m.name)).toEqual(['Druhá', 'První']);
  });

  it('nepřepíše zbytek obsahu', async () => {
    await POST(req({ type: 'message', payload: { name: 'Jan', text: 'x' } }));
    const data = globalThis.__fkMemStore.data;
    expect(data.teams.length).toBe(DEFAULTS.teams.length);
    expect(data.sponsors).toEqual(DEFAULTS.sponsors);
  });

  it('zachová dříve uložené úpravy obsahu', async () => {
    globalThis.__fkMemStore.data = { sponsors: ['JEDINÝ PARTNER'] };
    await POST(req({ type: 'message', payload: { name: 'Jan', text: 'x' } }));
    expect(globalThis.__fkMemStore.data.sponsors).toEqual(['JEDINÝ PARTNER']);
    expect(globalThis.__fkMemStore.data.messages.length).toBe(1);
  });

  it('ořízne příliš dlouhý text a nestringové hodnoty nahradí prázdným řetězcem', async () => {
    await POST(req({ type: 'message', payload: { name: { zle: true }, text: 'x'.repeat(5000) } }));
    const m = globalThis.__fkMemStore.data.messages[0];
    expect(m.name).toBe('');
    expect(m.text.length).toBe(2000);
  });
});

describe('type: reservation (pronájem)', () => {
  it('přidá rezervaci na začátek seznamu se stavem "nová"', async () => {
    const before = DEFAULTS.reservations.length;
    await POST(req({ type: 'reservation', payload: { name: 'Petr Svoboda', contact: '777123456', area: 'Hlavní hřiště', date: '2026-08-10', time: '18:00', note: 'Turnaj' } }));
    const list = globalThis.__fkMemStore.data.reservations;
    expect(list.length).toBe(before + 1);
    expect(list[0].name).toBe('Petr Svoboda');
    expect(list[0].area).toBe('Hlavní hřiště');
    expect(list[0].status).toBe('nová');
    expect(list[0].source).toBe('web');
  });
});

describe('type: registration (nábor)', () => {
  it('přidá registraci označenou jako nová', async () => {
    const before = DEFAULTS.cmsRegistrations.length;
    await POST(req({ type: 'registration', payload: { name: 'Eva Malá', team: 'Přípravka', contact: 'eva@example.com' } }));
    const list = globalThis.__fkMemStore.data.cmsRegistrations;
    expect(list.length).toBe(before + 1);
    expect(list[0].name).toBe('Eva Malá');
    expect(list[0].team).toBe('Přípravka');
    expect(list[0].tag).toBe('Nová');
    expect(list[0].tg).toBe('new');
  });

  it('nepřepíše rezervace ani zprávy', async () => {
    await POST(req({ type: 'message', payload: { name: 'Jan', text: 'x' } }));
    await POST(req({ type: 'registration', payload: { name: 'Eva Malá', team: 'Přípravka' } }));
    expect(globalThis.__fkMemStore.data.messages.length).toBe(1);
  });
});
