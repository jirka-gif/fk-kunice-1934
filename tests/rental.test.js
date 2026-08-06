// Testy dostupnosti termínů pronájmu — čistá logika, žádný server.
import { describe, it, expect } from 'vitest';
import {
  emptyRentalSettings, normalizeRentalSettings, daySlots, bookedTimes, blockingReservations,
  dayAvailability, dayState, validateRequest, slotEnd, monthGrid, dateKey, czechDate,
  toMinutes, toTime, isTooSoon, isBeyondHorizon,
  occursOn, occurrencesInRange, shiftDays,
} from '@/lib/rental';

const NOW = '2026-07-01T09:00:00';
const S = { ...emptyRentalSettings(), openFrom: '08:00', openTo: '12:00', slotMinutes: 60, leadHours: 24 };

const rez = (over = {}) => ({
  name: 'Kdosi', area: 'Hlavní stadion', dateISO: '2026-07-10', from: '09:00', to: '10:00',
  status: 'nová', source: 'web', ...over,
});

describe('nastavení', () => {
  it('opraví nesmysly a drží hodnoty v rozumných mezích', () => {
    const s = normalizeRentalSettings({ openFrom: 'ráno', slotMinutes: 5000, leadHours: -3, closedDays: ['blbost', '2026-07-04'] });
    expect(s.openFrom).toBe('08:00');
    expect(s.slotMinutes).toBe(240);
    expect(s.leadHours).toBe(0);
    expect(s.closedDays).toEqual(['2026-07-04']);
  });

  it('prázdný vstup dá výchozí nastavení', () => {
    expect(normalizeRentalSettings(null)).toEqual(emptyRentalSettings());
  });
});

describe('čas', () => {
  it('převádí tam a zpět', () => {
    expect(toMinutes('08:30')).toBe(510);
    expect(toTime(510)).toBe('08:30');
    expect(toMinutes('nesmysl')).toBeNaN();
  });
  it('dateKey a český zápis data', () => {
    expect(dateKey(new Date(2026, 6, 4))).toBe('2026-07-04');
    expect(czechDate('2026-07-04')).toBe('4. července 2026');
    expect(czechDate('blbost')).toBe('');
  });
});

describe('daySlots', () => {
  it('nakrájí otevírací dobu na termíny', () => {
    expect(daySlots(S)).toEqual(['08:00', '09:00', '10:00', '11:00']);
  });
  it('poslední termín se musí do otevírací doby vejít celý', () => {
    expect(daySlots({ ...S, openTo: '11:30' })).toEqual(['08:00', '09:00', '10:00']);
  });
  it('půlhodinové termíny', () => {
    expect(daySlots({ ...S, openTo: '09:30', slotMinutes: 30 })).toEqual(['08:00', '08:30', '09:00']);
  });
  it('nesmyslná otevírací doba nevrátí nic', () => {
    expect(daySlots({ ...S, openFrom: '20:00', openTo: '08:00' })).toEqual([]);
  });
});

describe('obsazenost', () => {
  const reservations = [
    rez({ from: '09:00', status: 'nová' }),
    rez({ from: '10:00', status: 'potvrzená' }),
    rez({ from: '11:00', status: 'zamítnutá' }),
    rez({ from: '08:00', area: 'Umělá tráva' }),
    rez({ from: '08:00', dateISO: '2026-07-11' }),
  ];

  it('blokuje nová i potvrzená, zamítnutá ne', () => {
    expect([...bookedTimes(reservations, 'Hlavní stadion', '2026-07-10')].sort()).toEqual(['09:00', '10:00']);
  });

  it('nemíchá plochy ani dny', () => {
    expect(bookedTimes(reservations, 'Umělá tráva', '2026-07-10').has('08:00')).toBe(true);
    expect(bookedTimes(reservations, 'Hlavní stadion', '2026-07-10').has('08:00')).toBe(false);
    expect(bookedTimes(reservations, 'Hlavní stadion', '2026-07-11').has('08:00')).toBe(true);
  });

  it('bez zadané plochy bere všechny', () => {
    expect(blockingReservations(reservations, '', '2026-07-10').length).toBe(3);
  });

  it('poškozený seznam nespadne', () => {
    expect(bookedTimes(null, 'X', '2026-07-10').size).toBe(0);
    expect(bookedTimes([null, {}], 'X', '2026-07-10').size).toBe(0);
  });
});

describe('dayAvailability', () => {
  const reservations = [rez({ from: '09:00' })];

  it('označí obsazené termíny a spočítá volné', () => {
    const d = dayAvailability({ reservations, area: 'Hlavní stadion', dateISO: '2026-07-10', settings: S, now: NOW });
    expect(d.totalCount).toBe(4);
    expect(d.freeCount).toBe(3);
    expect(d.slots.find((x) => x.time === '09:00')).toMatchObject({ free: false, reason: 'obsazeno' });
    expect(d.slots.find((x) => x.time === '08:00').free).toBe(true);
  });

  it('dnešní termíny těsně přede dveřmi nenabídne', () => {
    const d = dayAvailability({ reservations: [], area: 'X', dateISO: '2026-07-01', settings: S, now: NOW });
    expect(d.freeCount).toBe(0);
    expect(d.slots.every((x) => x.reason === 'pozdě')).toBe(true);
  });

  it('zavřený den nenabídne vůbec nic', () => {
    const d = dayAvailability({ reservations: [], area: 'X', dateISO: '2026-07-04', settings: { ...S, closedDays: ['2026-07-04'] }, now: NOW });
    expect(d.closed).toBe(true);
    expect(d.freeCount).toBe(0);
  });
});

describe('dayState — barva dne v kalendáři', () => {
  const call = (over) => dayState({ reservations: [], area: 'Hlavní stadion', settings: S, now: NOW, ...over });

  it('volný den', () => {
    expect(call({ dateISO: '2026-07-10' })).toBe('volno');
  });
  it('částečně obsazený den', () => {
    expect(call({ dateISO: '2026-07-10', reservations: [rez({ from: '09:00' })] })).toBe('částečně');
  });
  it('plně obsazený den', () => {
    const all = ['08:00', '09:00', '10:00', '11:00'].map((from) => rez({ from }));
    expect(call({ dateISO: '2026-07-10', reservations: all })).toBe('plno');
  });
  it('zavřený den', () => {
    expect(call({ dateISO: '2026-07-04', settings: { ...S, closedDays: ['2026-07-04'] } })).toBe('zavřeno');
  });
  it('den v minulosti i příliš daleko dopředu je mimo', () => {
    expect(call({ dateISO: '2026-06-30' })).toBe('mimo');
    expect(call({ dateISO: '2027-06-30' })).toBe('mimo');
  });
});

describe('validateRequest — poslední kontrola před uložením', () => {
  const base = { reservations: [rez({ from: '09:00' })], area: 'Hlavní stadion', settings: S, now: NOW };

  it('volný termín projde', () => {
    expect(validateRequest({ ...base, dateISO: '2026-07-10', from: '08:00' })).toEqual({ ok: true, error: '' });
  });

  it('obsazený termín neprojde', () => {
    const r = validateRequest({ ...base, dateISO: '2026-07-10', from: '09:00' });
    expect(r.ok).toBe(false);
    expect(r.error).toContain('obsazený');
  });

  it('nepotvrzená poptávka drží místo stejně jako potvrzená', () => {
    const r = validateRequest({ ...base, reservations: [rez({ from: '08:00', status: 'nová' })], dateISO: '2026-07-10', from: '08:00' });
    expect(r.ok).toBe(false);
  });

  it('zamítnutá rezervace místo neblokuje', () => {
    const r = validateRequest({ ...base, reservations: [rez({ from: '08:00', status: 'zamítnutá' })], dateISO: '2026-07-10', from: '08:00' });
    expect(r.ok).toBe(true);
  });

  it('čas mimo otevírací dobu neprojde', () => {
    expect(validateRequest({ ...base, dateISO: '2026-07-10', from: '23:00' }).ok).toBe(false);
  });

  it('termín v minulosti neprojde', () => {
    const r = validateRequest({ ...base, dateISO: '2026-06-20', from: '08:00' });
    expect(r.ok).toBe(false);
  });

  it('zavřený den neprojde', () => {
    const r = validateRequest({ ...base, dateISO: '2026-07-04', from: '08:00', settings: { ...S, closedDays: ['2026-07-04'] } });
    expect(r.error).toContain('zavřený');
  });

  it('chybějící den nebo čas hlásí, co doplnit', () => {
    expect(validateRequest({ ...base, dateISO: '', from: '08:00' }).error).toContain('den');
    expect(validateRequest({ ...base, dateISO: '2026-07-10', from: '' }).error).toContain('čas');
  });
});

describe('pomocné', () => {
  it('slotEnd dopočítá konec termínu', () => {
    expect(slotEnd('09:00', S)).toBe('10:00');
    expect(slotEnd('09:00', { ...S, slotMinutes: 90 })).toBe('10:30');
    expect(slotEnd('', S)).toBe('');
  });

  it('isTooSoon a isBeyondHorizon', () => {
    expect(isTooSoon('2026-07-01', '10:00', S, NOW)).toBe(true);
    expect(isTooSoon('2026-07-05', '10:00', S, NOW)).toBe(false);
    expect(isBeyondHorizon('2026-07-05', S, NOW)).toBe(false);
    expect(isBeyondHorizon('2027-07-05', S, NOW)).toBe(true);
  });

  it('monthGrid začíná pondělím a doplní se do celých týdnů', () => {
    const cells = monthGrid(2026, 6); // červenec 2026 začíná ve středu
    expect(cells.length % 7).toBe(0);
    expect(cells[0].day).toBe(null);
    expect(cells[2].day).toBe(1);
    expect(cells[2].dateISO).toBe('2026-07-01');
    expect(cells.filter((c) => c.day).length).toBe(31);
  });
});

// --- dlouhodobé (opakované) pronájmy ----------------------------------------
// Klíčové je, že opakování zná `blockingReservations` — přes ně počítá
// obsazenost web i validace na serveru. Kdyby to uměl jen kalendář,
// web by nabízel termíny, které má dlouhodobý nájemce zabrané.
describe('opakované pronájmy', () => {
  const tydenni = rez({ dateISO: '2026-09-01', repeat: 'weekly', repeatUntil: '2026-09-29' });

  it('platí ve stejný den v týdnu v rámci období', () => {
    expect(occursOn(tydenni, '2026-09-01')).toBe(true);   // první termín
    expect(occursOn(tydenni, '2026-09-08')).toBe(true);
    expect(occursOn(tydenni, '2026-09-29')).toBe(true);   // poslední den období
  });

  it('neplatí jiný den v týdnu, před začátkem ani po konci', () => {
    expect(occursOn(tydenni, '2026-09-02')).toBe(false);  // středa místo úterý
    expect(occursOn(tydenni, '2026-08-25')).toBe(false);  // před prvním termínem
    expect(occursOn(tydenni, '2026-10-06')).toBe(false);  // za obdobím
  });

  it('jednorázová rezervace platí jen svůj den', () => {
    const jednou = rez({ dateISO: '2026-09-01' });
    expect(occursOn(jednou, '2026-09-01')).toBe(true);
    expect(occursOn(jednou, '2026-09-08')).toBe(false);
  });

  it('každý druhý týden přeskakuje liché týdny', () => {
    const sude = rez({ dateISO: '2026-09-01', repeat: 'biweekly', repeatUntil: '2026-10-31' });
    expect(occursOn(sude, '2026-09-15')).toBe(true);
    expect(occursOn(sude, '2026-09-08')).toBe(false);
  });

  it('bez data konce běží dál do budoucna', () => {
    const bezKonce = rez({ dateISO: '2026-09-01', repeat: 'weekly', repeatUntil: '' });
    expect(occursOn(bezKonce, '2027-03-02')).toBe(true);
  });

  it('vyjmutý den neplatí ani jako první termín série', () => {
    const sVyjimkou = { ...tydenni, skipDates: ['2026-09-08', '2026-09-01'] };
    expect(occursOn(sVyjimkou, '2026-09-08')).toBe(false);
    expect(occursOn(sVyjimkou, '2026-09-01')).toBe(false);
    expect(occursOn(sVyjimkou, '2026-09-15')).toBe(true);
  });

  it('drží termín i v dalších týdnech, takže ho web už nenabídne', () => {
    const list = [tydenni];
    expect(bookedTimes(list, 'Hlavní stadion', '2026-09-08').has('09:00')).toBe(true);
    const kolize = validateRequest({
      reservations: list, area: 'Hlavní stadion', dateISO: '2026-09-08', from: '09:00',
      settings: S, now: '2026-09-01T09:00:00',
    });
    expect(kolize.ok).toBe(false);
  });

  it('zamítnutá série termín nedrží', () => {
    const zamitnuta = [{ ...tydenni, status: 'zamítnutá' }];
    expect(bookedTimes(zamitnuta, 'Hlavní stadion', '2026-09-08').size).toBe(0);
  });
});

describe('rozvinutí termínů pro kalendář', () => {
  it('vrátí všechny výskyty v rozmezí, seřazené podle data', () => {
    const list = [rez({ dateISO: '2026-09-01', repeat: 'weekly', repeatUntil: '2026-09-30' })];
    const vyskyty = occurrencesInRange(list, { fromISO: '2026-09-01', toISO: '2026-09-30' });
    expect(vyskyty.map((v) => v.dateISO)).toEqual(['2026-09-01', '2026-09-08', '2026-09-15', '2026-09-22', '2026-09-29']);
  });

  it('filtruje podle plochy a nechává jen blokující stavy', () => {
    const list = [
      rez({ dateISO: '2026-09-01', area: 'Hlavní stadion' }),
      rez({ dateISO: '2026-09-01', area: 'Sál', status: 'zamítnutá' }),
    ];
    expect(occurrencesInRange(list, { fromISO: '2026-09-01', toISO: '2026-09-07', area: 'Sál' })).toHaveLength(0);
    expect(occurrencesInRange(list, { fromISO: '2026-09-01', toISO: '2026-09-07', area: 'Hlavní stadion' })).toHaveLength(1);
  });

  it('posun dnů nerozbije přechod na letní čas', () => {
    expect(shiftDays('2026-03-28', 1)).toBe('2026-03-29');
    expect(shiftDays('2026-03-29', 1)).toBe('2026-03-30');
    expect(shiftDays('2026-12-31', 1)).toBe('2027-01-01');
  });
});
