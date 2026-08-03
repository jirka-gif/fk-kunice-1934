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

export function buildDefaults() {
  return {
    club: club.club,
    teams: club.teams.map((t) => ({ ...t, ...teamMatch(t.id), players: (t.players || []).map(toPlayer) })),
    homeTexts: club.homeTexts,
    footer: club.footer,
    whyCards: club.whyCards,
    camps: club.camps,
    facilities: club.facilities,
    news: club.news,
    sponsors: club.sponsors,
    campDetail: club.campDetail,
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
  const merged = normalizeTeams({ ...clone(DEFAULTS), ...saved }, saved);
  for (const key of DEEP_SECTIONS) merged[key] = fillDefaults(merged[key], DEFAULTS[key]);
  if (!Array.isArray(merged.messages)) merged.messages = [];
  return merged;
}
