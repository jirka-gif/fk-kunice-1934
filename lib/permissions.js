// =============================================================================
//  FK KUNICE — SEKCE ADMINU, ROLE A OPRÁVNĚNÍ (běží na serveru i klientu)
//  Oprávnění se nastavuje po sekcích administrace ve třech úrovních:
//    'none' (nevidí) → 'view' (vidí, needituje) → 'edit' (vidí i edituje).
//  Server podle stejné mapy kontroluje, které části obsahu smí uživatel uložit.
// =============================================================================

export const LEVELS = ['none', 'view', 'edit'];
export const LEVEL_LABELS = { none: 'Nevidí', view: 'Jen prohlížet', edit: 'Může upravovat' };

// Sekce v levém menu administrace (pořadí = pořadí v menu).
export const ADMIN_SECTIONS = [
  { id: 'prehled', label: 'Přehled', icon: 'dashboard' },
  { id: 'domu', label: 'Texty a fotky', icon: 'news' },
  { id: 'tymy', label: 'Týmy', icon: 'teams' },
  { id: 'zapasy', label: 'Zápasy', icon: 'ball' },
  { id: 'novinky', label: 'Novinky', icon: 'news' },
  { id: 'kempy', label: 'Kempy', icon: 'tent' },
  { id: 'pronajem', label: 'Pronájem', icon: 'stadium' },
  { id: 'kontakt', label: 'Kontakt', icon: 'mail' },
  { id: 'zpravy', label: 'Zprávy', icon: 'mail' },
  { id: 'partneri', label: 'Partneři', icon: 'partners' },
  { id: 'registrace', label: 'Přihlášky', icon: 'userplus' },
  { id: 'socialni', label: 'Sociální sítě', icon: 'partners' },
  { id: 'nastaveni', label: 'Nastavení', icon: 'settings' },
  { id: 'uzivatele', label: 'Uživatelé a role', icon: 'userplus' },
];
export const SECTION_IDS = ADMIN_SECTIONS.map((s) => s.id);

// Menu administrace je seskupené, aby v něm nebylo 14 položek. Oprávnění se
// ale dál nastavují po jednotlivých sekcích — skupina se v menu ukáže, jakmile
// má člověk právo aspoň na jednu její část, a uvnitř vidí jen to své.
export const ADMIN_GROUPS = [
  { id: 'prehled', label: 'Přehled', icon: 'dashboard', sections: ['prehled'] },
  { id: 'hriste', label: 'Zápasy a týmy', icon: 'ball', sections: ['zapasy', 'tymy'] },
  { id: 'obsah', label: 'Novinky a kempy', icon: 'news', sections: ['novinky', 'kempy'] },
  { id: 'posta', label: 'Pošta', icon: 'mail', sections: ['zpravy', 'registrace', 'pronajem'] },
  { id: 'web', label: 'Web', icon: 'partners', sections: ['domu', 'partneri', 'kontakt'] },
  { id: 'nastaveni', label: 'Nastavení', icon: 'settings', sections: ['nastaveni', 'socialni', 'uzivatele'] },
];

// Popisek sekce (pro záložky uvnitř skupiny).
export function sectionLabel(id) {
  const s = ADMIN_SECTIONS.find((x) => x.id === id);
  return s ? s.label : id;
}

// Sekce dané skupiny, na které má uživatel aspoň právo prohlížet.
export function visibleSectionsInGroup(group, perms) {
  return (group.sections || []).filter((id) => canView(perms, id));
}

// Skupiny, ve kterých je pro uživatele aspoň jedna viditelná sekce.
export function visibleGroups(perms) {
  return ADMIN_GROUPS.filter((g) => visibleSectionsInGroup(g, perms).length > 0);
}

// Které klíče obsahu daná sekce upravuje. Podle toho server pozná, jestli
// uživatel smí uložit konkrétní změnu (viz canSaveContent níže).
export const SECTION_CONTENT_KEYS = {
  domu: ['homeTexts', 'footer', 'whyCards', 'gallery'],
  tymy: ['teams'],
  zapasy: ['teams', 'matchProposals', 'matchesSync', 'opponents'],
  novinky: ['news'],
  kempy: ['camps'],
  pronajem: ['rentalPlans', 'rentalFaq', 'reservations', 'rentalSettings'],
  kontakt: ['quickActions', 'people'],
  zpravy: ['messages'],
  partneri: ['sponsors'],
  registrace: ['cmsRegistrations'],
  socialni: ['socialPosts', 'socialSettings', 'opponents'],
  nastaveni: ['club'],
};

// Opačná mapa: klíč obsahu → sekce, které ho smí měnit.
export const CONTENT_KEY_SECTIONS = (() => {
  const out = {};
  for (const [sectionId, keys] of Object.entries(SECTION_CONTENT_KEYS)) {
    for (const key of keys) {
      if (!out[key]) out[key] = [];
      out[key].push(sectionId);
    }
  }
  return out;
})();

// --- práce s oprávněními ----------------------------------------------------

// Prázdná matice: všechny sekce na 'none'.
export function emptyPermissions() {
  const out = {};
  for (const id of SECTION_IDS) out[id] = 'none';
  return out;
}

// Doplní chybějící sekce a opraví neplatné hodnoty.
export function normalizePermissions(perms) {
  const out = emptyPermissions();
  if (perms && typeof perms === 'object') {
    for (const id of SECTION_IDS) {
      if (LEVELS.includes(perms[id])) out[id] = perms[id];
    }
  }
  return out;
}

export function canView(perms, sectionId) {
  const lvl = perms && perms[sectionId];
  return lvl === 'view' || lvl === 'edit';
}
export function canEdit(perms, sectionId) {
  return !!perms && perms[sectionId] === 'edit';
}

// Vrátí seznam klíčů obsahu, které se mezi dvěma verzemi liší.
export function changedContentKeys(before, after) {
  const keys = new Set([...Object.keys(before || {}), ...Object.keys(after || {})]);
  const changed = [];
  for (const key of keys) {
    if (JSON.stringify(before ? before[key] : undefined) !== JSON.stringify(after ? after[key] : undefined)) {
      changed.push(key);
    }
  }
  return changed;
}

// Smí uživatel uložit tuhle změnu obsahu? Vrací { ok, denied: [klíče] }.
// Klíč, který nepatří žádné sekci (např. nová sekce webu), smí uložit jen ten,
// kdo má právo editovat Nastavení — jinak by šlo obejít kontrolu.
export function canSaveContent(perms, before, after) {
  const denied = [];
  for (const key of changedContentKeys(before, after)) {
    const sections = CONTENT_KEY_SECTIONS[key] || ['nastaveni'];
    if (!sections.some((s) => canEdit(perms, s))) denied.push(key);
  }
  return { ok: denied.length === 0, denied };
}

// --- výchozí role -----------------------------------------------------------

function allEdit() {
  const out = {};
  for (const id of SECTION_IDS) out[id] = 'edit';
  return out;
}

export function defaultRoles() {
  return [
    {
      id: 'spravce',
      name: 'Správce',
      description: 'Plný přístup ke všemu včetně uživatelů a rolí.',
      system: true, // systémovou roli nelze smazat ani jí odebrat práva
      permissions: allEdit(),
    },
    {
      id: 'redaktor',
      name: 'Redaktor',
      description: 'Píše novinky, spravuje kempy a texty na webu.',
      permissions: normalizePermissions({
        prehled: 'view', domu: 'edit', tymy: 'view', zapasy: 'view',
        novinky: 'edit', kempy: 'edit', pronajem: 'view', kontakt: 'view',
        zpravy: 'view', partneri: 'view', registrace: 'none', socialni: 'edit',
        nastaveni: 'none', uzivatele: 'none',
      }),
    },
    {
      id: 'trener',
      name: 'Trenér',
      description: 'Spravuje soupisky a zápasy svých týmů.',
      permissions: normalizePermissions({
        prehled: 'view', domu: 'none', tymy: 'edit', zapasy: 'edit',
        novinky: 'view', kempy: 'view', pronajem: 'none', kontakt: 'view',
        zpravy: 'none', partneri: 'none', registrace: 'view', socialni: 'view',
        nastaveni: 'none', uzivatele: 'none',
      }),
    },
    {
      id: 'sekretariat',
      name: 'Sekretariát',
      description: 'Vyřizuje zprávy, rezervace a registrace.',
      permissions: normalizePermissions({
        prehled: 'view', domu: 'none', tymy: 'view', zapasy: 'view',
        novinky: 'view', kempy: 'view', pronajem: 'edit', kontakt: 'edit',
        zpravy: 'edit', partneri: 'view', registrace: 'edit', socialni: 'view',
        nastaveni: 'none', uzivatele: 'none',
      }),
    },
  ];
}

// Oprávnění uživatele = oprávnění jeho role (neznámá role → nic).
export function permissionsForRole(roles, roleId) {
  const role = (roles || []).find((r) => r.id === roleId);
  return normalizePermissions(role ? role.permissions : null);
}
