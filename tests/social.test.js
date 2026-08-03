// Testy příspěvků na sociální sítě: text, vizuál, fronta a publikační vrstva
// (Meta Graph API je zamockované — nikdy nevoláme skutečné API).
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  buildPostText, buildOgUrl, postFromResult, normalizeSocial, emptySocialPost,
  emptySocialSettings, canRetry, withHistory, DEFAULT_TEMPLATE,
} from '@/lib/social';
import { DEFAULTS, mergeStored, clone } from '@/lib/defaults';

const VISUAL = {
  title: 'VÝHRA', home: 'FK KUNICE', away: 'TJ MNICHOVICE', score: '3:1',
  competition: 'III. třída', date: '14. 6. 2026', scorers: 'A. Pokorný 2×, J. Svoboda',
};

describe('buildPostText', () => {
  it('doplní hodnoty do šablony', () => {
    const text = buildPostText('{vysledek}: {domaci} {skore} {hoste} ({soutez}, {datum})', VISUAL);
    expect(text).toBe('VÝHRA: FK KUNICE 3:1 TJ MNICHOVICE (III. třída, 14. 6. 2026)');
  });

  it('střelce uvede jen když jsou vyplnění', () => {
    expect(buildPostText('{strelci}', VISUAL)).toBe('Branky: A. Pokorný 2×, J. Svoboda');
    expect(buildPostText('{strelci}', { ...VISUAL, scorers: '' })).toBe('');
  });

  it('udělá z názvu soutěže hashtag bez diakritiky a mezer', () => {
    expect(buildPostText('#{souteznihashtag}', { ...VISUAL, competition: 'Okresní přebor' })).toBe('#okresniprebor');
    expect(buildPostText('#{souteznihashtag}', { ...VISUAL, competition: '' })).toBe('#zapas');
  });

  it('neznámou značku nechá být (ať je vidět překlep)', () => {
    expect(buildPostText('{neexistuje}', VISUAL)).toBe('{neexistuje}');
  });

  it('nenechá po sobě prázdné řádky', () => {
    const text = buildPostText('{domaci} {skore} {hoste}\n\n{strelci}\n\nkonec', { ...VISUAL, scorers: '' });
    expect(text).toBe('FK KUNICE 3:1 TJ MNICHOVICE\n\nkonec');
  });

  it('výchozí šablona dá čitelný příspěvek', () => {
    const text = buildPostText(DEFAULT_TEMPLATE, VISUAL);
    expect(text).toContain('FK KUNICE 3:1 TJ MNICHOVICE');
    expect(text).toContain('#fkkunice');
  });
});

describe('buildOgUrl', () => {
  it('poskládá adresu vizuálu se všemi hodnotami', () => {
    const url = new URL(buildOgUrl(VISUAL, 'https://fkkunice.cz'));
    expect(url.pathname).toBe('/api/og/match');
    expect(url.searchParams.get('score')).toBe('3:1');
    expect(url.searchParams.get('home')).toBe('FK KUNICE');
    expect(url.searchParams.get('scorers')).toContain('Pokorný');
  });

  it('prázdné hodnoty do adresy nedává', () => {
    const url = buildOgUrl({ home: 'A', away: 'B', score: '', competition: '' }, 'https://x.cz');
    expect(url).not.toContain('competition');
  });

  it('předá i hashtag, který se kreslí svisle u okraje', () => {
    const url = new URL(buildOgUrl({ ...VISUAL, hashtag: '#jednotajedeme' }, 'https://x.cz'));
    expect(url.searchParams.get('hashtag')).toBe('#jednotajedeme');
  });

  it('bez základní adresy vrátí relativní odkaz pro náhled', () => {
    expect(buildOgUrl(VISUAL).startsWith('/api/og/match?')).toBe(true);
  });
});

describe('postFromResult — spouštěč z potvrzeného výsledku', () => {
  const lastMatch = { opp: 'TJ Mnichovice', score: '3:1', result: 'VÝHRA', scorers: 'A. Pokorný', dateISO: '2026-06-14T00:00:00' };

  it('z výsledku vyrobí koncept s vyplněným vizuálem i textem', () => {
    const post = postFromResult({ teamName: 'Muži A', lastMatch, competition: 'III. třída', settings: emptySocialSettings(), now: '2026-06-14T18:00:00.000Z' });
    expect(post.status).toBe('koncept');
    expect(post.visual.score).toBe('3:1');
    expect(post.visual.title).toBe('VÝHRA');
    expect(post.visual.away).toBe('TJ MNICHOVICE');
    expect(post.visual.date).toBe('14. 06. 2026');
    expect(post.visual.hashtag).toBe('#jednotajedeme');
    expect(post.text).toContain('3:1');
  });

  it('se zapnutým automatem jde rovnou ke schválení', () => {
    const post = postFromResult({ teamName: 'Muži A', lastMatch, settings: { ...emptySocialSettings(), autoPublish: true } });
    expect(post.status).toBe('ke schválení');
  });

  it('převezme vybrané sítě z nastavení', () => {
    const post = postFromResult({ teamName: 'Muži A', lastMatch, settings: { ...emptySocialSettings(), targets: ['facebook', 'instagram'] } });
    expect(post.targets).toEqual(['facebook', 'instagram']);
  });
});

describe('normalizeSocial', () => {
  it('doplní chybějící pole a opraví neznámý stav', () => {
    const d = normalizeSocial({ socialPosts: [{ status: 'cokoliv' }] });
    expect(d.socialPosts[0].id).toBe('post-1');
    expect(d.socialPosts[0].status).toBe('koncept');
    expect(d.socialPosts[0].targets).toEqual(['facebook']);
    expect(d.socialPosts[0].visual.score).toBe('0:0');
  });

  it('poškozený vstup nespadne', () => {
    expect(normalizeSocial({}).socialPosts).toEqual([]);
    expect(normalizeSocial({ socialPosts: 'nesmysl' }).socialPosts).toEqual([]);
    expect(normalizeSocial({ socialSettings: 'nesmysl' }).socialSettings.maxAttempts).toBe(3);
  });

  it('počet pokusů drží v rozumných mezích', () => {
    expect(normalizeSocial({ socialSettings: { maxAttempts: 99 } }).socialSettings.maxAttempts).toBe(10);
    expect(normalizeSocial({ socialSettings: { maxAttempts: 0 } }).socialSettings.maxAttempts).toBe(1);
  });

  it('výchozí obsah má prázdnou frontu a ruční režim', () => {
    expect(DEFAULTS.socialPosts).toEqual([]);
    expect(DEFAULTS.socialSettings.autoPublish).toBe(false);
  });

  it('uložený příspěvek přetrvá', () => {
    const saved = clone(DEFAULTS);
    saved.socialPosts = [{ ...emptySocialPost(), id: 'a', text: 'Můj text' }];
    expect(mergeStored(saved).socialPosts[0].text).toBe('Můj text');
  });
});

describe('fronta a opakování', () => {
  it('opakovat lze jen chybný příspěvek do limitu pokusů', () => {
    const s = emptySocialSettings();
    expect(canRetry({ status: 'chyba', attempts: 1 }, s)).toBe(true);
    expect(canRetry({ status: 'chyba', attempts: 3 }, s)).toBe(false);
    expect(canRetry({ status: 'odesláno', attempts: 0 }, s)).toBe(false);
  });

  it('historie se přidává a drží posledních 20 záznamů', () => {
    let post = emptySocialPost();
    for (let i = 0; i < 25; i++) post = withHistory(post, { at: '', action: 'odeslání', target: 'facebook', ok: true, message: `#${i}` });
    expect(post.history.length).toBe(20);
    expect(post.history[19].message).toBe('#24');
  });
});

describe('publikační vrstva (Meta zamockovaná)', () => {
  const ORIGINAL = { ...process.env };
  beforeEach(() => {
    process.env.META_PAGE_ID = '123';
    process.env.META_PAGE_TOKEN = 'token';
    process.env.META_IG_USER_ID = '456';
  });

  const load = async () => {
    vi.resetModules();
    return import('@/lib/meta');
  };
  const okFetch = (payloads) => {
    let i = 0;
    return vi.fn(async () => ({ ok: true, status: 200, json: async () => payloads[i++] || {} }));
  };

  it('Facebook: pošle fotku s popiskem a vrátí id', async () => {
    const { publishToFacebook } = await load();
    const fetchImpl = okFetch([{ id: 'foto1', post_id: 'page_1' }]);
    const out = await publishToFacebook({ text: 'Ahoj', imageUrl: 'https://x.cz/og.png' }, fetchImpl);
    expect(out).toEqual({ id: 'page_1', target: 'facebook' });
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toContain('/123/photos');
    expect(JSON.parse(init.body).caption).toBe('Ahoj');
  });

  it('Instagram: nejdřív container, potom publish', async () => {
    const { publishToInstagram } = await load();
    const fetchImpl = okFetch([{ id: 'container1' }, { id: 'ig_post_1' }]);
    const out = await publishToInstagram({ text: 'Ahoj', imageUrl: 'https://x.cz/og.png' }, fetchImpl);
    expect(out).toEqual({ id: 'ig_post_1', target: 'instagram' });
    expect(fetchImpl.mock.calls[0][0]).toContain('/456/media');
    expect(fetchImpl.mock.calls[1][0]).toContain('/456/media_publish');
    expect(JSON.parse(fetchImpl.mock.calls[1][1].body).creation_id).toBe('container1');
  });

  it('chybu z Mety převede na čitelnou hlášku', async () => {
    const { publishToFacebook } = await load();
    const fetchImpl = vi.fn(async () => ({ ok: false, status: 400, json: async () => ({ error: { message: 'Invalid OAuth access token' } }) }));
    await expect(publishToFacebook({ text: 'x', imageUrl: 'y' }, fetchImpl)).rejects.toThrow('Invalid OAuth access token');
  });

  it('bez nastavených tokenů rovnou řekne, co chybí', async () => {
    delete process.env.META_PAGE_TOKEN;
    const { publishToFacebook, missingConfig } = await load();
    expect(missingConfig('facebook')).toContain('META_PAGE_TOKEN');
    await expect(publishToFacebook({ text: 'x', imageUrl: 'y' })).rejects.toThrow('META_PAGE_TOKEN');
    process.env = { ...ORIGINAL };
  });

  it('publishPost zapíše výsledek za každou síť a chybu nevyhodí ven', async () => {
    const { publishPost } = await load();
    let call = 0;
    const fetchImpl = vi.fn(async () => {
      call++;
      if (call === 1) return { ok: true, status: 200, json: async () => ({ id: 'fb1', post_id: 'fb1' }) };
      return { ok: false, status: 400, json: async () => ({ error: { message: 'Chyba Instagramu' } }) };
    });
    const post = { ...emptySocialPost(), text: 'Ahoj', targets: ['facebook', 'instagram'] };
    const { results, ok } = await publishPost(post, 'https://x.cz/og.png', fetchImpl);

    expect(ok).toBe(false);
    expect(results.length).toBe(2);
    expect(results[0]).toMatchObject({ target: 'facebook', ok: true });
    expect(results[1]).toMatchObject({ target: 'instagram', ok: false });
    expect(results[1].message).toContain('Chyba Instagramu');
  });

  it('bez vybrané sítě vrátí srozumitelnou chybu', async () => {
    const { publishPost } = await load();
    const { results, ok } = await publishPost({ ...emptySocialPost(), targets: [] }, 'https://x.cz/og.png', vi.fn());
    expect(ok).toBe(false);
    expect(results[0].message).toContain('Není vybraná žádná síť');
  });
});
