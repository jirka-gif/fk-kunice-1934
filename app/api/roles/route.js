// Správa rolí a jejich oprávnění — jen pro sekci „Uživatelé a role".
//   GET /api/roles → seznam rolí
//   PUT /api/roles → uloží celý seznam rolí (zaškrtávací matice v adminu)
import { NextResponse } from 'next/server';
import { requireEdit } from '@/lib/apiauth';
import { readAuth, writeAuth } from '@/lib/users';
import { normalizePermissions, defaultRoles } from '@/lib/permissions';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const SECTION = 'uzivatele';

export async function GET() {
  const { response } = await requireEdit(SECTION);
  if (response) return response;
  const auth = await readAuth();
  return NextResponse.json({ roles: auth.roles }, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
}

export async function PUT(req) {
  const { response } = await requireEdit(SECTION);
  if (response) return response;

  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Neplatná data' }, { status: 400 }); }
  if (!Array.isArray(body?.roles)) return NextResponse.json({ error: 'Očekáván seznam rolí' }, { status: 400 });

  const auth = await readAuth();
  const roles = body.roles
    .map((r) => ({
      id: String(r.id || '').trim(),
      name: String(r.name || '').trim() || String(r.id || ''),
      description: String(r.description || '').slice(0, 300),
      system: r.id === 'spravce',
      permissions: r.id === 'spravce' ? defaultRoles()[0].permissions : normalizePermissions(r.permissions),
    }))
    .filter((r) => r.id);

  if (!roles.some((r) => r.id === 'spravce')) {
    return NextResponse.json({ error: 'Roli Správce nelze smazat' }, { status: 400 });
  }
  // Role, kterou někdo používá, nesmí zmizet — jinak by přišel o přístup.
  const used = new Set(auth.users.map((u) => u.role));
  const missing = [...used].filter((id) => id && !roles.some((r) => r.id === id));
  if (missing.length) {
    return NextResponse.json({ error: `Roli nelze smazat, používají ji uživatelé: ${missing.join(', ')}` }, { status: 400 });
  }

  auth.roles = roles;
  await writeAuth(auth);
  return NextResponse.json({ ok: true, roles: auth.roles });
}
