'use client';
// =============================================================================
//  FK KUNICE — CMS STORE (React Context + server API)
//  Editovatelná datová vrstva. Web i /admin čtou odsud.
//  - Načítá obsah ze serveru: GET /api/content (uložený v DB, jinak výchozí).
//  - Změny z administrace ukládá na server: PUT /api/content (jen přihlášený).
//  - localStorage slouží jen jako rychlá offline mezipaměť (fallback).
//  Export stáhne JSON (záloha / migrace).
// =============================================================================
import { createContext, useContext, useEffect, useState } from 'react';
import * as club from '@/content/club';
import { DEFAULTS, mergeStored, clone, emptyNextMatch, emptyMatchDetail, emptyLastMatch, emptyCamp, emptyNews, slugify, emptyOpponent, opponentKey, collectOpponentNames, cleanClubName, emptySponsor, emptyGalleryItem, emptyReservation, emptyRegistration } from '@/lib/defaults';

const KEY = 'fk-cms-cache-v2';

// re-export pro zpětnou kompatibilitu
export { emptyNextMatch, emptyMatchDetail, emptyLastMatch, emptyCamp, emptyNews, slugify, emptyOpponent, opponentKey, collectOpponentNames, cleanClubName, emptySponsor, emptyGalleryItem, emptyReservation, emptyRegistration, DEFAULTS };

const Ctx = createContext(DEFAULTS);

// --- modulové zrcadlo + updater (umožní imperativní API ze sekcí adminu) ---
let _data = DEFAULTS;
let _apply = null;
let _saveTimer = null;

function readCache() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return mergeStored(JSON.parse(raw));
  } catch { return null; }
}
function writeCache(next) {
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
}

// --- stav ukládání (administrace ho ukazuje uživateli) ---
const _saveListeners = new Set();
export function onSaveStatus(fn) { _saveListeners.add(fn); return () => _saveListeners.delete(fn); }
function emitSave(status) { _saveListeners.forEach((fn) => { try { fn(status); } catch {} }); }

// odešle aktuální obsah na server (debounce, ať se to neposílá na každý úhoz)
function scheduleServerSave() {
  if (typeof window === 'undefined') return;
  if (_saveTimer) clearTimeout(_saveTimer);
  emitSave({ state: 'pending' });
  _saveTimer = setTimeout(async () => {
    emitSave({ state: 'saving' });
    try {
      const res = await fetch('/api/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(_data),
      });
      if (res.ok) { emitSave({ state: 'saved' }); return; }
      const data = await res.json().catch(() => ({}));
      emitSave({
        state: 'error',
        message: res.status === 403
          ? (data.error || 'K úpravě této části webu nemáš oprávnění.')
          : res.status === 401
            ? 'Přihlášení vypršelo. Přihlas se prosím znovu.'
            : (data.error || 'Uložení na server se nezdařilo.'),
        status: res.status,
      });
    } catch (e) {
      // offline změna zůstane v mezipaměti a odešle se při další úpravě
      console.warn('[store] uložení na server se nezdařilo:', e?.message);
      emitSave({ state: 'error', message: 'Server je nedostupný — změna zůstala jen v prohlížeči.' });
    }
  }, 700);
}

function commit(next) {
  _data = next;
  writeCache(next);
  if (_apply) _apply(next);
  scheduleServerSave();
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
    let alive = true;
    // 1) rychle nasadit mezipaměť (kdyby byl server pomalý / offline)
    const cached = readCache();
    if (cached) { _data = cached; setData(cached); }
    // 2) načíst zdroj pravdy ze serveru
    (async () => {
      try {
        const res = await fetch('/api/content', { cache: 'no-store' });
        if (!res.ok) return;
        const json = await res.json();
        if (!alive) return;
        const merged = mergeStored(json);
        _data = merged;
        writeCache(merged);
        setData(merged);
      } catch {
        // zůstane mezipaměť / DEFAULTS
      }
    })();
    return () => { alive = false; _apply = null; };
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
