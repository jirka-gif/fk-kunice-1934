// POST /api/social  { id } → odešle příspěvek na vybrané sítě přes Meta Graph API.
// Chráněno oprávněním na sekci „Sociální sítě". Výsledek (i chyba) se zapíše
// do historie příspěvku, aby bylo v adminu vidět, co se stalo.
import { NextResponse } from 'next/server';
import { getStoredContent, saveStoredContent } from '@/lib/db';
import { DEFAULTS, mergeStored, clone } from '@/lib/defaults';
import { requireEdit } from '@/lib/apiauth';
import { buildOgUrl, withHistory } from '@/lib/social';
import { publishPost } from '@/lib/meta';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const SECTION = 'socialni';

// Meta si obrázek stahuje sama → potřebuje veřejnou adresu, ne localhost.
function siteUrl(req) {
  const fromEnv = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || '';
  if (fromEnv) return fromEnv.replace(/\/+$/, '');
  return new URL(req.url).origin;
}

export async function POST(req) {
  const { response } = await requireEdit(SECTION);
  if (response) return response;

  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Neplatná data' }, { status: 400 }); }

  const stored = await getStoredContent();
  const content = stored ? mergeStored(stored) : clone(DEFAULTS);
  const post = content.socialPosts.find((p) => p.id === String(body?.id || ''));
  if (!post) return NextResponse.json({ error: 'Příspěvek nenalezen' }, { status: 404 });

  const maxAttempts = content.socialSettings.maxAttempts;
  if ((post.attempts || 0) >= maxAttempts) {
    return NextResponse.json({ error: `Příspěvek už selhal ${post.attempts}× — uprav ho a zkus znovu.` }, { status: 400 });
  }

  const imageUrl = buildOgUrl(post.visual, siteUrl(req), post.id);
  const { results, ok } = await publishPost(post, imageUrl);

  let updated = { ...post, attempts: (post.attempts || 0) + 1, status: ok ? 'odesláno' : 'chyba' };
  updated.lastError = ok ? '' : results.filter((r) => !r.ok).map((r) => `${r.target}: ${r.message}`).join(' · ');
  for (const entry of results) updated = withHistory(updated, entry);

  content.socialPosts = content.socialPosts.map((p) => (p.id === post.id ? updated : p));
  await saveStoredContent(content);

  return NextResponse.json({ ok, post: updated, imageUrl }, { status: ok ? 200 : 502 });
}
