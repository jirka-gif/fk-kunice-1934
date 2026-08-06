// =============================================================================
//  FK KUNICE — DOSTUPNOST TERMÍNŮ PRONÁJMU (běží na serveru i klientu)
//  Čistá logika bez Reactu: z otevírací doby udělá hodinové sloty, z rezervací
//  spočítá, co je zabrané, a řekne, jestli se konkrétní termín ještě dá poptat.
//
//  Pravidlo: termín blokuje rezervace ve stavu „nová" i „potvrzená".
//  Nepotvrzená poptávka tedy drží místo, dokud ji klub nezamítne — jinak by na
//  stejný čas dorazily dvě poptávky a někdo by se dozvěděl, že má smůlu, pozdě.
// =============================================================================

export const BLOCKING_STATUSES = ['nová', 'potvrzená'];

export function emptyRentalSettings() {
  return {
    openFrom: '08:00',   // první slot
    openTo: '22:00',     // konec posledního slotu
    slotMinutes: 60,     // délka jednoho termínu
    leadHours: 24,       // jak dlouho dopředu se musí poptávat
    horizonDays: 120,    // jak daleko dopředu jde poptávat
    closedDays: [],      // úplně zavřené dny (YYYY-MM-DD), např. turnaj
    notifyEmail: '',     // kam poslat upozornění na novou poptávku
  };
}

export function normalizeRentalSettings(value) {
  const base = emptyRentalSettings();
  const s = value && typeof value === 'object' ? value : {};
  const num = (v, def, min, max) => {
    const n = Math.round(Number(v));
    return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : def;
  };
  return {
    ...base,
    ...s,
    openFrom: isTime(s.openFrom) ? s.openFrom : base.openFrom,
    openTo: isTime(s.openTo) ? s.openTo : base.openTo,
    slotMinutes: num(s.slotMinutes, base.slotMinutes, 15, 240),
    leadHours: num(s.leadHours, base.leadHours, 0, 720),
    horizonDays: num(s.horizonDays, base.horizonDays, 1, 730),
    closedDays: Array.isArray(s.closedDays) ? s.closedDays.filter(isDate) : [],
    notifyEmail: String(s.notifyEmail || ''),
  };
}

// --- čas a datum ------------------------------------------------------------
const isTime = (v) => typeof v === 'string' && /^\d{1,2}:\d{2}$/.test(v);
const isDate = (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);

export function toMinutes(time) {
  if (!isTime(time)) return NaN;
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}
export function toTime(minutes) {
  const m = ((Math.round(minutes) % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}
export function dateKey(date) {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d)) return '';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const CZ_MONTHS = ['ledna', 'února', 'března', 'dubna', 'května', 'června', 'července', 'srpna', 'září', 'října', 'listopadu', 'prosince'];
export function czechDate(dateISO) {
  if (!isDate(dateISO)) return '';
  const [y, m, d] = dateISO.split('-').map(Number);
  return `${d}. ${CZ_MONTHS[m - 1]} ${y}`;
}

// --- opakované (dlouhodobé) pronájmy ----------------------------------------
// Dlouhodobý nájem — „každé úterý 18:00 od září do června" — je JEDEN záznam
// s opakováním, ne čtyřicet samostatných. Díky tomu se potvrzuje jednou a v
// administraci se needituje čtyřicet řádků.
//
// Rozvinutí termínů schválně bydlí tady, hned vedle obsazenosti: web, validace
// i kalendář se ptají přes `blockingReservations`, takže opakování vidí všichni
// stejně. Kdyby se počítalo zvlášť v kalendáři, web by nabízel obsazené časy.
export const REPEAT_MODES = ['', 'weekly', 'biweekly'];

export const REPEAT_LABELS = {
  '': 'jednorázově',
  weekly: 'každý týden',
  biweekly: 'každý druhý týden',
};

// Rozdíl dnů přes UTC — přes lokální čas by přechod na letní čas posunul
// výsledek o hodinu a dělení sedmi by u některých termínů nesedělo.
function daysBetween(aISO, bISO) {
  const [ay, am, ad] = aISO.split('-').map(Number);
  const [by, bm, bd] = bISO.split('-').map(Number);
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86400000);
}

// Připadá rezervace na tenhle den? U jednorázové jen shoda data, u opakované
// stejný den v týdnu v rámci období platnosti.
export function occursOn(reservation, dateISO) {
  const r = reservation && typeof reservation === 'object' ? reservation : {};
  if (!isDate(dateISO) || !isDate(r.dateISO)) return false;
  // Vyjmuté dny (prázdniny, turnaj) neplatí ani pro první termín série.
  if (Array.isArray(r.skipDates) && r.skipDates.includes(dateISO)) return false;
  if (r.dateISO === dateISO) return true;
  if (r.repeat !== 'weekly' && r.repeat !== 'biweekly') return false;
  if (dateISO < r.dateISO) return false;
  if (isDate(r.repeatUntil) && dateISO > r.repeatUntil) return false;
  const days = daysBetween(r.dateISO, dateISO);
  if (days <= 0 || days % 7 !== 0) return false;
  if (r.repeat === 'biweekly' && (days / 7) % 2 !== 0) return false;
  return true;
}

// Všechny termíny rezervace v daném rozmezí — podklad pro kalendář.
// Jednorázová vrátí nejvýš jeden den, opakovaná všechny své výskyty.
export function occurrencesInRange(reservations, { fromISO, toISO, area, statuses } = {}) {
  if (!isDate(fromISO) || !isDate(toISO) || toISO < fromISO) return [];
  const allowed = Array.isArray(statuses) ? statuses : BLOCKING_STATUSES;
  const span = daysBetween(fromISO, toISO);
  const out = [];
  for (const r of reservations || []) {
    if (!r || (area && r.area !== area) || !allowed.includes(r.status)) continue;
    for (let i = 0; i <= span; i++) {
      const dateISO = shiftDays(fromISO, i);
      if (occursOn(r, dateISO)) out.push({ dateISO, reservation: r });
    }
  }
  return out.sort((a, b) => (a.dateISO === b.dateISO ? String(a.reservation.from).localeCompare(String(b.reservation.from)) : a.dateISO.localeCompare(b.dateISO)));
}

export function shiftDays(dateISO, days) {
  if (!isDate(dateISO)) return '';
  const [y, m, d] = dateISO.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d) + days * 86400000);
  return `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, '0')}-${String(t.getUTCDate()).padStart(2, '0')}`;
}

// --- sloty ------------------------------------------------------------------
// Všechny termíny dne podle otevírací doby.
export function daySlots(settings) {
  const s = normalizeRentalSettings(settings);
  const from = toMinutes(s.openFrom);
  const to = toMinutes(s.openTo);
  if (!Number.isFinite(from) || !Number.isFinite(to) || to <= from) return [];
  const out = [];
  for (let m = from; m + s.slotMinutes <= to; m += s.slotMinutes) out.push(toTime(m));
  return out;
}

// Rezervace daného dne a plochy, které termín blokují.
// Přes `occursOn`, takže dlouhodobý nájem drží místo ve všech svých termínech.
export function blockingReservations(reservations, area, dateISO) {
  return (reservations || []).filter(
    (r) =>
      r &&
      occursOn(r, dateISO) &&
      (!area || r.area === area) &&
      BLOCKING_STATUSES.includes(r.status),
  );
}

export function bookedTimes(reservations, area, dateISO) {
  return new Set(blockingReservations(reservations, area, dateISO).map((r) => r.from).filter(isTime));
}

// Termín v minulosti (nebo těsně přede dveřmi) se poptat nedá.
export function isTooSoon(dateISO, time, settings, now) {
  const s = normalizeRentalSettings(settings);
  if (!isDate(dateISO) || !isTime(time)) return true;
  const start = new Date(`${dateISO}T${time}:00`);
  if (isNaN(start)) return true;
  const from = now ? new Date(now) : new Date();
  return start.getTime() - from.getTime() < s.leadHours * 3600 * 1000;
}

export function isBeyondHorizon(dateISO, settings, now) {
  const s = normalizeRentalSettings(settings);
  if (!isDate(dateISO)) return true;
  const day = new Date(`${dateISO}T00:00:00`);
  const from = now ? new Date(now) : new Date();
  const diffDays = Math.floor((day.getTime() - new Date(dateKey(from) + 'T00:00:00').getTime()) / 86400000);
  return diffDays > s.horizonDays;
}

export function isClosedDay(dateISO, settings) {
  return normalizeRentalSettings(settings).closedDays.includes(dateISO);
}

// Přehled jednoho dne pro jednu plochu: každý slot s důvodem, proč nejde.
export function dayAvailability({ reservations, area, dateISO, settings, now }) {
  const s = normalizeRentalSettings(settings);
  const all = daySlots(s);
  if (isClosedDay(dateISO, s)) {
    return { dateISO, area, closed: true, slots: all.map((time) => ({ time, free: false, reason: 'zavřeno' })), freeCount: 0, totalCount: all.length };
  }
  const taken = bookedTimes(reservations, area, dateISO);
  const slots = all.map((time) => {
    if (taken.has(time)) return { time, free: false, reason: 'obsazeno' };
    if (isTooSoon(dateISO, time, s, now)) return { time, free: false, reason: 'pozdě' };
    return { time, free: true, reason: '' };
  });
  return { dateISO, area, closed: false, slots, freeCount: slots.filter((x) => x.free).length, totalCount: slots.length };
}

// Stav dne pro obarvení kalendáře.
export function dayState({ reservations, area, dateISO, settings, now }) {
  const s = normalizeRentalSettings(settings);
  if (isClosedDay(dateISO, s)) return 'zavřeno';
  if (isBeyondHorizon(dateISO, s, now)) return 'mimo';
  const { slots, freeCount, totalCount } = dayAvailability({ reservations, area, dateISO, settings: s, now });
  if (!totalCount) return 'zavřeno';
  if (freeCount === 0) {
    // rozlišíme „všechno zabrané" od „den už je za námi"
    return slots.every((x) => x.reason === 'pozdě') ? 'mimo' : 'plno';
  }
  if (freeCount < totalCount) return 'částečně';
  return 'volno';
}

// Poslední slovo před uložením — používá i server, aby dva lidé nepoptali
// stejný termín ve stejnou chvíli.
export function validateRequest({ reservations, area, dateISO, from, settings, now }) {
  const s = normalizeRentalSettings(settings);
  if (!isDate(dateISO)) return { ok: false, error: 'Vyber prosím den.' };
  if (!isTime(from)) return { ok: false, error: 'Vyber prosím čas.' };
  if (!daySlots(s).includes(from)) return { ok: false, error: 'Tenhle čas mimo otevírací dobu nabídnout neumíme.' };
  if (isClosedDay(dateISO, s)) return { ok: false, error: 'V tento den je areál zavřený.' };
  if (isBeyondHorizon(dateISO, s, now)) return { ok: false, error: 'Tak daleko dopředu zatím rezervace nepřijímáme.' };
  if (isTooSoon(dateISO, from, s, now)) return { ok: false, error: `Termín je nutné poptat aspoň ${s.leadHours} hodin předem.` };
  if (bookedTimes(reservations, area, dateISO).has(from)) return { ok: false, error: 'Tento termín je mezitím obsazený. Vyber prosím jiný.' };
  return { ok: true, error: '' };
}

// Konec termínu (do kdy) — dopočítá se z délky slotu.
export function slotEnd(from, settings) {
  const s = normalizeRentalSettings(settings);
  return isTime(from) ? toTime(toMinutes(from) + s.slotMinutes) : '';
}

// --- kalendář ---------------------------------------------------------------
// Mřížka měsíce začínající pondělím; prázdné buňky mají day = null.
export function monthGrid(year, month) {
  const first = new Date(year, month, 1);
  const lead = (first.getDay() + 6) % 7; // pondělí = 0
  const days = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < lead; i++) cells.push({ day: null, dateISO: '' });
  for (let d = 1; d <= days; d++) cells.push({ day: d, dateISO: dateKey(new Date(year, month, d)) });
  while (cells.length % 7 !== 0) cells.push({ day: null, dateISO: '' });
  return cells;
}
