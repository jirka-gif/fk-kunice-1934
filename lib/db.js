// =============================================================================
//  FK KUNICE — PERZISTENCE OBSAHU (server only)
//  Celý obsah webu se ukládá jako jeden JSON záznam (jeden řádek v tabulce).
//  - Když je nastavená proměnná DATABASE_URL → ukládá se do Postgresu (Neon).
//  - Když není → funguje dočasné úložiště v paměti (pro lokální vývoj).
//  Web díky tomu běží i BEZ databáze (spadne zpět na výchozí obsah z club.js).
//
//  Až budeš chtít přejít na plnohodnotný relační model (samostatné tabulky
//  pro týmy, zápasy, novinky…), stačí přepsat getStoredContent / saveStoredContent
//  a zbytek aplikace se nemění. Viz README-BACKEND.md.
// =============================================================================

const DB_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL || '';

// --- záložní úložiště v paměti (bez DB) ---
// Pozn.: na Vercelu se paměť mezi requesty nesdílí a resetuje se, proto je to
// jen pro lokální vývoj / demo. Pro reálnou perzistenci nastav DATABASE_URL.
globalThis.__fkMemStore = globalThis.__fkMemStore || { data: null };
// Uživatelé a role žijí ZVLÁŠŤ od obsahu — obsah je veřejný (GET /api/content),
// zatímco tady jsou hesla (hashe). Nikdy je nemíchej do site_content.
globalThis.__fkAuthStore = globalThis.__fkAuthStore || { data: null };

let _sqlPromise = null;
async function getSql() {
  if (!DB_URL) return null;
  if (!_sqlPromise) {
    _sqlPromise = (async () => {
      const { neon } = await import('@neondatabase/serverless');
      const sql = neon(DB_URL);
      // Tabulka: jeden řádek (id=1) s celým obsahem webu v JSONB.
      await sql`CREATE TABLE IF NOT EXISTS site_content (
        id INT PRIMARY KEY DEFAULT 1,
        data JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;
      // Oddělená tabulka pro uživatele a role (hesla se nikdy nesmí dostat
      // do veřejného obsahu webu).
      await sql`CREATE TABLE IF NOT EXISTS site_auth (
        id INT PRIMARY KEY DEFAULT 1,
        data JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;
      return sql;
    })();
  }
  return _sqlPromise;
}

export async function getStoredContent() {
  try {
    const sql = await getSql();
    if (!sql) return globalThis.__fkMemStore.data;
    const rows = await sql`SELECT data FROM site_content WHERE id = 1`;
    return rows && rows[0] ? rows[0].data : null;
  } catch (err) {
    console.error('[db] getStoredContent selhalo, používám záložní obsah:', err.message);
    return globalThis.__fkMemStore.data;
  }
}

export async function saveStoredContent(obj) {
  const sql = await getSql();
  if (!sql) {
    globalThis.__fkMemStore.data = obj;
    return { ok: true, store: 'memory' };
  }
  const json = JSON.stringify(obj);
  await sql`INSERT INTO site_content (id, data, updated_at)
            VALUES (1, ${json}::jsonb, now())
            ON CONFLICT (id) DO UPDATE SET data = ${json}::jsonb, updated_at = now()`;
  return { ok: true, store: 'postgres' };
}

// --- uživatelé a role (oddělené úložiště) ---
export async function getStoredAuth() {
  try {
    const sql = await getSql();
    if (!sql) return globalThis.__fkAuthStore.data;
    const rows = await sql`SELECT data FROM site_auth WHERE id = 1`;
    return rows && rows[0] ? rows[0].data : null;
  } catch (err) {
    console.error('[db] getStoredAuth selhalo, používám záložní úložiště:', err.message);
    return globalThis.__fkAuthStore.data;
  }
}

export async function saveStoredAuth(obj) {
  const sql = await getSql();
  if (!sql) {
    globalThis.__fkAuthStore.data = obj;
    return { ok: true, store: 'memory' };
  }
  const json = JSON.stringify(obj);
  await sql`INSERT INTO site_auth (id, data, updated_at)
            VALUES (1, ${json}::jsonb, now())
            ON CONFLICT (id) DO UPDATE SET data = ${json}::jsonb, updated_at = now()`;
  return { ok: true, store: 'postgres' };
}

export function hasDatabase() {
  return !!DB_URL;
}
