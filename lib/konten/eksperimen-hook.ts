/**
 * Eksperimen A/B manual untuk hook status (maksimum 5 varian).
 *
 * Ini jalur manual: user menulis beberapa varian hook, mempostingnya sendiri
 * (satu per satu, bukan otomatis), lalu mencatat varian mana yang menang
 * setelah data klik/komisi terkumpul. Tidak ada posting otomatis dan tidak ada
 * kunci AI — sesuai batas fitur "lokal, tanpa API".
 *
 * Modul ini menyimpan ke localStorage (sama pola dengan snippet CTA) dan
 * memisahkan logika murni (validasi, ringkasan) dari komponen UI.
 */
import { z } from "zod";
import { bacaDaftar, tulisJson } from "@/lib/storage/kotak";

export const KUNCI_EKSPERIMEN_HOOK = "autothreads-eksperimen-hook";
export const MAKS_VARIAN = 5;
export const MIN_VARIAN = 2;

export const eksperimenHookSkema = z.object({
  id: z.string().min(1),
  nama: z.string().min(1).max(80),
  /** 1–5 varian, masing-masing maksimum 500 karakter (panjang status Threads). */
  varian: z
    .array(z.string().min(1).max(500))
    .min(MIN_VARIAN)
    .max(MAKS_VARIAN),
  /** Indeks varian pemenang (0-based), atau null bila belum dicatat. */
  pemenang: z.number().int().min(0).nullable().default(null),
  dicatat_pada: z.string().nullable().default(null),
  dibuat_pada: z.string(),
});

export type EksperimenHook = z.infer<typeof eksperimenHookSkema>;

/** Validasi input sebelum membuat eksperimen. Kembalikan pesan galat atau null. */
export function validasiInput(nama: string, varian: string[]): string | null {
  const namaBersih = nama.trim();
  if (namaBersih === "") return "Nama eksperimen wajib diisi.";
  if (namaBersih.length > 80) return "Nama eksperimen maksimal 80 karakter.";
  const bersih = varian.map((v) => v.trim()).filter((v) => v !== "");
  if (bersih.length < MIN_VARIAN) {
    return `Isi minimal ${MIN_VARIAN} varian hook yang berbeda.`;
  }
  if (bersih.length > MAKS_VARIAN) {
    return `Maksimal ${MAKS_VARIAN} varian hook per eksperimen.`;
  }
  if (bersih.some((v) => v.length > 500)) {
    return "Satu varian melebihi 500 karakter.";
  }
  const unik = new Set(bersih.map((v) => v.toLowerCase()));
  if (unik.size !== bersih.length) {
    return "Varian hook tidak boleh sama persis.";
  }
  return null;
}

/** Normalisasi input: trim, buang baris kosong, kembalikan daftar varian bersih. */
export function bersihkanVarian(varian: string[]): string[] {
  return varian.map((v) => v.trim()).filter((v) => v !== "");
}

/** Buat objek eksperimen baru. Validasi harus dilakukan lebih dulu oleh pemanggil. */
export function buatEksperimen(nama: string, varian: string[]): EksperimenHook {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    nama: nama.trim(),
    varian: bersihkanVarian(varian),
    pemenang: null,
    dicatat_pada: null,
    dibuat_pada: now,
  };
}

export function muatEksperimen(): EksperimenHook[] {
  return bacaDaftar<EksperimenHook>(KUNCI_EKSPERIMEN_HOOK, (entry) => {
    const result = eksperimenHookSkema.safeParse(entry);
    if (!result.success) return null;
    const e = result.data;
    // Jaga konsistensi: pemenang harus berada di rentang varian.
    if (e.pemenang !== null && (e.pemenang < 0 || e.pemenang >= e.varian.length)) {
      return { ...e, pemenang: null, dicatat_pada: null };
    }
    return e;
  });
}

export function simpanEksperimen(daftar: EksperimenHook[]): void {
  tulisJson(KUNCI_EKSPERIMEN_HOOK, daftar);
}

/** Catat pemenang. Indeks -1 berarti batalkan catatan (kembali ke belum). */
export function catatPemenang(
  daftar: EksperimenHook[],
  id: string,
  indeks: number | null,
): { daftar: EksperimenHook[]; ok: boolean; alasan?: string } {
  const target = daftar.find((e) => e.id === id);
  if (!target) return { daftar, ok: false, alasan: "Eksperimen tidak ditemukan." };
  if (indeks !== null && (indeks < 0 || indeks >= target.varian.length)) {
    return { daftar, ok: false, alasan: "Varian pemenang tidak valid." };
  }
  const now = new Date().toISOString();
  return {
    ok: true,
    daftar: daftar.map((e) =>
      e.id === id
        ? { ...e, pemenang: indeks, dicatat_pada: indeks === null ? null : now }
        : e,
    ),
  };
}

export function hapusEksperimen(daftar: EksperimenHook[], id: string): EksperimenHook[] {
  return daftar.filter((e) => e.id !== id);
}

export interface RingkasanEksperimen {
  total: number;
  tercatat: number;
  /** Menang per slot varian, slot 0..MAKS_VARIAN-1. */
  per_slot: { slot: number; menang: number; persen: number }[];
  /** Eksperimen yang sudah dicatat pemenangnya, grouped by jumlah varian. */
  rata_varian: number;
}

export function ringkasanEksperimen(daftar: EksperimenHook[]): RingkasanEksperimen {
  const total = daftar.length;
  const tercatat = daftar.filter((e) => e.pemenang !== null).length;
  const per_slot = Array.from({ length: MAKS_VARIAN }, (_, slot) => {
    const menang = daftar.filter((e) => e.pemenang === slot).length;
    return {
      slot,
      menang,
      persen: tercatat > 0 ? (menang / tercatat) * 100 : 0,
    };
  });
  const rata_varian =
    total > 0 ? daftar.reduce((a, e) => a + e.varian.length, 0) / total : 0;
  return { total, tercatat, per_slot, rata_varian };
}
