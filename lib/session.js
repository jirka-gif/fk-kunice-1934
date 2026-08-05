'use client';
// =============================================================================
//  FK KUNICE — KDO JE PŘIHLÁŠENÝ (na veřejném webu)
//  Web se jednou zeptá /api/me. Nepřihlášený návštěvník dostane 401 a nic se
//  nestane — jen se nezobrazí režim úprav. Přihlášenému s právem na texty
//  se objeví tlačítko, kterým může texty přepisovat rovnou na stránce.
// =============================================================================
import { createContext, useContext, useEffect, useState } from 'react';
import { canEdit } from '@/lib/permissions';

const Ctx = createContext({ user: null, editMode: false, setEditMode: () => {}, muzeUpravit: () => false });

export function SessionProvider({ children }) {
  const [user, setUser] = useState(null);
  // z administrace se dá přijít odkazem /?upravy=1 — rovnou v režimu úprav
  const [editMode, setEditMode] = useState(false);
  useEffect(() => {
    try {
      if (new URLSearchParams(window.location.search).get('upravy') === '1') setEditMode(true);
    } catch {}
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch('/api/me', { cache: 'no-store' });
        if (!res.ok) return; // nepřihlášený návštěvník — konec, web běží dál
        const data = await res.json();
        if (alive) setUser(data.user);
      } catch {
        // offline nebo výpadek API: web se chová jako pro návštěvníka
      }
    })();
    return () => { alive = false; };
  }, []);

  // smí tenhle člověk přepsat text, který patří dané sekci administrace?
  const muzeUpravit = (sekce) => !!user && canEdit(user.permissions, sekce);

  return (
    <Ctx.Provider value={{ user, editMode, setEditMode, muzeUpravit }}>
      {children}
    </Ctx.Provider>
  );
}

export function useSession() {
  return useContext(Ctx);
}
