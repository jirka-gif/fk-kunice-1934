// POST /api/matches → příjem návrhů zápasů ze scraperu (GitHub Actions).
//   Chráněno tajným tokenem v hlavičce `x-scraper-token` (proměnná MATCHES_TOKEN).
//   Návrhy se NIKDY nepropisují na web samy — čekají na schválení v administraci.
//   Tělo: { proposals: [{ teamId, teamName, sourceUrl, warnings, data }], error? }
import { NextResponse } from 'next/server';
import { getStoredContent, saveStoredContent } from '@/lib/db';
import { DEFAULTS, mergeStored, clone, emptyProposal } from '@/lib/defaults';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MAX_PROPOSALS = 200;
const s = (v, max = 300) => (typeof v === 'string' ? v.slice(0, max) : '');

// Token musí být nastavený — bez něj endpoint nikoho nepustí.
function tokenOk(req) {
  const expected = process.env.MATCHES_TOKEN || '';
  if (!expected) return false;
  const got = req.headers.get('x-scraper-token') || '';
  if (got.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < got.length; i++) diff |= got.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}

export async function POST(req) {
  if (!tokenOk(req)) {
    return NextResponse.json({ error: 'Neplatný token' }, { status: 401 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Neplatná data' }, { status: 400 });
  }

  const stored = await getStoredContent();
  const content = stored ? mergeStored(stored) : clone(DEFAULTS);
  const now = new Date().toISOString();

  const incoming = Array.isArray(body?.proposals) ? body.proposals : [];
  const created = [];
  for (const p of incoming) {
    const teamId = s(p?.teamId, 60);
    if (!teamId) continue;
    const warnings = Array.isArray(p?.warnings) ? p.warnings.map((w) => s(w, 200)).slice(0, 10) : [];
    created.push({
      ...emptyProposal(),
      id: `${teamId}-${now}`,
      teamId,
      teamName: s(p?.teamName, 120),
      sourceUrl: s(p?.sourceUrl, 400),
      createdAt: now,
      status: 'nová',
      warnings,
      data: {
        nextMatch: p?.data?.nextMatch || null,
        lastMatch: p?.data?.lastMatch || null,
        table: Array.isArray(p?.data?.table) ? p.data.table.slice(0, 40) : [],
      },
    });
  }

  // Nový návrh nahradí starší nevyřízený návrh pro stejný tým — ať se v adminu
  // nehromadí čtyři stejné položky týdně.
  const kept = (content.matchProposals || []).filter(
    (p) => !(p.status === 'nová' && created.some((c) => c.teamId === p.teamId)),
  );
  content.matchProposals = [...created, ...kept].slice(0, MAX_PROPOSALS);

  const failed = !!body?.error || created.length === 0;
  content.matchesSync = {
    lastRunAt: now,
    lastOkAt: failed ? (content.matchesSync?.lastOkAt || '') : now,
    status: failed ? 'chyba' : 'ok',
    message: s(body?.error, 400) || (created.length === 0 ? 'Skript neposlal žádná data.' : ''),
    teams: incoming.map((p) => ({
      teamId: s(p?.teamId, 60),
      teamName: s(p?.teamName, 120),
      warnings: Array.isArray(p?.warnings) ? p.warnings.map((w) => s(w, 200)).slice(0, 10) : [],
    })),
  };

  await saveStoredContent(content);
  return NextResponse.json({ ok: true, created: created.length, status: content.matchesSync.status });
}
