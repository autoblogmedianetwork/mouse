// RLS two-account test (docs/rencana-testing.md section 4).
// Creates two throwaway auth users, seeds each user's rows, then asserts:
//   - user A sees only their own rows
//   - user B cannot read/update/delete A's rows
//   - user B cannot insert a row attributed to A
// All test rows and both accounts are deleted afterwards (service role, bypasses RLS).
//
// Usage: node tests/rls-dua-akun.mjs
// Requires NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
// SUPABASE_SERVICE_ROLE_KEY (server-only, never shipped to any client).
//
// Exit code 0 = all assertions passed, 1 = at least one failure.

import { readFileSync } from "node:fs";

/* ------------------------------ env loading ------------------------------ */

const envPath = new URL("../.env.local", import.meta.url);
const env = {};
for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2];
}

const SUPABASE_URL = (env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/+$/, "");
const ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!SUPABASE_URL || !ANON_KEY || !SERVICE_KEY) {
  console.error("Missing Supabase env vars in .env.local (URL, anon key, service role key).");
  process.exit(1);
}

/* -------------------------------- helpers -------------------------------- */

async function rest(path, { method = "GET", token, key, body } = {}) {
  const headers = {
    apikey: key ?? ANON_KEY,
    Accept: "application/json",
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined || method === "DELETE") {
    if (body !== undefined) headers["Content-Type"] = "application/json";
    // Return the affected rows so callers can count them (a bare DELETE answers 204 with no body).
    headers.Prefer = "return=representation";
  }
  const res = await fetch(`${SUPABASE_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  return { status: res.status, json };
}

const results = [];
function record(table, scenario, ok, detail) {
  results.push({ table, scenario, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${table.padEnd(18)} ${scenario}${detail ? `  [${detail}]` : ""}`);
}

/* ------------------------------ test accounts ---------------------------- */

const stamp = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const PASSWORD = `Rls-Uji-${stamp}-A9!`;

async function createAccount(label) {
  const email = `rls-uji-${label}-${stamp}@example.com`;
  const { status, json } = await rest("/auth/v1/admin/users", {
    method: "POST",
    key: SERVICE_KEY,
    token: SERVICE_KEY,
    body: { email, password: PASSWORD, email_confirm: true },
  });
  if (status !== 200 && status !== 201) throw new Error(`admin create ${label}: ${status} ${JSON.stringify(json)}`);
  const id = json?.id;
  if (!id) throw new Error(`admin create ${label}: no id`);
  const login = await rest("/auth/v1/token?grant_type=password", {
    method: "POST",
    body: { email, password: PASSWORD },
  });
  const access = login.json?.access_token;
  if (!access) throw new Error(`login ${label}: no token (${login.status})`);
  return { id, email, token: access };
}

/* ------------------------------- row crops -------------------------------- */

const rand = () => Math.random().toString(36).slice(2, 10);

// Build chain of rows for one user. Each factory gets the user and rows created so far.
const TABLES = [
  { table: "products", make: (u) => ({ user_id: u.id, nama_internal: `rls-uji-${rand()}` }) },
  {
    table: "product_media",
    need: "products",
    make: (u, r) => ({ user_id: u.id, product_id: r.products, storage_path: `${u.id}/uji-${rand()}.webp` }),
  },
  {
    table: "analysis_cache",
    make: (u) => ({ user_id: u.id, hash: `h-${rand()}`, hasil: { ringkasan: "uji" }, model: "uji", prompt_version: "v1" }),
  },
  {
    table: "idea_batches",
    need: "products",
    make: (u, r) => ({ user_id: u.id, product_id: r.products }),
  },
  {
    table: "ideas",
    need: "idea_batches",
    make: (u, r) => ({ user_id: u.id, batch_id: r.idea_batches, judul: `ujji-${rand()}` }),
  },
  {
    table: "contents",
    make: (u) => ({ user_id: u.id, judul_internal: `uji-${rand()}` }),
  },
  {
    table: "threads_statuses",
    need: "contents",
    make: (u, r) => ({ user_id: u.id, content_id: r.contents, urutan: Math.floor(Math.random() * 1e6), teks: "uji" }),
  },
  {
    table: "content_variants",
    need: "contents",
    make: (u, r) => ({ user_id: u.id, content_id: r.contents, platform: "threads", teks: "uji" }),
  },
  {
    table: "carousel_slides",
    need: "contents",
    make: (u, r) => ({ user_id: u.id, content_id: r.contents, urutan: Math.floor(Math.random() * 1e6), peran: "isi" }),
  },
  {
    table: "generations",
    make: (u) => ({ user_id: u.id, jenis: "analisis", model: "uji", prompt_version: "v1" }),
  },
  {
    table: "affiliate_links",
    make: (u) => ({ user_id: u.id, url: `https://uji.${rand()}.example.com/p/${rand()}` }),
  },
  { table: "templates", make: (u) => ({ user_id: u.id, nama: `uji-${rand()}`, isi: "uji" }) },
  { table: "settings", make: (u) => ({ user_id: u.id }) },
  {
    table: "threads_accounts",
    make: (u) => ({ user_id: u.id, threads_user_id: `uji-${stamp}-${rand()}`, token_terenkripsi: "uji" }),
  },
  {
    table: "performa_imports",
    make: (u) => ({ user_id: u.id, nama_berkas: `uji-${rand()}.csv`, marketplace: "shopee" }),
  },
  {
    table: "performa_rows",
    need: "performa_imports",
    make: (u, r) => ({
      user_id: u.id,
      import_id: r.performa_imports,
      marketplace: "shopee",
      id_pesanan: `uji-${rand()}`,
      produk: "uji",
    }),
  },
];
const ALL_TABLES = TABLES.map((t) => t.table);

// Update target per table: must be an existing column with a harmless value,
// otherwise PATCH fails for schema reasons instead of RLS reasons.
const PATCH_FIELD = {
  products: { nama_internal: "uji-update" },
  product_media: { urutan: 999 },
  analysis_cache: { model: "uji-update" },
  idea_batches: {},
  ideas: { dipilih: true },
  contents: { is_arsip: true },
  threads_statuses: { edited_at: "2026-01-01T00:00:00Z" },
  content_variants: { teks: "uji-update" },
  carousel_slides: { path_render: "uji-update" },
  generations: { error: "uji-update" },
  affiliate_links: { catatan: "uji-update" },
  templates: { nama: "uji-update" },
  settings: { data: { uji: true } },
  threads_accounts: { nama_tampilan: "uji-update" },
  performa_imports: { jumlah_baris: 1 },
  performa_rows: { klik: 1 },
};

/* --------------------------------- runner --------------------------------- */

async function insert(token, table, body) {
  return rest(`/rest/v1/${table}`, { method: "POST", token, body });
}

async function insertExpectRow(a, table, body) {
  const { status, json } = await insert(a.token, table, body);
  const row = Array.isArray(json) ? json[0] : null;
  // settings' primary key is user_id, not id.
  const key = row?.id ?? row?.user_id;
  if ((status !== 200 && status !== 201) || !key) {
    throw new Error(`seed ${table}: ${status} ${JSON.stringify(json)}`);
  }
  return key;
}

async function seedUser(u) {
  const rows = {};
  const createdIds = {}; // table -> id, also reused for cross-user FK
  for (const cfg of TABLES) {
    const body = cfg.make(u, rows);
    createdIds[cfg.table] = await insertExpectRow(u, cfg.table, body);
    rows[cfg.table] = createdIds[cfg.table];
  }
  return createdIds;
}

/** Full isolation matrix against one table. */
const KEY_COL = { settings: "user_id" };
async function checkTable(table, ids, a, b) {
  const keyCol = KEY_COL[table] ?? "id";
  const id = ids[table];

  // 1. A still sees their own row.
  {
    const { json } = await rest(`/rest/v1/${table}?${keyCol}=eq.${id}&select=*`, { token: a.token });
    record(table, "A melihat barisnya sendiri", Array.isArray(json) && json.length === 1, `${json?.length ?? "?"} baris`);
  }

  // 2. B cannot read A's row.
  {
    const { json } = await rest(`/rest/v1/${table}?${keyCol}=eq.${id}&select=*`, { token: b.token });
    record(table, "B tidak bisa baca baris A", Array.isArray(json) && json.length === 0, `${json?.length ?? "?"} baris`);
  }

  // 3. B cannot update A's row.
  {
    const { json } = await rest(`/rest/v1/${table}?${keyCol}=eq.${id}`, { method: "PATCH", token: b.token, body: PATCH_FIELD[table] });
    record(table, "B tidak bisa update baris A", Array.isArray(json) && json.length === 0, `${json?.length ?? "?"} baris`);
  }

  // 4. B cannot delete A's row.
  {
    const { json } = await rest(`/rest/v1/${table}?${keyCol}=eq.${id}`, { method: "DELETE", token: b.token });
    record(table, "B tidak bisa hapus baris A", Array.isArray(json) && json.length === 0, `${json?.length ?? "?"} baris`);
  }

  // 5. B cannot insert a row attributed to user A (violates with check).
  if (table !== "settings") {
    const cfg = TABLES.find((t) => t.table === table);
    // Parent ids referenced by the payload are A's rows, which the FK allows.
    // RLS is the only thing that should stop it: B's token writes user_id = A.
    let body;
    try {
      body = cfg.make(a, ids);
    } catch (e) {
      record(table, "B insert atribusi A (dengan FK milik A)", false, `${e.message}`);
      return;
    }
    const { status } = await insert(b.token, table, body);
    record(table, "B insert atribusi A ditolak RLS", status === 403, `HTTP ${status}`);
  }
}

/* ------------------------------ constraints ------------------------------ */

async function checkConstraints(a) {
  // threads_statuses: teks 501 chars must be rejected by the 1..500 check.
  const body = {
    user_id: a.id,
    content_id: null,
    urutan: 999999,
    teks: "x".repeat(501),
  };
  // Pick A's own content id for FK validity.
  const { json: myContents } = await rest("/rest/v1/contents?select=id&limit=1", { token: a.token });
  body.content_id = myContents?.[0]?.id ?? null;
  const { status } = await insert(a.token, "threads_statuses", body);
  record("threads_statuses", "teks 501 karakter ditolak constraint", status === 400, `HTTP ${status}`);

  // products: deskripsi_bersih > 3000 chars must be rejected.
  const { status: s2 } = await insert(a.token, "products", {
    user_id: a.id,
    nama_internal: `uji-${rand()}`,
    deskripsi_bersih: "x".repeat(3001),
  });
  record("products", "deskripsi_bersih 3001 karakter ditolak constraint", s2 === 400, `HTTP ${s2}`);
}

/* --------------------------- FK pollution probe --------------------------- */

/**
 * Informational: the owner_all policies filter on user_id only, so a signed-in
 * user can attach their own row to another user's parent row (e.g. a
 * threads_statuses row referencing B's content). This is cross-account
 * pollution, not data exposure, but worth reporting.
 */
async function probeFkPollution(a, b, ids) {
  const { status, json } = await insert(a.token, "threads_statuses", {
    user_id: a.id,
    content_id: ids.contents, // B's content
    urutan: 999998,
    teks: "uji-pollution",
  });
  const ok = status === 200 || status === 201;
  console.log(
    `INFO  cross-FK   A insert threads_statuses dengan content_id milik B → ${
      ok ? "DITERIMA (temuan)" : `ditolak (HTTP ${status})`
    }`
  );
  if (json?.[0]?.id) {
    await rest(`/rest/v1/threads_statuses?id=eq.${json[0].id}`, { method: "DELETE", token: a.token });
  }
}

/* ------------------------------- platforms ------------------------------- */

async function seedPlatform() {
  // platforms has no user_id; authenticated users may only read it.
  const { status, json } = await rest("/rest/v1/platforms", {
    method: "POST",
    key: SERVICE_KEY,
    token: SERVICE_KEY,
    body: { kode: "threads", nama: "Threads", aktif: true },
  }).catch(() => ({ status: 0, json: null }));
  if (status === 200 || status === 201) return true;
  if (status === 409) return true; // already seeded from an earlier run
  console.log(`INFO  platforms  seed HTTP ${status}: ${JSON.stringify(json)}`);
  return false;
}

async function checkPlatforms(a, b) {
  const { json: visible } = await rest("/rest/v1/platforms?select=*&limit=1", { token: b.token });
  record("platforms", "B (authenticated) bisa baca", Array.isArray(visible) && visible.length === 1, `${visible?.length ?? "?"} baris`);

  // Same path without any Authorization header must not leak rows to the anon key.
  const { json: anon } = await rest("/rest/v1/platforms?select=*&limit=1");
  record("platforms", "anon (tanpa login) tidak bisa baca", anon !== null && anon.length === 0, `${anon?.length ?? "?"} baris`);
}

/* -------------------------------- cleanup -------------------------------- */

async function cleanup(u) {
  for (const table of ALL_TABLES) {
    await rest(`/rest/v1/${table}?user_id=eq.${u.id}`, { method: "DELETE", key: SERVICE_KEY, token: SERVICE_KEY });
  }
  await rest(`/auth/v1/admin/users/${u.id}`, { method: "DELETE", key: SERVICE_KEY, token: SERVICE_KEY });
}

/* ---------------------------------- main --------------------------------- */

async function main() {
  console.log(`Supabase: ${SUPABASE_URL.replace(/^https:\/\/([a-z0-9]+)\..*$/, "$1")}, stamp ${stamp}`);
  const failed = [];

  await seedPlatform();
  let a = null;
  let b = null;
  try {
    a = await createAccount("a");
    b = await createAccount("b");
    console.log(`Akun uji: A=${a.id} B=${b.id}`);

    const idsA = await seedUser(a);
    const idsB = await seedUser(b);

    for (const cfg of TABLES) {
      await checkTable(cfg.table, idsA, a, b);
    }

    await checkPlatforms(a, b);
    await checkConstraints(a);
    await probeFkPollution(a, b, idsB);

    // Verify B's own rows are still intact and invisible to A (reverse direction on one table).
    {
      const { json } = await rest(`/rest/v1/contents?id=eq.${idsB.contents}&select=*`, { token: a.token });
      record("contents", "A tidak bisa baca baris B (arah balik)", Array.isArray(json) && json.length === 0, `${json?.length ?? "?"} baris`);
    }
  } finally {
    // Always clean up, even when seeding or an assertion throws midway.
    console.log("\nBersih-bersih…");
    for (const u of [a, b]) {
      if (u) await cleanup(u).catch((e) => console.error(`bersih-bersih ${u.id} gagal: ${e.message}`));
    }
    await rest("/rest/v1/platforms?kode=eq.threads", { method: "DELETE", key: SERVICE_KEY, token: SERVICE_KEY });
    console.log("Bersih-bersih selesai (baris uji, platform uji, kedua akun).");
  }

  const tableResults = new Map();
  for (const r of results) {
    if (!tableResults.has(r.table)) tableResults.set(r.table, []);
    tableResults.get(r.table).push(r);
  }
  console.log("\nRingkasan:");
  for (const [table, rows] of tableResults) {
    const okCount = rows.filter((r) => r.ok).length;
    console.log(`  ${table}: ${okCount}/${rows.length} lulus`);
    for (const r of rows.filter((x) => !x.ok)) {
      failed.push(r);
      console.log(`     GAGAL: ${r.scenario} [${r.detail}]`);
    }
  }

  if (failed.length > 0) {
    console.error(`\n${failed.length} asersi gagal.`);
    process.exit(1);
  }
  console.log("\nSemua asersi RLS lulus.");
  process.exit(0);
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
