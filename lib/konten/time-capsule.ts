/**
 * Time capsule: simpan draft untuk dibuka di tanggal mendatang (Gelombang 3).
 * Penyimpanan lokal (localStorage), tanpa API dan tanpa posting otomatis.
 */
import { z } from "zod";
import { bacaDaftar, tulisJson } from "@/lib/storage/kotak";

export const KUNCI_TIME_CAPSULE = "autothreads-time-capsule";

export const timeCapsuleSkema = z.object({
  id: z.string().min(1),
  judul: z.string().min(1).max(80),
  isi: z.string().min(1).max(2000),
  buka_pada: z.string().min(1),
  dibuat_pada: z.string().min(1),
  dibuka_pada: z.string().nullable().default(null),
});

export type TimeCapsule = z.infer<typeof timeCapsuleSkema>;

export function validasiTimeCapsule(
  judul: string,
  isi: string,
  bukaPada: string,
  sekarang: Date = new Date(),
): string | null {
  if (judul.trim() === "") return "Judul wajib diisi.";
  if (judul.trim().length > 80) return "Judul maksimal 80 karakter.";
  if (isi.trim() === "") return "Isi wajib diisi.";
  if (isi.trim().length > 2000) return "Isi maksimal 2000 karakter.";
  const tanggal = new Date(bukaPada);
  if (Number.isNaN(tanggal.getTime())) return "Tanggal buka tidak valid.";
  // Minimal besok: capsule harus menunggu.
  const besok = new Date(sekarang);
  besok.setDate(besok.getDate() + 1);
  besok.setHours(0, 0, 0, 0);
  if (tanggal < besok) return "Tanggal buka minimal besok.";
  return null;
}

export function buatTimeCapsule(
  judul: string,
  isi: string,
  bukaPada: string,
): TimeCapsule {
  return {
    id: crypto.randomUUID(),
    judul: judul.trim(),
    isi: isi.trim(),
    buka_pada: new Date(bukaPada).toISOString(),
    dibuat_pada: new Date().toISOString(),
    dibuka_pada: null,
  };
}

export function muatTimeCapsule(): TimeCapsule[] {
  return bacaDaftar<TimeCapsule>(KUNCI_TIME_CAPSULE, (e) => {
    const r = timeCapsuleSkema.safeParse(e);
    return r.success ? r.data : null;
  });
}

export function simpanTimeCapsule(daftar: TimeCapsule[]): void {
  tulisJson(KUNCI_TIME_CAPSULE, daftar);
}

export function siapDibuka(c: TimeCapsule, sekarang: Date = new Date()): boolean {
  return new Date(c.buka_pada) <= sekarang && c.dibuka_pada === null;
}

export function tandaiDibuka(
  daftar: TimeCapsule[],
  id: string,
  sekarang: Date = new Date(),
): TimeCapsule[] {
  return daftar.map((c) =>
    c.id === id && c.dibuka_pada === null
      ? { ...c, dibuka_pada: sekarang.toISOString() }
      : c,
  );
}

export function hapusTimeCapsule(daftar: TimeCapsule[], id: string): TimeCapsule[] {
  return daftar.filter((c) => c.id !== id);
}
