// =============================================================================
//  FK KUNICE — SPOLEČNÁ DATOVÁ VRSTVA (bez Reactu, běží na serveru i klientu)
//  Sestaví výchozí obsah z content/club.js a normalizuje týmová data.
//  Používá to jak klientský store (lib/store.js), tak serverové API (app/api/*).
// =============================================================================
import * as club from '@/content/club';

export const clone = (o) => JSON.parse(JSON.stringify(o));

// prázdné zápasové struktury pro tým bez dat
export function emptyNextMatch() {
  return { home: { short: 'FK', name: 'KUNICE', side: 'Domácí' }, away: { short: '?', name: 'SOUPEŘ', side: 'Hosté' }, when: '', venue: 'Areál Kunice', dateISO: '' };
}
export function emptyMatchDetail() {
  return { header: '', when: '', home: { short: 'FK', name: 'KUNICE' }, away: { short: '?', name: 'SOUPEŘ' }, score: { home: 0, away: 0 }, result: 'VÝHRA', events: [], stats: [] };
}
export function emptyLastMatch() {
  return { opp: '', score: '', result: 'VÝHRA', scorers: '' };
}

// zápasová data týmu — z club.teamMatches; Muži A navíc detailní průběh + homepage výsledky
function teamMatch(id) {
  const m = club.teamMatches && club.teamMatches[id];
  if (id === 'muziA' && m) return { ...m, results: club.results, matchDetail: club.matchDetail };
  if (m) return { ...m, results: [], matchDetail: emptyMatchDetail() };
  return { nextMatch: emptyNextMatch(), lastMatch: emptyLastMatch(), results: [], table: [], facrUrl: '', matchDetail: emptyMatchDetail() };
}

// hráč = objekt (jméno, číslo, pozice, fotka, statistiky). Převod ze starého stringu.
const POS_CYCLE = club.posCycle;
export function toPlayer(p, i) {
  const base = { name: '', number: i + 1, position: POS_CYCLE[i % POS_CYCLE.length], photo: '', age: '', apps: '', goals: '', assists: '', since: '', favClub: '', favPlayer: '' };
  if (typeof p === 'string') return { ...base, name: p };
  return { ...base, ...p };
}

// --- KEMPY ---------------------------------------------------------------
// Jeden kemp = karta na homepage (tag, titulek, popis, cena) + celý detail
// na /kempy (program, trenéři, FAQ…). Kempů může být víc, staré se archivují.
export function emptyCamp() {
  return {
    id: '', archived: false,
    tag: '', title: '', desc: '', img: 'sunset',
    badge: '', lead: '', price: '', term: '', startISO: '',
    capacity: { taken: 0, total: 0 },
    perks: [], program: [], includes: [], coaches: [], faq: [],
  };
}

export function toCamp(c, i) {
  const base = emptyCamp();
  const src = c && typeof c === 'object' ? c : {};
  return {
    ...base,
    ...src,
    id: src.id || `kemp-${i + 1}`,
    archived: !!src.archived,
    capacity: { ...base.capacity, ...(src.capacity || {}) },
    perks: src.perks || [],
    program: src.program || [],
    includes: src.includes || [],
    coaches: src.coaches || [],
    faq: src.faq || [],
  };
}

// výchozí kempy: karty z club.camps doplněné detailem z club.campDetail
function buildCamps() {
  const detail = club.campDetail || {};
  return (club.camps || []).map((c, i) =>
    toCamp(
      {
        ...c,
        badge: i === 0 ? detail.badge : `${c.tag || ''} · ${(c.title || '').toUpperCase()}`.trim(),
        lead: i === 0 ? detail.lead : c.desc,
        startISO: i === 0 ? detail.startISO : '',
        capacity: i === 0 ? detail.capacity : { taken: 0, total: 0 },
        perks: clone(detail.perks || []),
        program: clone(detail.program || []),
        includes: clone(detail.includes || []),
        coaches: clone(detail.coaches || []),
        faq: clone(detail.faq || []),
      },
      i,
    ),
  );
}

// doplní chybějící pole u kempů; starý obsah s jedním `campDetail` přenese
// do prvního kempu, aby se po aktualizaci nic neztratilo
export function normalizeCamps(data, legacy) {
  const legacyDetail = (legacy && legacy.campDetail) || null;
  data.camps = (Array.isArray(data.camps) ? data.camps : []).map((c, i) => {
    if (!legacyDetail || (c && c.perks)) return toCamp(c, i);
    // starý formát: první kemp převezme celý detail, další jen jeho kostru
    const skeleton = {
      perks: clone(legacyDetail.perks || []), program: clone(legacyDetail.program || []),
      includes: clone(legacyDetail.includes || []), coaches: clone(legacyDetail.coaches || []),
      faq: clone(legacyDetail.faq || []),
    };
    return toCamp({ ...(i === 0 ? legacyDetail : skeleton), ...c }, i);
  });
  delete data.campDetail;
  return data;
}

// --- NOVINKY -------------------------------------------------------------
// Každá novinka má vlastní `id` do adresy detailu (/novinky/<id>) a delší
// text `body`, který se ukazuje jen na detailu.
const CZ_MAP = { á: 'a', č: 'c', ď: 'd', é: 'e', ě: 'e', í: 'i', ň: 'n', ó: 'o', ř: 'r', š: 's', ť: 't', ú: 'u', ů: 'u', ý: 'y', ž: 'z' };
export function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .split('')
    .map((ch) => (CZ_MAP[ch] !== undefined ? CZ_MAP[ch] : ch))
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

export function emptyNews() {
  return { id: '', category: 'Klub', title: '', text: '', body: '', date: '', image: '' };
}

// zajistí, že každá novinka má neprázdné a jedinečné id (adresa detailu)
export function normalizeNews(data) {
  const used = new Set();
  data.news = (Array.isArray(data.news) ? data.news : []).map((n, i) => {
    const item = { ...emptyNews(), ...(n && typeof n === 'object' ? n : {}) };
    let id = item.id || slugify(item.title) || `novinka-${i + 1}`;
    if (used.has(id)) {
      let k = 2;
      while (used.has(`${id}-${k}`)) k++;
      id = `${id}-${k}`;
    }
    used.add(id);
    return { ...item, id };
  });
  return data;
}

export function buildDefaults() {
  return {
    club: club.club,
    teams: club.teams.map((t) => ({ ...t, ...teamMatch(t.id), players: (t.players || []).map(toPlayer) })),
    homeTexts: club.homeTexts,
    footer: club.footer,
    whyCards: club.whyCards,
    camps: buildCamps(),
    facilities: club.facilities,
    news: normalizeNews({ news: clone(club.news) }).news,
    sponsors: club.sponsors,
    rentalPlans: club.rentalPlans,
    rentalBusyDays: club.rentalBusyDays,
    rentalFaq: club.rentalFaq,
    quickActions: club.quickActions,
    people: club.people,
    cmsStats: club.cmsStats,
    cmsRegistrations: club.cmsRegistrations,
    cmsTodayMatches: club.cmsTodayMatches,
    reservations: club.reservations,
    messages: [], // zprávy z kontaktního formuláře (nové – naplní /api/submit)
  };
}
export const DEFAULTS = buildDefaults();

// zajistí, že každý tým má zápasová pole (+ migrace starých globálních dat na Muži A)
export function normalizeTeams(data, legacy) {
  data.teams = (data.teams || []).map((t) => {
    const def = DEFAULTS.teams.find((d) => d.id === t.id) || {};
    const isA = t.id === 'muziA';
    return {
      ...t,
      players: (t.players || []).map(toPlayer),
      lastMatch: t.lastMatch || def.lastMatch || emptyLastMatch(),
      nextMatch: t.nextMatch || (isA && legacy ? legacy.nextMatch : null) || def.nextMatch || emptyNextMatch(),
      results: t.results || (isA && legacy ? legacy.results : null) || def.results || [],
      table: t.table || (isA && legacy ? legacy.leagueTable : null) || def.table || [],
      facrUrl: t.facrUrl != null ? t.facrUrl : (def.facrUrl || ''),
      matchDetail: t.matchDetail || (isA && legacy ? legacy.matchDetail : null) || def.matchDetail || emptyMatchDetail(),
    };
  });
  delete data.nextMatch; delete data.results; delete data.leagueTable; delete data.matchDetail;
  return data;
}

// doplní do uloženého objektu klíče, které v něm chybí (rekurzivně, jen objekty).
// Díky tomu nerozbije starý uložený obsah nově přidané texty na webu.
const isPlainObject = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
export function fillDefaults(saved, defs) {
  if (!isPlainObject(defs)) return saved === undefined ? clone(defs) : saved;
  if (!isPlainObject(saved)) return clone(defs);
  const out = { ...saved };
  for (const key of Object.keys(defs)) out[key] = fillDefaults(saved[key], defs[key]);
  return out;
}

// sekce, které jsou vnořené objekty s texty — u nich doplňujeme chybějící klíče
const DEEP_SECTIONS = ['homeTexts', 'footer', 'club'];

// sloučí uložený obsah z DB s výchozími hodnotami (aby nové sekce nechyběly)
export function mergeStored(saved) {
  if (!saved || typeof saved !== 'object') return clone(DEFAULTS);
  const merged = normalizeNews(normalizeCamps(normalizeTeams({ ...clone(DEFAULTS), ...saved }, saved), saved));
  for (const key of DEEP_SECTIONS) merged[key] = fillDefaults(merged[key], DEFAULTS[key]);
  if (!Array.isArray(merged.messages)) merged.messages = [];
  return merged;
}
