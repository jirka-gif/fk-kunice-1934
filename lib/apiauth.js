// =============================================================================
//  FK KUNICE — POMOCNÍK PRO CHRÁNĚNÁ API (server only)
//  Z cookie zjistí přihlášeného uživatele a jeho oprávnění. Každé chráněné
//  API si zavolá requireUser() / requireEdit() a při odmítnutí vrátí odpověď.
// =============================================================================
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { SESSION_COOKIE, sessionUserId } from '@/lib/auth';
import { currentUser } from '@/lib/users';
import { canEdit, canView } from '@/lib/permissions';

export const unauthorized = () => NextResponse.json({ error: 'Nepřihlášeno' }, { status: 401 });
export const forbidden = (detail) =>
  NextResponse.json({ error: 'K této akci nemáš oprávnění', ...(detail || {}) }, { status: 403 });

// Vrátí { user, roles, permissions } přihlášeného uživatele, nebo null.
export async function getSession() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  const uid = await sessionUserId(token);
  if (!uid) return null;
  return currentUser(uid);
}

// Session, nebo rovnou odpověď 401 (vracíme dvojici, ať se to dobře čte).
export async function requireUser() {
  const session = await getSession();
  if (!session) return { session: null, response: unauthorized() };
  return { session, response: null };
}

// Session s právem editovat danou sekci, jinak 401 / 403.
export async function requireEdit(sectionId) {
  const { session, response } = await requireUser();
  if (!session) return { session: null, response };
  if (!canEdit(session.permissions, sectionId)) return { session, response: forbidden({ section: sectionId }) };
  return { session, response: null };
}

// Session s právem alespoň prohlížet danou sekci.
export async function requireView(sectionId) {
  const { session, response } = await requireUser();
  if (!session) return { session: null, response };
  if (!canView(session.permissions, sectionId)) return { session, response: forbidden({ section: sectionId }) };
  return { session, response: null };
}
