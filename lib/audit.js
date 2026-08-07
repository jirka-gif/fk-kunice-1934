// =============================================================================
//  FK KUNICE — ZÁZNAM ZMĚN A PŘIHLÁŠENÍ (server only)
//
//  Kdo, kdy a co změnil v administraci nebo přímo na webu, a kdo se kdy
//  přihlásil. Vidí to jen role Super správce (sekce `zaznam`).
//
//  Ukládá se do vlastní tabulky `site_audit`, NIKDY do obsahu webu —
//  ten je veřejný přes GET /api/content a historie i s e-maily do něj nesmí.
//
//  Neukládají se hodnoty polí, jen které části obsahu se změnily. Fotky se
//  v tomhle webu ukládají přímo v obsahu jako data URL, takže „staré a nové
//  hodnoty" by záznam během pár úprav nafoukly na megabajty.
// =============================================================================
import { getStoredAudit, saveStoredAudit } from '@/lib/db';
import { AKCE, AKCE_POPIS } from '@/lib/audit-akce';

export { AKCE, AKCE_POPIS };

// Kolik záznamů se drží. Starší se zahazují, aby úložiště nerostlo donekonečna.
export const MAX_ZAZNAMU = 1000;

export function emptyZaznam() {
  return { id: '', at: '', akce: '', userId: '', userEmail: '', userName: '', detail: '' };
}

// Doplní chybějící pole u starších záznamů, ať se rozhraní nemusí ptát.
export function normalizeZaznamy(data) {
  const list = Array.isArray(data && data.zaznamy) ? data.zaznamy : [];
  return list
    .map((z, i) => {
      const src = z && typeof z === 'object' ? z : {};
      return {
        ...emptyZaznam(),
        ...src,
        id: String(src.id || `z-${i + 1}`),
        at: String(src.at || ''),
        akce: String(src.akce || ''),
        userEmail: String(src.userEmail || ''),
        detail: String(src.detail || ''),
      };
    })
    .slice(0, MAX_ZAZNAMU);
}

export async function ctiZaznamy() {
  return normalizeZaznamy(await getStoredAudit());
}

// Zapíše jeden záznam. Nikdy nevyhodí výjimku — záznam je doplněk, ne
// podmínka. Kdyby zápis selhal, nesmí tím spadnout samotná změna obsahu.
export async function zapisZaznam({ akce, user, detail }) {
  try {
    const zaznamy = await ctiZaznamy();
    const novy = {
      ...emptyZaznam(),
      id: `z-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      at: new Date().toISOString(),
      akce: String(akce || ''),
      userId: String(user?.id || ''),
      userEmail: String(user?.email || ''),
      userName: String(user?.name || ''),
      detail: String(detail || ''),
    };
    await saveStoredAudit({ zaznamy: [novy, ...zaznamy].slice(0, MAX_ZAZNAMU) });
    return novy;
  } catch (err) {
    console.error('[audit] zápis záznamu selhal:', err.message);
    return null;
  }
}
