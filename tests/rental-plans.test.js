// Testy sloučeného seznamu hřišť (dřív dva: facilities + rentalPlans).
import { describe, it, expect } from 'vitest';
import { DEFAULTS, mergeStored, normalizeRentalPlans } from '@/lib/defaults';

describe('normalizeRentalPlans', () => {
  it('hřiště, které bylo jen v seznamu pro homepage, se nezahodí', () => {
    const d = normalizeRentalPlans({
      rentalPlans: [{ name: 'Hlavní stadion', price: '1 200 Kč' }],
      facilities: [{ name: 'Hlavní stadion', price: '1 200 Kč' }, { name: 'Umělá tráva', price: '950 Kč' }],
    });
    expect(d.rentalPlans.map((p) => p.name)).toEqual(['Hlavní stadion', 'Umělá tráva']);
  });

  it('stejné hřiště nezdvojí', () => {
    const d = normalizeRentalPlans({
      rentalPlans: [{ name: 'Hlavní stadion' }],
      facilities: [{ name: 'Hlavní stadion' }],
    });
    expect(d.rentalPlans.length).toBe(1);
  });

  it('starý seznam i mrtvé „obsazené dny" z obsahu zmizí', () => {
    const d = normalizeRentalPlans({ rentalPlans: [{ name: 'X' }], facilities: [], rentalBusyDays: [3, 4] });
    expect(d.facilities).toBeUndefined();
    expect(d.rentalBusyDays).toBeUndefined();
  });

  it('doplní chybějící pole a opraví neplatný stav', () => {
    const d = normalizeRentalPlans({ rentalPlans: [{ name: 'X', status: 'nesmysl' }] });
    expect(d.rentalPlans[0]).toEqual({ name: 'X', spec: '', price: '', status: 'VOLNO', img: '', features: [] });
  });

  it('hřiště bez názvu se zahodí', () => {
    expect(normalizeRentalPlans({ rentalPlans: [{ price: '100 Kč' }] }).rentalPlans).toEqual([]);
  });

  it('poškozený vstup nespadne', () => {
    expect(normalizeRentalPlans({}).rentalPlans).toEqual([]);
    expect(normalizeRentalPlans({ rentalPlans: 'nesmysl' }).rentalPlans).toEqual([]);
  });
});

describe('výchozí obsah', () => {
  it('má jeden seznam hřišť a žádné pozůstatky', () => {
    expect(DEFAULTS.rentalPlans.length).toBeGreaterThan(0);
    expect(DEFAULTS.facilities).toBeUndefined();
    expect(DEFAULTS.rentalBusyDays).toBeUndefined();
  });

  it('hřiště se použijí na homepage i v poptávce (stejná jména)', () => {
    const jmena = DEFAULTS.rentalPlans.map((p) => p.name);
    expect(new Set(jmena).size).toBe(jmena.length);
    expect(jmena.length).toBeGreaterThanOrEqual(3);
  });

  it('úprava ceny se uloží', () => {
    const saved = mergeStored({ rentalPlans: [{ name: 'Hlavní stadion', price: '1 500 Kč' }] });
    expect(saved.rentalPlans[0].price).toBe('1 500 Kč');
  });
});

describe('datum z kalendáře (datetime-local)', () => {
  it('kratší zápis bez sekund je pořád platné datum pro odpočet i řazení', () => {
    // `datetime-local` ukládá „2026-07-07T08:00", starší data mají i sekundy
    expect(isNaN(new Date('2026-07-07T08:00'))).toBe(false);
    expect(new Date('2026-07-07T08:00').getTime()).toBe(new Date('2026-07-07T08:00:00').getTime());
  });

  it('oříznutí na 16 znaků nechá hodnotu, kterou prohlížeč zobrazí', () => {
    expect('2026-07-07T08:00:00'.slice(0, 16)).toBe('2026-07-07T08:00');
    expect(''.slice(0, 16)).toBe('');
  });
});
