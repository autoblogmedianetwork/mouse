/**
 * Gamifikasi lokal: XP, level, badge. Penyimpanan localStorage, tanpa API.
 * XP bertambah lewat aksi user (mis. membuat/pos konten); tidak otomatis.
 */
import { z } from "zod";
import { bacaSkema, tulisJson } from "@/lib/storage/kotak";

export const KUNCI_GAMIFIKASI = "autothreads-gamifikasi";
export const XP_PER_LEVEL = 100;

export const profilGamifikasiSkema = z.object({
  xp: z.number().int().min(0),
  riwayat: z
    .array(
      z.object({
        aksi: z.string().min(1).max(80),
        xp: z.number().int(),
        tanggal: z.string().min(1),
      }),
    )
    .default([]),
});

export type ProfilGamifikasi = z.infer<typeof profilGamifikasiSkema>;

export function levelDariXp(xp: number): number {
  return Math.floor(Math.max(0, xp) / XP_PER_LEVEL) + 1;
}

export function xpKeLevelBerikutnya(xp: number): { level: number; xpDiLevel: number; sisa: number } {
  const level = levelDariXp(xp);
  const xpDiLevel = xp - (level - 1) * XP_PER_LEVEL;
  return { level, xpDiLevel, sisa: XP_PER_LEVEL - xpDiLevel };
}

export function badgeUntukLevel(level: number): string[] {
  const badges: string[] = [];
  if (level >= 2) badges.push("Pemula Konsisten");
  if (level >= 5) badges.push("Pembuat Konten");
  if (level >= 10) badges.push("Affiliate Aktif");
  if (level >= 20) badges.push("Master Affiliate");
  return badges;
}

export function muatProfil(): ProfilGamifikasi {
  return bacaSkema(KUNCI_GAMIFIKASI, profilGamifikasiSkema, { xp: 0, riwayat: [] });
}

export function simpanProfil(p: ProfilGamifikasi): void {
  tulisJson(KUNCI_GAMIFIKASI, p);
}

export function tambahXp(
  profil: ProfilGamifikasi,
  aksi: string,
  jumlah: number,
): ProfilGamifikasi {
  const next: ProfilGamifikasi = {
    xp: Math.max(0, profil.xp + jumlah),
    riwayat: [
      { aksi: aksi.trim() || "aksi", xp: jumlah, tanggal: new Date().toISOString() },
      ...profil.riwayat,
    ].slice(0, 50),
  };
  return next;
}

export function resetProfil(): ProfilGamifikasi {
  return { xp: 0, riwayat: [] };
}
