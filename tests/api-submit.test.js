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
    expect(globalThis.__fkMemStore.data.sponsors.map((s) => s.name)).toEqual(['JEDINÝ PARTNER']);
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
  // termín musí být v budoucnu a uvnitř povoleného horizontu (120 dní)
  const den = new Date(Date.now() + 7 * 86400000);
  const dateISO = `${den.getFullYear()}-${String(den.getMonth() + 1).padStart(2, '0')}-${String(den.getDate()).padStart(2, '0')}`;

  const poptavka = (over = {}) => ({
    type: 'reservation',
    payload: {
      name: 'Petr Svoboda', contact: '777123456', area: 'Hlavní stadion',
      dateISO, from: '18:00', note: 'Turnaj', ...over,
    },
  });

  it('uloží poptávku se stavem „nová" a strojovým termínem', async () => {
    const res = await POST(req(poptavka()));
    expect(res.status).toBe(200);

    const list = globalThis.__fkMemStore.data.reservations;
    expect(list[0].name).toBe('Petr Svoboda');
    expect(list[0].area).toBe('Hlavní stadion');
    expect(list[0].status).toBe('nová');
    expect(list[0].source).toBe('web');
    expect(list[0].dateISO).toBe(dateISO);
    expect(list[0].from).toBe('18:00');
    expect(list[0].to).toBe('19:00'); // dopočítaný konec termínu
    expect(list[0].date).toContain(String(den.getFullYear())); // čitelně pro admin
  });

  it('obsazený termín odmítne a nic neuloží', async () => {
    await POST(req(poptavka()));
    const pocet = globalThis.__fkMemStore.data.reservations.length;

    const res = await POST(req(poptavka({ name: 'Někdo jiný' })));
    expect(res.status).toBe(409);
    expect((await res.json()).error).toContain('obsazený');
    expect(globalThis.__fkMemStore.data.reservations.length).toBe(pocet);
  });

  it('stejný čas na jiné ploše projde', async () => {
    await POST(req(poptavka()));
    const res = await POST(req(poptavka({ area: 'Umělá tráva' })));
    expect(res.status).toBe(200);
  });

  it('termín v minulosti odmítne', async () => {
    const res = await POST(req(poptavka({ dateISO: '2020-01-01' })));
    expect(res.status).toBe(409);
  });

  it('čas mimo otevírací dobu odmítne', async () => {
    const res = await POST(req(poptavka({ from: '03:00' })));
    expect(res.status).toBe(409);
  });

  it('bez jména neuloží nic', async () => {
    const res = await POST(req(poptavka({ name: '  ' })));
    expect(res.status).toBe(400);
    expect(globalThis.__fkMemStore.data).toBe(null);
  });

  it('bez nastaveného e-mailu se poptávka přesto uloží', async () => {
    const res = await POST(req(poptavka()));
    expect(res.status).toBe(200);
    expect((await res.json()).emailSent).toBe(false);
    expect(globalThis.__fkMemStore.data.reservations.length).toBeGreaterThan(0);
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
