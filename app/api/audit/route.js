// GET /api/audit → záznam změn a přihlášení.
//
// Vidí ho jen ten, kdo má právo na sekci `zaznam` — v praxi role Super správce.
// Nikdy se nesmí stát veřejným: obsahuje e-maily uživatelů a historii toho,
// kdo co dělal.
//
// Parametry: ?limit= (výchozí 100, strop 500), ?akce=, ?userId=
import { NextResponse } from 'next/server';
import { requireView } from '@/lib/apiauth';
import { ctiZaznamy } from '@/lib/audit';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const SECTION = 'zaznam';
const VYCHOZI_LIMIT = 100;
const STROP = 500;

export async function GET(req) {
  const { response } = await requireView(SECTION);
  if (response) return response;

  const params = new URL(req.url).searchParams;
  const limit = Math.min(STROP, Math.max(1, Number(params.get('limit')) || VYCHOZI_LIMIT));
  const akce = params.get('akce') || '';
  const userId = params.get('userId') || '';

  let zaznamy = await ctiZaznamy();
  if (akce) zaznamy = zaznamy.filter((z) => z.akce === akce);
  if (userId) zaznamy = zaznamy.filter((z) => z.userId === userId);

  return NextResponse.json(
    { zaznamy: zaznamy.slice(0, limit), celkem: zaznamy.length },
    { headers: { 'Cache-Control': 'no-store, max-age=0' } },
  );
}
