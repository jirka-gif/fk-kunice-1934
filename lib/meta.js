// =============================================================================
//  FK KUNICE — PUBLIKOVÁNÍ NA FACEBOOK A INSTAGRAM (Meta Graph API, server only)
//
//  Co musí udělat člověk mimo kód (viz README-BACKEND.md):
//    1. založit aplikaci v Meta for Developers a propojit ji s FB stránkou klubu,
//    2. propojit instagramový profil klubu (Business/Creator) s tou stránkou,
//    3. nechat schválit oprávnění pages_manage_posts a instagram_content_publish,
//    4. vygenerovat dlouhodobý token stránky.
//  Do prostředí pak stačí doplnit proměnné níž. Token nikdy nepatří do kódu.
//
//  Instagram publikuje ve dvou krocích: nejdřív „media container" s adresou
//  obrázku, potom publish. Obrázek proto musí být veřejně dostupný na internetu
//  (u nás /api/og/match na nasazeném webu) — Meta si ho stahuje sama.
// =============================================================================

const GRAPH = () => `https://graph.facebook.com/${process.env.META_GRAPH_VERSION || 'v21.0'}`;

export function metaConfig() {
  return {
    pageId: process.env.META_PAGE_ID || '',
    pageToken: process.env.META_PAGE_TOKEN || '',
    igUserId: process.env.META_IG_USER_ID || '',
  };
}

export function missingConfig(target) {
  const c = metaConfig();
  if (target === 'facebook') {
    if (!c.pageId || !c.pageToken) return 'Chybí nastavení Facebooku (META_PAGE_ID, META_PAGE_TOKEN).';
    return '';
  }
  if (target === 'instagram') {
    if (!c.igUserId || !c.pageToken) return 'Chybí nastavení Instagramu (META_IG_USER_ID, META_PAGE_TOKEN).';
    return '';
  }
  return `Neznámá síť: ${target}`;
}

// Jednotné volání Graph API — vždy vrátí čitelnou chybu, nikdy nevyhodí HTML.
async function graph(path, body, fetchImpl = fetch) {
  const res = await fetchImpl(`${GRAPH()}/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  let data = null;
  try { data = await res.json(); } catch { data = null; }
  if (!res.ok || (data && data.error)) {
    const message = (data && data.error && data.error.message) || `Meta API vrátila ${res.status}`;
    throw new Error(message);
  }
  return data || {};
}

// --- Facebook: fotka s popiskem na zeď stránky ------------------------------
export async function publishToFacebook({ text, imageUrl }, fetchImpl = fetch) {
  const missing = missingConfig('facebook');
  if (missing) throw new Error(missing);
  const { pageId, pageToken } = metaConfig();
  const data = await graph(`${pageId}/photos`, { url: imageUrl, caption: text, access_token: pageToken }, fetchImpl);
  return { id: data.post_id || data.id || '', target: 'facebook' };
}

// --- Instagram: container → publish -----------------------------------------
export async function publishToInstagram({ text, imageUrl }, fetchImpl = fetch) {
  const missing = missingConfig('instagram');
  if (missing) throw new Error(missing);
  const { igUserId, pageToken } = metaConfig();
  const container = await graph(`${igUserId}/media`, { image_url: imageUrl, caption: text, access_token: pageToken }, fetchImpl);
  if (!container.id) throw new Error('Instagram nevrátil id média.');
  const published = await graph(`${igUserId}/media_publish`, { creation_id: container.id, access_token: pageToken }, fetchImpl);
  return { id: published.id || '', target: 'instagram' };
}

// Odešle příspěvek na všechny vybrané sítě. Nikdy nevyhodí výjimku —
// vrátí výsledek za každou síť zvlášť, ať se dá zapsat do historie.
export async function publishPost(post, imageUrl, fetchImpl = fetch) {
  const results = [];
  for (const target of post.targets || []) {
    const at = new Date().toISOString();
    try {
      const publish = target === 'instagram' ? publishToInstagram : target === 'facebook' ? publishToFacebook : null;
      if (!publish) throw new Error(`Neznámá síť: ${target}`);
      const out = await publish({ text: post.text, imageUrl }, fetchImpl);
      results.push({ at, action: 'odeslání', target, ok: true, message: `Publikováno (${out.id || 'bez id'})` });
    } catch (err) {
      results.push({ at, action: 'odeslání', target, ok: false, message: err.message });
    }
  }
  if (!results.length) {
    results.push({ at: new Date().toISOString(), action: 'odeslání', target: '—', ok: false, message: 'Není vybraná žádná síť.' });
  }
  return { results, ok: results.every((r) => r.ok) };
}
