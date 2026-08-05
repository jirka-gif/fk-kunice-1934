// GET /api/availability?area=…&month=YYYY-MM   → stav dnů v měsíci (barvy v kalendáři)
// GET /api/availability?area=…&date=YYYY-MM-DD → termíny dne (volné / obsazené)
//
// Veřejné, ale vrací POUZE časy a stavy — nikdy jména ani kontakty z rezervací.
// Kdo si co rezervoval, patří do administrace, ne na web.
import { NextResponse } from 'next/server';
import { getStoredContent } from '@/lib/db';
import { DEFAULTS, mergeStored } from '@/lib/defaults';
import { dayAvailability, dayState, monthGrid, daySlots } from '@/lib/rental';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const isMonth = (v) => /^\d{4}-\d{2}$/.test(String(v || ''));
const isDate = (v) => /^\d{4}-\d{2}-\d{2}$/.test(String(v || ''));

export async function GET(req) {
  const p = new URL(req.url).searchParams;
  const area = p.get('area') || '';
  const month = p.get('month') || '';
  const date = p.get('date') || '';

  const stored = await getStoredContent();
  const content = stored ? mergeStored(stored) : DEFAULTS;
  const { reservations, rentalSettings: settings } = content;
  const noCache = { 'Cache-Control': 'no-store, max-age=0' };

  if (isDate(date)) {
    const day = dayAvailability({ reservations, area, dateISO: date, settings });
    return NextResponse.json(
      {
        date,
        area,
        closed: day.closed,
        freeCount: day.freeCount,
        totalCount: day.totalCount,
        // ven jde jen čas + jestli je volno, nic víc
        slots: day.slots.map((s) => ({ time: s.time, free: s.free, reason: s.reason })),
      },
      { headers: noCache },
    );
  }

  if (isMonth(month)) {
    const [year, m] = month.split('-').map(Number);
    const days = monthGrid(year, m - 1)
      .filter((c) => c.day)
      .map((c) => ({ date: c.dateISO, state: dayState({ reservations, area, dateISO: c.dateISO, settings }) }));
    return NextResponse.json({ month, area, days, slotCount: daySlots(settings).length }, { headers: noCache });
  }

  return NextResponse.json({ error: 'Zadej month=YYYY-MM nebo date=YYYY-MM-DD' }, { status: 400 });
}
