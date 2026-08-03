// Testy příjmu návrhů zápasů (POST /api/matches) a jejich normalizace v obsahu.
import { describe, it, expect, beforeEach } from 'vitest';

process.env.MATCHES_TOKEN = 'tajny-token-scraperu';
delete process.env.DATABASE_URL;
delete process.env.POSTGRES_URL;

const { POST } = await import('@/app/api/matches/route');
const { DEFAULTS, mergeStored, normalizeProposals, emptyProposal, clone } = await import('@/lib/defaults');

const req = (body, token = 'tajny-token-scraperu') =>
  new Request('http://localhost/api/matches', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token === null ? {} : { 'x-scraper-token': token }) },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });

const proposal = (teamId = 'muziA') => ({
  teamId,
  teamName: 'Muži A',
  sourceUrl: 'https://www.fotbal.cz/souteze/vzorek',
  warnings: [],
  data: {
    nextMatch: { home: { short: 'TK', name: 'TJ KAMENICE', side: 'Domácí' }, away: { short: 'FK', name: 'FK KUNICE', side: 'Hosté' }, when: '21. 6. 2026 · 16:30', venue: 'TJ Kamenice', dateISO: '2026-06-21T16:30:00' },
    lastMatch: { opp: 'TJ Mnichovice', score: '3:1', result: 'VÝHRA', scorers: '' },
    table: [{ pos: 1, team: 'FK Kunice', gp: 17, pts: 38, me: true }],
  },
});

beforeEach(() => {
  globalThis.__fkMemStore = { data: null };
  process.env.MATCHES_TOKEN = 'tajny-token-scraperu';
});

describe('ochrana tokenem', () => {
  it('bez tokenu vrátí 401 a nic neuloží', async () => {
    const res = await POST(req({ proposals: [proposal()] }, null));
    expect(res.status).toBe(401);
    expect(globalThis.__fkMemStore.data).toBe(null);
  });

  it('se špatným tokenem vrátí 401', async () => {
    expect((await POST(req({ proposals: [proposal()] }, 'uplne-jiny'))).status).toBe(401);
    expect(globalThis.__fkMemStore.data).toBe(null);
  });

  it('když token na serveru není nastavený, nepustí nikoho', async () => {
    delete process.env.MATCHES_TOKEN;
    expect((await POST(req({ proposals: [proposal()] }, ''))).status).toBe(401);
  });

  it('se správným tokenem projde', async () => {
    const res = await POST(req({ proposals: [proposal()] }));
    expect(res.status).toBe(200);
    expect((await res.json()).created).toBe(1);
  });
});

describe('uložení návrhu', () => {
  it('návrh se uloží jako „nová" a nesáhne na data týmu', async () => {
    await POST(req({ proposals: [proposal()] }));
    const content = mergeStored(globalThis.__fkMemStore.data);

    expect(content.matchProposals.length).toBe(1);
    const p = content.matchProposals[0];
    expect(p.status).toBe('nová');
    expect(p.teamId).toBe('muziA');
    expect(p.data.lastMatch.score).toBe('3:1');

    // klíčové: tým má pořád svá původní data, dokud to člověk nepotvrdí
    const team = content.teams.find((t) => t.id === 'muziA');
    const original = DEFAULTS.teams.find((t) => t.id === 'muziA');
    expect(team.nextMatch).toEqual(original.nextMatch);
    expect(team.lastMatch).toEqual(original.lastMatch);
  });

  it('nepřepíše zbytek obsahu webu', async () => {
    globalThis.__fkMemStore.data = { sponsors: ['JEDINÝ PARTNER'] };
    await POST(req({ proposals: [proposal()] }));
    const content = mergeStored(globalThis.__fkMemStore.data);
    expect(content.sponsors).toEqual(['JEDINÝ PARTNER']);
    expect(content.news.length).toBe(DEFAULTS.news.length);
  });

  it('nový návrh nahradí starší nevyřízený návrh stejného týmu', async () => {
    await POST(req({ proposals: [proposal()] }));
    await POST(req({ proposals: [proposal()] }));
    const content = mergeStored(globalThis.__fkMemStore.data);
    expect(content.matchProposals.filter((p) => p.teamId === 'muziA' && p.status === 'nová').length).toBe(1);
  });

  it('už vyřízené návrhy zůstanou v historii', async () => {
    await POST(req({ proposals: [proposal()] }));
    const content = mergeStored(globalThis.__fkMemStore.data);
    content.matchProposals[0].status = 'schválená';
    globalThis.__fkMemStore.data = content;

    await POST(req({ proposals: [proposal()] }));
    const after = mergeStored(globalThis.__fkMemStore.data);
    expect(after.matchProposals.length).toBe(2);
    expect(after.matchProposals.filter((p) => p.status === 'schválená').length).toBe(1);
  });

  it('návrh bez teamId se zahodí', async () => {
    const res = await POST(req({ proposals: [{ ...proposal(), teamId: '' }] }));
    expect((await res.json()).created).toBe(0);
  });

  it('odmítne neplatný JSON', async () => {
    expect((await POST(req('{rozbite'))).status).toBe(400);
  });
});

describe('monitoring stahování', () => {
  it('úspěšný běh zapíše stav ok', async () => {
    await POST(req({ proposals: [proposal()] }));
    const sync = mergeStored(globalThis.__fkMemStore.data).matchesSync;
    expect(sync.status).toBe('ok');
    expect(sync.lastRunAt).toBeTruthy();
    expect(sync.lastOkAt).toBe(sync.lastRunAt);
  });

  it('selhání zapíše chybu, ale nepřepíše čas posledního úspěchu', async () => {
    await POST(req({ proposals: [proposal()] }));
    const okAt = mergeStored(globalThis.__fkMemStore.data).matchesSync.lastOkAt;

    await POST(req({ proposals: [], error: 'fotbal.cz vrátil 403' }));
    const sync = mergeStored(globalThis.__fkMemStore.data).matchesSync;
    expect(sync.status).toBe('chyba');
    expect(sync.message).toContain('403');
    expect(sync.lastOkAt).toBe(okAt);
  });

  it('varování z parseru se uchovají u návrhu i ve stavu', async () => {
    const p = { ...proposal(), warnings: ['Nepodařilo se najít tabulku soutěže.'] };
    await POST(req({ proposals: [p] }));
    const content = mergeStored(globalThis.__fkMemStore.data);
    expect(content.matchProposals[0].warnings).toEqual(['Nepodařilo se najít tabulku soutěže.']);
    expect(content.matchesSync.teams[0].warnings.length).toBe(1);
  });
});

describe('normalizeProposals', () => {
  it('doplní chybějící pole', () => {
    const data = normalizeProposals({ matchProposals: [{ teamId: 'muziA' }] });
    expect(data.matchProposals[0].id).toBe('navrh-1');
    expect(data.matchProposals[0].status).toBe('nová');
    expect(data.matchProposals[0].warnings).toEqual([]);
    expect(data.matchProposals[0].data.table).toEqual([]);
  });

  it('poškozený vstup nespadne', () => {
    expect(normalizeProposals({}).matchProposals).toEqual([]);
    expect(normalizeProposals({ matchProposals: 'nesmysl' }).matchProposals).toEqual([]);
    expect(normalizeProposals({ matchesSync: 'nesmysl' }).matchesSync.status).toBe('nikdy');
  });

  it('výchozí obsah nemá žádné návrhy a stav je „nikdy"', () => {
    expect(DEFAULTS.matchProposals).toEqual([]);
    expect(DEFAULTS.matchesSync.status).toBe('nikdy');
  });

  it('emptyProposal má tvar, se kterým admin počítá', () => {
    const p = emptyProposal();
    expect(p).toHaveProperty('teamId');
    expect(p).toHaveProperty('status');
    expect(p.data).toHaveProperty('nextMatch');
    expect(p.data).toHaveProperty('table');
  });
});

describe('týmy mají adresu zdroje', () => {
  it('sourceUrl se doplní z facrUrl a dá se uložit', () => {
    const m = mergeStored({ teams: [{ id: 'muziA', players: [], facrUrl: 'https://fotbal.cz/a' }] });
    expect(m.teams[0].sourceUrl).toBe('https://fotbal.cz/a');

    const saved = clone(DEFAULTS);
    saved.teams[0].sourceUrl = 'https://fotbal.cz/moje-souteze';
    expect(mergeStored(saved).teams[0].sourceUrl).toBe('https://fotbal.cz/moje-souteze');
  });
});
