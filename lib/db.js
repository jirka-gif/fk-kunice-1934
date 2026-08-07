// =============================================================================
//  FK KUNICE — PERZISTENCE OBSAHU (server only)
//  Celý obsah webu se ukládá jako jeden JSON záznam (jeden řádek v tabulce).
//  - Když je nastavená proměnná DATABASE_URL → ukládá se do Postgresu (Neon).
//  - Když je FK_LOCAL_STORE=1 (jen lokální testování) → ukládá se do souborů
//    ve složce .data/, takže změny přežijí restart `npm run dev`.
//  - Jinak → dočasné úložiště v paměti.
//  Web díky tomu běží i BEZ databáze (spadne zpět na výchozí obsah z club.js).
//
//  Až budeš chtít přejít na plnohodnotný relační model (samostatné tabulky
//  pro týmy, zápasy, novinky…), stačí přepsat getStoredContent / saveStoredContent
//  a zbytek aplikace se nemění. Viz README-BACKEND.md.
// =============================================================================

const DB_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL || '';

// --- záložní úložiště v paměti (bez DB) ---
// Pozn.: paměť přežije jen do restartu podu a mezi replikami se nesdílí, proto
// je to jen pro lokální vývoj / demo. Pro reálnou perzistenci nastav DATABASE_URL.
globalThis.__fkMemStore = globalThis.__fkMemStore || { data: null };
globalThis.__fkAuditStore = globalThis.__fkAuditStore || { data: null };
// Uživatelé a role žijí ZVLÁŠŤ od obsahu — obsah je veřejný (GET /api/content),
// zatímco tady jsou hesla (hashe). Nikdy je nemíchej do site_content.
globalThis.__fkAuthStore = globalThis.__fkAuthStore || { data: null };

// --- lokální soubory (jen pro testování na vlastním počítači) ---------------
// Zapíná se proměnnou FK_LOCAL_STORE=1 v .env.local. V provozu se nikdy
// nepoužije — tam je nastavená DATABASE_URL a rozhoduje ta.
const LOCAL_STORE = !DB_URL && process.env.FK_LOCAL_STORE === '1';
const LOCAL_FILES = { content: 'content.json', auth: 'auth.json', audit: 'audit.json' };

async function localFile(kind) {
  const [{ join }, { mkdir }] = await Promise.all([import('node:path'), import('node:fs/promises')]);
  const dir = join(process.cwd(), '.data');
  await mkdir(dir, { recursive: true });
  return join(dir, LOCAL_FILES[kind]);
}

async function readLocal(kind) {
  try {
    const { readFile } = await import('node:fs/promises');
    return JSON.parse(await readFile(await localFile(kind), 'utf8'));
  } catch {
    return null; // soubor ještě neexistuje → chová se jako prázdné úložiště
  }
}

async function writeLocal(kind, obj) {
  const { writeFile, rename } = await import('node:fs/promises');
  const path = await localFile(kind);
  // zápis přes dočasný soubor, ať se při pádu nerozbije ten původní
  await writeFile(`${path}.tmp`, JSON.stringify(obj, null, 2), 'utf8');
  await rename(`${path}.tmp`, path);
  return { ok: true, store: 'soubor' };
}

// Neon nemluví běžným protokolem Postgresu — posílá dotazy přes HTTPS na svůj
// endpoint. Na klasický Postgres (např. vlastní v Kubernetes) proto jeho ovladač
// nesáhne a naopak. Podle adresy tedy vybereme ten správný; oba mají shodné
// rozhraní `sql`…``, takže zbytek souboru je pro obě databáze stejný.
const IS_NEON = (() => {
  try {
    return new URL(DB_URL).hostname.endsWith('.neon.tech');
  } catch {
    return false; // nesmyslná adresa → ať to spadne až na připojení, s jasnou hláškou
  }
})();

async function connect() {
  if (IS_NEON) {
    const { neon } = await import('@neondatabase/serverless');
    return neon(DB_URL);
  }
  const { default: postgres } = await import('postgres');
  // `max` drží počet spojení nízko — web má jeden pod a databáze pár desítek
  // slotů. `sslmode` se bere z adresy, takže self-signed certifikát vlastního
  // Postgresu projde, když je v ní `sslmode=require`.
  return postgres(DB_URL, { max: 4, idle_timeout: 20, connect_timeout: 10 });
}

// Jak se objekt předá do dotazu, se u obou ovladačů liší:
//  - Neon posílá parametry jako text, takže mu stačí hotový řetězec a `::jsonb`
//    ho uloží jako JSON dokument.
//  - postgres.js si typ odvozuje z hodnoty. Kdyby dostal řetězec, uložil by do
//    sloupce JSON *řetězec* (dvojité zakódování) a čtení by pak vracelo text
//    místo objektu. `sql.json()` mu řekne, že jde o JSON dokument.
// Odchyceno round-trip testem proti skutečné databázi; `jsonb_typeof` vracel
// `string` místo `object`.
function jsonParam(sql, obj) {
  return IS_NEON ? JSON.stringify(obj) : sql.json(obj);
}

// Čteme tolerantně: kdyby ve sloupci zůstal JSON uložený jako řetězec (starší
// nebo cizí zápis), rozbalíme ho, místo aby se web sesypal na `data.nazev`.
function fromJsonb(value) {
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

let _sqlPromise = null;
async function getSql() {
  if (!DB_URL) return null;
  if (!_sqlPromise) {
    _sqlPromise = (async () => {
      const sql = await connect();
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
      // Záznam změn a přihlášení. Taky odděleně — `site_content` je veřejný
      // přes GET /api/content, historie do něj nesmí.
      await sql`CREATE TABLE IF NOT EXISTS site_audit (
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
    if (LOCAL_STORE) return readLocal('content');
    const sql = await getSql();
    if (!sql) return globalThis.__fkMemStore.data;
    const rows = await sql`SELECT data FROM site_content WHERE id = 1`;
    return rows && rows[0] ? fromJsonb(rows[0].data) : null;
  } catch (err) {
    console.error('[db] getStoredContent selhalo, používám záložní obsah:', err.message);
    return globalThis.__fkMemStore.data;
  }
}

export async function saveStoredContent(obj) {
  if (LOCAL_STORE) return writeLocal('content', obj);
  const sql = await getSql();
  if (!sql) {
    globalThis.__fkMemStore.data = obj;
    return { ok: true, store: 'memory' };
  }
  const json = jsonParam(sql, obj);
  await sql`INSERT INTO site_content (id, data, updated_at)
            VALUES (1, ${json}::jsonb, now())
            ON CONFLICT (id) DO UPDATE SET data = ${json}::jsonb, updated_at = now()`;
  return { ok: true, store: 'postgres' };
}

// --- záznam změn a přihlášení (oddělené úložiště) ---
export async function getStoredAudit() {
  try {
    if (LOCAL_STORE) return readLocal('audit');
    const sql = await getSql();
    if (!sql) return globalThis.__fkAuditStore.data;
    const rows = await sql`SELECT data FROM site_audit WHERE id = 1`;
    return rows && rows[0] ? fromJsonb(rows[0].data) : null;
  } catch (err) {
    console.error('[db] getStoredAudit selhalo, používám záložní úložiště:', err.message);
    return globalThis.__fkAuditStore.data;
  }
}

export async function saveStoredAudit(obj) {
  if (LOCAL_STORE) return writeLocal('audit', obj);
  const sql = await getSql();
  if (!sql) {
    globalThis.__fkAuditStore.data = obj;
    return { ok: true, store: 'memory' };
  }
  const json = jsonParam(sql, obj);
  await sql`INSERT INTO site_audit (id, data, updated_at)
            VALUES (1, ${json}::jsonb, now())
            ON CONFLICT (id) DO UPDATE SET data = ${json}::jsonb, updated_at = now()`;
  return { ok: true, store: 'postgres' };
}

// --- uživatelé a role (oddělené úložiště) ---
export async function getStoredAuth() {
  try {
    if (LOCAL_STORE) return readLocal('auth');
    const sql = await getSql();
    if (!sql) return globalThis.__fkAuthStore.data;
    const rows = await sql`SELECT data FROM site_auth WHERE id = 1`;
    return rows && rows[0] ? fromJsonb(rows[0].data) : null;
  } catch (err) {
    console.error('[db] getStoredAuth selhalo, používám záložní úložiště:', err.message);
    return globalThis.__fkAuthStore.data;
  }
}

export async function saveStoredAuth(obj) {
  if (LOCAL_STORE) return writeLocal('auth', obj);
  const sql = await getSql();
  if (!sql) {
    globalThis.__fkAuthStore.data = obj;
    return { ok: true, store: 'memory' };
  }
  const json = jsonParam(sql, obj);
  await sql`INSERT INTO site_auth (id, data, updated_at)
            VALUES (1, ${json}::jsonb, now())
            ON CONFLICT (id) DO UPDATE SET data = ${json}::jsonb, updated_at = now()`;
  return { ok: true, store: 'postgres' };
}

export function hasDatabase() {
  return !!DB_URL;
}

// Kam se právě ukládá — používá se jen pro hlášku v administraci / logu.
export function storeKind() {
  if (DB_URL) return 'postgres';
  return LOCAL_STORE ? 'soubor' : 'memory';
}
