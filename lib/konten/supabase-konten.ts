/**
 * Pemetaan Bank konten lokal ke tabel Supabase (N-5).
 *
 * Sumber resmi riwayat hasil terakhir adalah tabel `contents` +
 * `threads_statuses` (migrasi 0001 sampai 0005). Modul ini hanya pemetaan murni
 * supaya bisa diuji tanpa jaringan; pemanggilan Supabase ada di route handler.
 *
 * Id konten lokal dipakai apa adanya sebagai `contents.id`, sehingga kirim
 * ulang bersifat idempoten (upsert), bukan menggandakan baris.
 */
import { z } from "zod";
import { kontenSkema, type Konten } from "./skema";

/** Jumlah konten terakhir yang ditampilkan (N-5). */
export const RIWAYAT_LIMIT = 15;

export const STATUS_KONTEN = [
  "draft",
  "siap_posting",
  "terjadwal",
  "terkirim",
  "gagal",
  "ditolak",
] as const;

const letakLink = z.enum(["status_terakhir", "balasan", "tanpa_link"]);

/** Kolom `contents` yang dibaca UI. Kolom lain dibiarkan di database. */
export const barisKontenSkema = z.object({
  id: z.string().min(1),
  judul_internal: z.string(),
  status: z.enum(STATUS_KONTEN),
  letak_link: letakLink.default("status_terakhir"),
  link_produk: z.string().nullable().default(null),
  gaya_hook: z.string().default("bawaan"),
  is_arsip: z.boolean().default(false),
  arsip_at: z.string().nullable().default(null),
  // numeric() bisa kembali sebagai string dari PostgREST.
  klik_manual: z.coerce.number().default(0),
  komisi_manual: z.coerce.number().default(0),
  pengaturan: z.record(z.string(), z.unknown()).default({}),
  created_at: z.string(),
  updated_at: z.string(),
});

export const barisStatusSkema = z.object({
  content_id: z.string().min(1),
  urutan: z.coerce.number().int(),
  teks: z.string(),
});

export type BarisKonten = z.infer<typeof barisKontenSkema>;
export type BarisStatus = z.infer<typeof barisStatusSkema>;

export interface BarisKontenBaru {
  id: string;
  user_id: string;
  judul_internal: string;
  status: Konten["status"];
  pengaturan: Record<string, unknown>;
  letak_link: Konten["letak_link"];
  link_produk: string | null;
  gaya_hook: string;
  is_arsip: boolean;
  arsip_at: string | null;
  klik_manual: number;
  komisi_manual: number;
  created_at: string;
  updated_at: string;
}

export interface BarisStatusBaru {
  user_id: string;
  content_id: string;
  urutan: number;
  teks: string;
}

/**
 * Saring konten lokal yang layak dikirim ke database. Konten lama atau rusak
 * (mis. status kosong) dilewati, bukan menggagalkan seluruh kiriman.
 */
export function kontenLayakKirim(daftar: unknown[]): Konten[] {
  return daftar.flatMap((item) => {
    const hasil = kontenSkema.safeParse(item);
    return hasil.success ? [hasil.data] : [];
  });
}

/** Konten lokal → baris `contents`. Checklist dan penanda otomatis masuk jsonb. */
export function kontenKeBaris(k: Konten, userId: string): BarisKontenBaru {
  return {
    id: k.id,
    user_id: userId,
    judul_internal: k.judul,
    status: k.status,
    pengaturan: { otomatis: k.otomatis, checklist: k.checklist },
    letak_link: k.letak_link,
    link_produk: k.link_produk.trim() === "" ? null : k.link_produk,
    gaya_hook: k.gaya_hook,
    is_arsip: k.arsip,
    arsip_at: k.arsip_at,
    klik_manual: k.klik_manual,
    komisi_manual: k.komisi_manual,
    created_at: k.created_at,
    updated_at: k.updated_at,
  };
}

/** Konten lokal → baris `threads_statuses`, urutan mulai 1 sesuai utas. */
export function statusKontenKeBaris(k: Konten, userId: string): BarisStatusBaru[] {
  return k.statuses
    .map((teks) => teks.trim())
    .filter((teks) => teks.length > 0)
    .map((teks, index) => ({
      user_id: userId,
      content_id: k.id,
      urutan: index + 1,
      teks,
    }));
}

/** Baris database → bentuk tampilan yang sama dengan Bank konten lokal. */
export function barisKeKonten(baris: BarisKonten, statuses: string[]): Konten {
  const teks = statuses.map((s) => s.trim()).filter((s) => s.length > 0);
  return kontenSkema.parse({
    id: baris.id,
    judul: baris.judul_internal,
    produk_nama: "",
    ide_judul: "",
    statuses: teks.length > 0 ? teks : ["(status belum tersimpan)"],
    status: baris.status,
    letak_link: baris.letak_link,
    gaya_hook: ["pertanyaan", "masalah_relatif", "pernyataan_mengejutkan", "bawaan"].includes(
      baris.gaya_hook,
    )
      ? baris.gaya_hook
      : "bawaan",
    link_produk: baris.link_produk ?? "",
    arsip: baris.is_arsip,
    arsip_at: baris.arsip_at,
    otomatis: baris.pengaturan.otomatis === true,
    checklist:
      baris.pengaturan.checklist && typeof baris.pengaturan.checklist === "object"
        ? (baris.pengaturan.checklist as Record<string, boolean>)
        : {},
    klik_manual: baris.klik_manual,
    komisi_manual: baris.komisi_manual,
    created_at: baris.created_at,
    updated_at: baris.updated_at,
  });
}

/** Konten terbaru lebih dulu, dipotong ke batas riwayat. */
export function urutkanRiwayat(list: Konten[], limit = RIWAYAT_LIMIT): Konten[] {
  return [...list]
    .sort((a, b) => Date.parse(b.updated_at) - Date.parse(a.updated_at))
    .slice(0, limit);
}

/** Id konten lokal yang belum ada di daftar server (untuk migrasi sekali jalan). */
export function belumDikirim(lokal: Konten[], server: Array<{ id: string }>): Konten[] {
  const adaDiServer = new Set(server.map((b) => b.id));
  return lokal.filter((k) => !adaDiServer.has(k.id));
}
