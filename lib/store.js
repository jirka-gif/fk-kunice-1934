'use client';
// =============================================================================
//  FK KUNICE — CMS STORE (React Context + localStorage)
//  Editovatelná datová vrstva. Naplněná reálnými daty z content/club.js,
//  změny z administrace se ukládají do localStorage. Web i /admin čtou odsud,
//  takže úpravy v adminu se hned projeví na webu (v rámci prohlížeče).
//  Export stáhne JSON pro napojení na reálný backend / headless CMS.
// =============================================================================
import { createContext, useContext, useEffect, useState } from 'react';
import * as club from '@/content/club';

const KEY = 'fk-cms-v1';
const clone = (o) => JSON.parse(JSON.stringify(o));

// prázdné zápasové struktury pro tým bez dat
export function emptyNextMatch() {
  return { home: { short: 'FK', name: 'KUNICE', side: 'Domácí' }, away: { short: '?', name: 'SOUPEŘ', side: 'Hosté' }, when: '', venue: 'Areál Kunice' };
}
export function emptyMatchDetail() {
  return { header: '', when: '', home: { short: 'FK', name: 'KUNICE' }, away: { short: '?', name: 'SOUPEŘ' }, score: { home: 0, away: 0 }, result: 'VÝHRA', events: [], stats: [] };
}
export function emptyLastMatch() {
  return { opp: '', score: '', result: 'VÝHRA', scorers: '' };
}
// zápasová data týmu — Muži A nese detailní data, Žáci U15 jako příklad nižšího týmu, ostatní prázdné
function teamMatch(id) {
  if (id === 'muziA') return {
    nextMatch: club.nextMatch,
    lastMatch: { opp: 'TJ Mnichovice', score: '3:1', result: 'VÝHRA', scorers: 'A. Pokorný, J. Svoboda, F. Veselý' },
    results: club.results, table: club.leagueTable, matchDetail: club.matchDetail,
  };
  if (id === 'zaciU15') return {
    nextMatch: { home: { short: 'FK', name: 'KUNICE', side: 'Domácí' }, away: { short: 'MU', name: 'MUKAŘOV', side: 'Hosté' }, when: 'SO 10:00 · OKRESNÍ PŘEBOR', venue: 'Areál Kunice' },
    lastMatch: { opp: 'Sokol Struhařov', score: '4:1', result: 'VÝHRA', scorers: 'M. Horák 2×, A. Fiala, T. Souček' },
    results: [],
    table: [
      { pos: 1, team: 'FK Kunice U15', gp: 12, pts: 30, me: true },
      { pos: 2, team: 'SK Mukařov U15', gp: 12, pts: 25, me: false },
      { pos: 3, team: 'Sokol Struhařov U15', gp: 12, pts: 21, me: false },
      { pos: 4, team: 'TJ Velké Popovice U15', gp: 12, pts: 16, me: false },
    ],
    matchDetail: emptyMatchDetail(),
  };
  return { nextMatch: emptyNextMatch(), lastMatch: emptyLastMatch(), results: [], table: [], matchDetail: emptyMatchDetail() };
}

// hráč = objekt (jméno, číslo, pozice, fotka, statistiky). Převod ze starého stringu.
const POS_CYCLE = club.posCycle;
export function toPlayer(p, i) {
  const base = { name: '', number: i + 1, position: POS_CYCLE[i % POS_CYCLE.length], photo: '', age: '', apps: '', goals: '', assists: '', since: '', favClub: '', favPlayer: '' };
  if (typeof p === 'string') return { ...base, name: p };
  return { ...base, ...p };
}

function buildDefaults() {
  return {
    club: club.club,
    teams: club.teams.map((t) => ({ ...t, ...teamMatch(t.id), players: (t.players || []).map(toPlayer) })),
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
  };
}
export const DEFAULTS = buildDefaults();

// zajistí, že každý tým má zápasová pole (+ migrace starých globálních dat na Muži A)
function normalizeTeams(data, legacy) {
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
      matchDetail: t.matchDetail || (isA && legacy ? legacy.matchDetail : null) || def.matchDetail || emptyMatchDetail(),
    };
  });
  delete data.nextMatch; delete data.results; delete data.leagueTable; delete data.matchDetail;
  return data;
}

const Ctx = createContext(DEFAULTS);

// --- modulové zrcadlo + updater (umožní imperativní API ze sekcí adminu) ---
let _data = DEFAULTS;
let _apply = null;

function readLS() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw);
    const merged = normalizeTeams({ ...clone(DEFAULTS), ...saved }, saved);
    if ((!merged.reservations || !merged.reservations.length) && Array.isArray(saved.cmsRentalRequests)) {
      merged.reservations = saved.cmsRentalRequests.map((r) => ({ name: r.who || '', contact: '', area: '', date: r.what || '', time: '', note: '', source: 'web', status: 'nová' }));
    }
    delete merged.cmsRentalRequests;
    return merged;
  } catch { return null; }
}
function persist(next) {
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
}
function commit(next) {
  _data = next;
  persist(next);
  if (_apply) _apply(next);
}

// --- veřejné imperativní API ---
export function setSection(key, value) { commit({ ..._data, [key]: value }); }
export function updateData(mutator) { const n = clone(_data); mutator(n); commit(n); }
export function resetData() { commit(clone(DEFAULTS)); }
export function exportJson() { return JSON.stringify(_data, null, 2); }

// --- Provider (obaluje celý web v layoutu) ---
export function ContentProvider({ children }) {
  const [data, setData] = useState(DEFAULTS);
  useEffect(() => {
    _apply = setData;
    const saved = readLS();
    if (saved) { _data = saved; setData(saved); }
    return () => { _apply = null; };
  }, []);
  return <Ctx.Provider value={data}>{children}</Ctx.Provider>;
}

// --- hook: surová editovatelná data (administrace) ---
export function useData() { return useContext(Ctx); }

// --- hook: obsah pro web (+ dopočítané hodnoty a konstanty) ---
export function useContent() {
  const d = useContext(Ctx);
  const playersTotal = d.teams.reduce((s, t) => s + t.players.length, 0);
  const coachesTotal = d.teams.reduce((s, t) => s + t.coaches.length, 0);
  const homeStats = [
    { value: d.club.since || 1934, suffix: '', label: 'Založeno' },
    { value: d.teams.length, suffix: '', label: 'Týmů' },
    { value: playersTotal, suffix: '', label: 'Hráčů' },
    { value: coachesTotal, suffix: '', label: 'Trenérů' },
  ];
  // web zobrazuje zápasy hlavního týmu (Muži A); pro zpětnou kompatibilitu komponent
  const primary = d.teams.find((t) => t.id === 'muziA') || d.teams[0] || {};
  return {
    ...d,
    playersTotal,
    coachesTotal,
    homeStats,
    nextMatch: primary.nextMatch || emptyNextMatch(),
    results: primary.results || [],
    leagueTable: primary.table || [],
    matchDetail: primary.matchDetail || emptyMatchDetail(),
    newsCategories: club.newsCategories,
    ageBase: club.ageBase,
    posCycle: club.posCycle,
  };
}
