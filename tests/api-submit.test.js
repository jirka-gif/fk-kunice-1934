// Integrační testy route handleru /api/submit (veřejné odeslání formulářů).
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

delete process.env.DATABASE_URL;
delete process.env.POSTGRES_URL;

const { POST } = await import('@/app/api/submit/route');
const { DEFAULTS, mergeStored } = await import('@/lib/defaults');

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
  const prihlaska = (over = {}) => ({
    type: 'registration',
    payload: {
      name: 'Eva Malá', birthdate: '2017-04-08', team: 'Přípravka',
      parent: 'Jana Malá', contact: 'eva@example.com', note: 'Hrála rok ve školce', ...over,
    },
  });

  it('uloží přihlášku se stavem „nová" a se všemi údaji', async () => {
    const res = await POST(req(prihlaska()));
    expect(res.status).toBe(200);

    const r = globalThis.__fkMemStore.data.cmsRegistrations[0];
    expect(r.name).toBe('Eva Malá');
    expect(r.birthdate).toBe('2017-04-08');
    expect(r.team).toBe('Přípravka');
    expect(r.parent).toBe('Jana Malá');
    expect(r.contact).toBe('eva@example.com');
    expect(r.note).toBe('Hrála rok ve školce');
    expect(r.status).toBe('nová');
    expect(r.source).toBe('web');
    expect(new Date(r.createdAt).toString()).not.toBe('Invalid Date');
  });

  it('novější přihláška je první v seznamu', async () => {
    await POST(req(prihlaska({ name: 'První' })));
    await POST(req(prihlaska({ name: 'Druhá' })));
    expect(globalThis.__fkMemStore.data.cmsRegistrations.slice(0, 2).map((r) => r.name)).toEqual(['Druhá', 'První']);
  });

  it('bez jména neuloží nic', async () => {
    const res = await POST(req(prihlaska({ name: '  ' })));
    expect(res.status).toBe(400);
    expect(globalThis.__fkMemStore.data).toBe(null);
  });

  it('nepřepíše rezervace ani zprávy', async () => {
    await POST(req({ type: 'message', payload: { name: 'Jan', text: 'x' } }));
    await POST(req(prihlaska()));
    expect(globalThis.__fkMemStore.data.messages.length).toBe(1);
  });
});

describe('přihlášky v obsahu', () => {
  it('starý ukázkový zápis se převede na skutečná pole', () => {
    const m = mergeStored({ cmsRegistrations: [{ name: 'Tobiáš Malý', team: 'Přípravka U9', ini: 'TM', bg: '#C1121F', tag: 'Nová', tg: 'new' }] });
    const r = m.cmsRegistrations[0];
    expect(r.status).toBe('nová');
    expect(r.id).toBeTruthy();
    // vizuální zbytky z návrhu už v datech nejsou
    expect(r.ini).toBeUndefined();
    expect(r.bg).toBeUndefined();
    expect(r.tag).toBeUndefined();
    expect(r.tg).toBeUndefined();
  });

  it('starý štítek „schváleno" se převede na vyřízenou', () => {
    const m = mergeStored({ cmsRegistrations: [{ name: 'X', tg: 'ok' }] });
    expect(m.cmsRegistrations[0].status).toBe('vyřízená');
  });

  it('poškozený vstup nespadne', () => {
    expect(mergeStored({ cmsRegistrations: 'nesmysl' }).cmsRegistrations).toEqual([]);
  });
});

describe('e-mail u přihlášky', () => {
  it('vytáhne adresu z volného kontaktu, aby šlo rodiči odepsat', async () => {
    await POST(req({ type: 'registration', payload: { name: 'Tomáš Novák', parent: 'Eva Nová', contact: '602 123 456 · eva@novakovi.cz' } }));
    const data = mergeStored(globalThis.__fkMemStore.data);
    expect(data.cmsRegistrations[0].email).toBe('eva@novakovi.cz');
  });

  it('bez adresy v kontaktu zůstane e-mail prázdný (a admin to pozná)', async () => {
    await POST(req({ type: 'registration', payload: { name: 'Petr', contact: '602 123 456' } }));
    const data = mergeStored(globalThis.__fkMemStore.data);
    expect(data.cmsRegistrations[0].email).toBe('');
  });
});

// -----------------------------------------------------------------------------
//  UPOZORNĚNÍ KLUBU
//  Dřív chodil e-mail jen u pronájmu. Přihláška do týmu ani zpráva z kontaktu
//  klubu nikde nezacinkaly, takže se o nich nikdo nedozvěděl, dokud sám
//  neotevřel administraci.
// -----------------------------------------------------------------------------
describe('upozornění klubu na novou poštu', () => {
  const odeslane = [];

  beforeEach(() => {
    odeslane.length = 0;
    process.env.RESEND_API_KEY = 'test-klic';
    process.env.MAIL_FROM = 'web@fkkunice.cz';
    vi.stubGlobal('fetch', async (url, opts) => {
      odeslane.push(JSON.parse(opts.body));
      return { ok: true, status: 200, json: async () => ({ id: 'msg' }) };
    });
  });

  afterEach(() => {
    delete process.env.RESEND_API_KEY;
    delete process.env.MAIL_FROM;
    vi.unstubAllGlobals();
  });

  const sAdresou = (adresa) => {
    const c = mergeStored(null);
    c.rentalSettings = { ...c.rentalSettings, notifyEmail: adresa };
    globalThis.__fkMemStore.data = c;
  };

  it('přihláška do klubu pošle klubu upozornění', async () => {
    sAdresou('klub@fkkunice.cz');
    const res = await POST(req({ type: 'registration', payload: { name: 'Malý Novák', team: 'U11', parent: 'Jan Novák', contact: 'jan@novak.cz' } }));
    expect(res.status).toBe(200);
    expect(odeslane).toHaveLength(1);
    expect(odeslane[0].to).toEqual(['klub@fkkunice.cz']);
    expect(odeslane[0].subject).toContain('Nová přihláška');
    expect(odeslane[0].text).toContain('Malý Novák');
  });

  it('zpráva z kontaktu pošle klubu upozornění i s textem', async () => {
    sAdresou('klub@fkkunice.cz');
    const res = await POST(req({ type: 'message', payload: { name: 'Eva', email: 'eva@example.cz', text: 'Kdy máte trénink?' } }));
    expect(res.status).toBe(200);
    expect(odeslane).toHaveLength(1);
    expect(odeslane[0].subject).toContain('Nová zpráva');
    expect(odeslane[0].text).toContain('Kdy máte trénink?');
  });

  it('bez adresy pro upozornění se použije klubový e-mail', async () => {
    const c = mergeStored(null);
    c.rentalSettings = { ...c.rentalSettings, notifyEmail: '' };
    c.club = { ...c.club, email: 'info@fkkunice.cz' };
    globalThis.__fkMemStore.data = c;

    await POST(req({ type: 'message', payload: { name: 'Eva', text: 'dotaz' } }));
    expect(odeslane[0].to).toEqual(['info@fkkunice.cz']);
  });

  it('bez nastavené pošty se přihláška i zpráva přesto uloží', async () => {
    delete process.env.RESEND_API_KEY;
    sAdresou('klub@fkkunice.cz');

    expect((await POST(req({ type: 'registration', payload: { name: 'Bez pošty' } }))).status).toBe(200);
    expect((await POST(req({ type: 'message', payload: { name: 'Eva', text: 'dotaz' } }))).status).toBe(200);
    expect(odeslane).toHaveLength(0);

    const ulozeno = globalThis.__fkMemStore.data;
    expect(ulozeno.cmsRegistrations[0].name).toBe('Bez pošty');
    expect(ulozeno.messages[0].text).toBe('dotaz');
  });
});
