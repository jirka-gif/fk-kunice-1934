// =============================================================================
//  FK KUNICE — PŘÍSPĚVKY NA SOCIÁLNÍ SÍTĚ (běží na serveru i klientu)
//  Čistá logika: sestavení textu, adresy vizuálu a stavů fronty.
//  Samotné odeslání na Metu řeší lib/meta.js (server only).
// =============================================================================

export const SOCIAL_TARGETS = [
  { value: 'facebook', label: 'Facebook' },
  { value: 'instagram', label: 'Instagram' },
];

// koncept → čeká na schválení → naplánováno → odesláno / chyba
export const POST_STATUSES = ['koncept', 'ke schválení', 'odesláno', 'chyba'];

export const DEFAULT_TEMPLATE =
  '{vysledek} {domaci} {skore} {hoste}\n\n{strelci}\n\n#fkkunice #fotbal #{souteznihashtag}';

export function emptySocialSettings() {
  return {
    autoPublish: false, // true = po potvrzení výsledku se rovnou odešle
    targets: ['facebook'],
    template: DEFAULT_TEMPLATE,
    maxAttempts: 3,
  };
}

export function emptySocialPost() {
  return {
    id: '',
    createdAt: '',
    status: 'koncept',
    targets: ['facebook'],
    text: '',
    attempts: 0,
    lastError: '',
    history: [], // { at, action, target, ok, message }
    visual: {
      title: 'VÝSLEDEK',
      home: 'FK KUNICE',
      away: 'SOUPEŘ',
      score: '0:0',
      competition: '',
      date: '',
      scorers: '',
      hashtag: '#jednotajedeme',
      photo: '', // nahraná fotka na pozadí (data URL z administrace) nebo odkaz
    },
  };
}

// počet pokusů: nesmysl → výchozí 3, jinak vždy mezi 1 a 10
function attemptsInRange(value) {
  const n = Math.round(Number(value));
  return Number.isFinite(n) ? Math.min(10, Math.max(1, n)) : 3;
}

export function normalizeSocial(data) {
  data.socialPosts = (Array.isArray(data.socialPosts) ? data.socialPosts : [])
    .map((p, i) => {
      const base = emptySocialPost();
      const src = p && typeof p === 'object' ? p : {};
      return {
        ...base,
        ...src,
        id: src.id || `post-${i + 1}`,
        status: POST_STATUSES.includes(src.status) ? src.status : 'koncept',
        targets: Array.isArray(src.targets) && src.targets.length ? src.targets : base.targets,
        attempts: Number(src.attempts) || 0,
        history: Array.isArray(src.history) ? src.history.slice(-20) : [],
        visual: { ...base.visual, ...(src.visual || {}) },
      };
    })
    .slice(0, 200);
  const s = data.socialSettings && typeof data.socialSettings === 'object' ? data.socialSettings : {};
  data.socialSettings = {
    ...emptySocialSettings(),
    ...s,
    targets: Array.isArray(s.targets) && s.targets.length ? s.targets : ['facebook'],
    maxAttempts: attemptsInRange(s.maxAttempts),
  };
  return data;
}

// --- text příspěvku ---------------------------------------------------------
const hashtagize = (text) =>
  String(text || '')
    .normalize('NFD')
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, '')
    .toLowerCase() || 'zapas';

// Do šablony doplní hodnoty z vizuálu. Neznámé značky nechá být, ať je vidět překlep.
export function buildPostText(template, visual) {
  const v = { ...emptySocialPost().visual, ...(visual || {}) };
  const values = {
    vysledek: v.title || '',
    domaci: v.home || '',
    hoste: v.away || '',
    skore: v.score || '',
    soutez: v.competition || '',
    datum: v.date || '',
    strelci: v.scorers ? `Branky: ${v.scorers}` : '',
    souteznihashtag: hashtagize(v.competition),
  };
  return String(template || DEFAULT_TEMPLATE)
    .replace(/\{(\w+)\}/g, (m, key) => (values[key] !== undefined ? values[key] : m))
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// --- vizuál -----------------------------------------------------------------
// Krátký otisk vizuálu — připojuje se k adrese, aby prohlížeč po úpravě
// nezobrazil starý obrázek z mezipaměti.
export function visualFingerprint(visual) {
  const text = JSON.stringify(visual || {});
  let hash = 0;
  for (let i = 0; i < text.length; i++) hash = (hash * 31 + text.charCodeAt(i)) | 0;
  return Math.abs(hash).toString(36);
}

// Adresa generovaného obrázku (@vercel/og). Absolutní URL potřebuje Meta,
// relativní stačí pro náhled v administraci.
//
// Nahraná fotka je uložená jako data URL — do adresy by se nevešla, proto se
// u příspěvku s fotkou posílá jen jeho `id` a generátor si obsah načte sám.
export function buildOgUrl(visual, baseUrl = '', postId = '') {
  const v = { ...emptySocialPost().visual, ...(visual || {}) };
  const base = `${String(baseUrl).replace(/\/+$/, '')}/api/og/match`;
  if (v.photo && postId) {
    return `${base}?post=${encodeURIComponent(postId)}&v=${visualFingerprint(v)}`;
  }
  const params = new URLSearchParams();
  for (const key of ['title', 'home', 'away', 'score', 'competition', 'date', 'scorers', 'hashtag']) {
    if (v[key]) params.set(key, v[key]);
  }
  if (v.photo) params.set('photo', v.photo); // odkaz na fotku (ne data URL)
  params.set('v', visualFingerprint(v));
  return `${base}?${params.toString()}`;
}

// --- vytvoření příspěvku z potvrzeného výsledku ------------------------------
// Volá se po schválení návrhu zápasu (Krok 3) — z výsledku udělá koncept postu.
export function postFromResult({ teamName, lastMatch, competition, settings, now }) {
  const set = { ...emptySocialSettings(), ...(settings || {}) };
  const lm = lastMatch || {};
  const at = now || new Date().toISOString();
  const weAreHome = true; // skóre v lastMatch je vždy zapsané z našeho pohledu
  const visual = {
    title: lm.result || 'VÝSLEDEK',
    home: weAreHome ? (teamName || 'FK KUNICE').toUpperCase() : String(lm.opp || '').toUpperCase(),
    away: weAreHome ? String(lm.opp || 'SOUPEŘ').toUpperCase() : (teamName || 'FK KUNICE').toUpperCase(),
    score: lm.score || '',
    competition: competition || '',
    date: lm.dateISO ? lm.dateISO.slice(0, 10).split('-').reverse().join('. ') : '',
    scorers: lm.scorers || '',
    hashtag: emptySocialPost().visual.hashtag,
    photo: '', // fotku ke konkrétnímu zápasu nahraje člověk v administraci
  };
  return {
    ...emptySocialPost(),
    id: `post-${at}`,
    createdAt: at,
    status: set.autoPublish ? 'ke schválení' : 'koncept',
    targets: set.targets,
    text: buildPostText(set.template, visual),
    visual,
  };
}

// --- fronta -----------------------------------------------------------------
export function canRetry(post, settings) {
  const max = (settings && settings.maxAttempts) || 3;
  return post.status === 'chyba' && (post.attempts || 0) < max;
}

export function withHistory(post, entry) {
  return { ...post, history: [...(post.history || []), entry].slice(-20) };
}
