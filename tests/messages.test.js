// Testy zpráv z kontaktního formuláře (sekce Zprávy v adminu).
import { describe, it, expect, beforeEach } from 'vitest';
import { DEFAULTS, mergeStored, clone } from '@/lib/defaults';

delete process.env.DATABASE_URL;
delete process.env.POSTGRES_URL;

const { POST } = await import('@/app/api/submit/route');

const send = (payload) =>
  POST(new Request('http://localhost/api/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'message', payload }),
  }));

beforeEach(() => {
  globalThis.__fkMemStore = { data: null };
});

describe('zprávy z webu v obsahu', () => {
  it('odeslaná zpráva je v obsahu se stavem „nová" a admin ji uvidí', async () => {
    await send({ name: 'Jan Novák', email: 'jan@example.com', text: 'Dobrý den' });
    const content = mergeStored(globalThis.__fkMemStore.data);
    expect(content.messages.length).toBe(1);
    expect(content.messages[0].status).toBe('nová');
  });

  it('počet nevyřízených zpráv se počítá ze stavu', () => {
    const content = mergeStored({
      ...clone(DEFAULTS),
      messages: [
        { name: 'A', status: 'nová' },
        { name: 'B', status: 'vyřízená' },
        { name: 'C', status: 'nová' },
      ],
    });
    expect(content.messages.filter((m) => m.status !== 'vyřízená').length).toBe(2);
  });

  it('označení zprávy jako vyřízené se uloží', () => {
    const saved = clone(DEFAULTS);
    saved.messages = [{ name: 'A', email: '', text: 'x', date: '', status: 'nová' }];
    saved.messages[0].status = 'vyřízená';
    expect(mergeStored(saved).messages[0].status).toBe('vyřízená');
  });

  it('smazání zprávy nechá zbytek obsahu netknutý', () => {
    const saved = clone(DEFAULTS);
    saved.messages = [{ name: 'A', status: 'nová' }, { name: 'B', status: 'nová' }];
    saved.messages = saved.messages.filter((m) => m.name !== 'A');
    const m = mergeStored(saved);
    expect(m.messages.map((x) => x.name)).toEqual(['B']);
    expect(m.teams.length).toBe(DEFAULTS.teams.length);
  });
});

describe('přehled v adminu stojí na reálných datech', () => {
  it('vymyšlené statistiky už v obsahu nejsou', () => {
    expect(DEFAULTS.cmsStats).toBeUndefined();
    expect(DEFAULTS.cmsTodayMatches).toBeUndefined();
  });

  it('počty pro přehled se dají spočítat z obsahu', () => {
    const d = mergeStored({
      ...clone(DEFAULTS),
      messages: [{ status: 'nová' }, { status: 'vyřízená' }],
      reservations: [{ status: 'nová' }, { status: 'potvrzená' }, { status: 'nová' }],
      cmsRegistrations: [{ status: 'nová' }, { status: 'vyřízená' }],
    });
    expect(d.messages.filter((m) => m.status !== 'vyřízená').length).toBe(1);
    expect(d.reservations.filter((r) => r.status === 'nová').length).toBe(2);
    expect(d.cmsRegistrations.filter((r) => r.status === 'nová').length).toBe(1);
    expect(d.camps.filter((c) => !c.archived).length).toBe(DEFAULTS.camps.length);
  });

  it('týmy mají termín příštího zápasu pro seznam nejbližších zápasů', () => {
    const withDate = DEFAULTS.teams.filter((t) => t.nextMatch && t.nextMatch.dateISO);
    expect(withDate.length).toBeGreaterThan(0);
    expect(isNaN(new Date(withDate[0].nextMatch.dateISO))).toBe(false);
  });
});
