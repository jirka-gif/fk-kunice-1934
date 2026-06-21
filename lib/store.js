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

function buildDefaults() {
  return {
    club: club.club,
    teams: club.teams,
    nextMatch: club.nextMatch,
    results: club.results,
    leagueTable: club.leagueTable,
    whyCards: club.whyCards,
    camps: club.camps,
    facilities: club.facilities,
    homeNews: club.homeNews,
    sponsors: club.sponsors,
    matchDetail: club.matchDetail,
    campDetail: club.campDetail,
    rentalPlans: club.rentalPlans,
    rentalBusyDays: club.rentalBusyDays,
    rentalFaq: club.rentalFaq,
    articles: club.articles,
    quickActions: club.quickActions,
    people: club.people,
    cmsStats: club.cmsStats,
    cmsRegistrations: club.cmsRegistrations,
    cmsTodayMatches: club.cmsTodayMatches,
    cmsRentalRequests: club.cmsRentalRequests,
  };
}
export const DEFAULTS = buildDefaults();

const Ctx = createContext(DEFAULTS);

// --- modulové zrcadlo + updater (umožní imperativní API ze sekcí adminu) ---
let _data = DEFAULTS;
let _apply = null;

function readLS() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return { ...clone(DEFAULTS), ...JSON.parse(raw) };
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
  return {
    ...d,
    playersTotal,
    coachesTotal,
    homeStats,
    newsCategories: club.newsCategories,
    ageBase: club.ageBase,
    posCycle: club.posCycle,
  };
}
