// GET /api/inbox → kolik věcí čeká na vyřízení.
//
// Administrace si obsah načte při otevření stránky a sama se neaktualizuje.
// Poptávka, která dorazí potom, tak není vidět až do ručního obnovení. Tímhle
// se administrace po návratu na záložku zeptá, jestli něco nepřibylo.
//
// Vrací **jen počty**. Jména, e-maily ani telefony sem nepatří — stejné pravidlo
// jako u veřejné dostupnosti termínů (app/api/availability). Kontakty se čtou
// jedině po otevření příslušné sekce administrace.
import { NextResponse } from 'next/server';
import { getStoredContent } from '@/lib/db';
import { DEFAULTS, mergeStored, clone } from '@/lib/defaults';
import { requireUser } from '@/lib/apiauth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const pocet = (seznam, jeCekajici) => (Array.isArray(seznam) ? seznam.filter(jeCekajici).length : 0);

export async function GET() {
  const { response } = await requireUser();
  if (response) return response;

  const stored = await getStoredContent();
  const content = stored ? mergeStored(stored) : clone(DEFAULTS);

  return NextResponse.json(
    {
      // Stejná pravidla jako v přehledu administrace, ať čísla nesedí jinak.
      reservations: pocet(content.reservations, (r) => r.status === 'nová'),
      messages: pocet(content.messages, (m) => m.status !== 'vyřízená'),
      registrations: pocet(content.cmsRegistrations, (r) => r.status === 'nová'),
      proposals: pocet(content.matchProposals, (p) => p.status === 'nová'),
    },
    { headers: { 'Cache-Control': 'no-store, max-age=0' } },
  );
}
