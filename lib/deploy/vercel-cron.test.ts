import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Penjaga paket hosting: akun Vercel Hobby hanya mengizinkan cron sekali
 * sehari. Cron 15 menit pernah membuat SELURUH deployment gagal dengan
 * "Hobby accounts are limited to daily cron jobs", jadi jadwalnya dikunci
 * di sini. Kalau butuh lebih sering, pakai pg_cron Supabase —
 * lihat docs/jadwal-kirim.md — jangan menaikkan frekuensi di vercel.json.
 */
const mentah = readFileSync(join(process.cwd(), "vercel.json"), "utf-8");
const konfigurasi = JSON.parse(mentah) as {
  crons?: Array<{ path: string; schedule: string }>;
};

/** Cron dianggap paling sering sekali sehari bila menit dan jam tidak berpola. */
function palingSeringSekaliSehari(schedule: string): boolean {
  const bagian = schedule.trim().split(/\s+/);
  if (bagian.length !== 5) return false;
  const [menit, jam] = bagian;
  const tetap = (kolom: string) => /^\d{1,2}$/.test(kolom);
  return tetap(menit) && tetap(jam);
}

describe("cron Vercel harus ramah paket Hobby", () => {
  it("vercel.json bisa dibaca dan punya daftar cron", () => {
    expect(Array.isArray(konfigurasi.crons)).toBe(true);
    expect(konfigurasi.crons?.length ?? 0).toBeGreaterThan(0);
  });

  it("tidak ada jadwal yang lebih sering dari sekali sehari", () => {
    for (const cron of konfigurasi.crons ?? []) {
      expect(
        palingSeringSekaliSehari(cron.schedule),
        `${cron.path} memakai "${cron.schedule}" — paket Hobby menolak jadwal lebih sering dari harian`,
      ).toBe(true);
    }
  });

  it("endpoint kirim otomatis tetap terjadwal", () => {
    const jalur = (konfigurasi.crons ?? []).map((c) => c.path);
    expect(jalur).toContain("/api/threads/proses-jadwal");
  });
});
