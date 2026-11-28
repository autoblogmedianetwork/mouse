import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Penjaga RLS seluruh migrasi.
 *
 * Anon key Supabase ikut terkirim ke browser, jadi tabel yang tidak mengaktifkan
 * Row Level Security bisa dibaca dan ditulis siapa pun lewat PostgREST.
 * Migrasi 0017 pernah lolos tanpa RLS; aturan ini mencegah terulang.
 */
const DIR = join(process.cwd(), "supabase", "migrations");
const berkas = readdirSync(DIR).filter((f) => f.endsWith(".sql"));

function semuaTeks(): string {
  return berkas.map((f) => readFileSync(join(DIR, f), "utf8")).join("\n");
}

function kumpulkan(pola: RegExp): Set<string> {
  const hasil = new Set<string>();
  for (const m of semuaTeks().matchAll(pola)) hasil.add(m[1].toLowerCase());
  return hasil;
}

describe("migrasi Supabase", () => {
  it("ada berkas migrasi yang terbaca", () => {
    expect(berkas.length).toBeGreaterThan(0);
  });

  it("setiap tabel yang dibuat punya RLS aktif di suatu migrasi", () => {
    const dibuat = kumpulkan(/create\s+table\s+(?:if\s+not\s+exists\s+)?(?:public\.)?(\w+)/gi);
    const berRls = kumpulkan(
      /alter\s+table\s+(?:if\s+exists\s+)?(?:public\.)?(\w+)\s+enable\s+row\s+level\s+security/gi,
    );

    const tanpaRls = [...dibuat].filter((t) => !berRls.has(t));
    expect(tanpaRls, `tabel tanpa RLS: ${tanpaRls.join(", ")}`).toEqual([]);
  });
});
