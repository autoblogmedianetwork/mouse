/**
 * Penyimpanan lokal untuk snippet CTA & penutup konten favorit (ADR 0020).
 * Disimpan di localStorage agar cepat, privat, dan siap dipakai 1-klik di editor.
 */
import { bacaDaftar, tulisJson } from "@/lib/storage/kotak";

export interface SnippetCTA {
  id: string;
  label: string;
  teks: string;
}

export const SNIPPET_BAWAAN: SnippetCTA[] = [
  {
    id: "cta-bio",
    label: "Link di Bio",
    teks: "Tautan produk sudah ada di bio nomor urut ya! Cek sebelum promonya selesai.",
  },
  {
    id: "cta-balasan",
    label: "Komentar / Balasan",
    teks: "Link checkout resminya aku simpan di balasan pertama di bawah ya 👇",
  },
  {
    id: "cta-tanya",
    label: "Ajak Diskusi",
    teks: "Ada yang udah pernah pakai varian ini juga? Cerita di kolom komentar dong!",
  },
  {
    id: "cta-dm",
    label: "Minta Link DM",
    teks: "Komen 'MAU' nanti aku kirim link toko resminya langsung ke pesan kamu ya.",
  },
];

const KUNCI_STORAGE = "autothreads-snippet-cta";

export function muatSnippet(): SnippetCTA[] {
  // Kosong = pakai bawaan; daftar bawaan tidak boleh tertimpa array kosong.
  const hasil = bacaDaftar<SnippetCTA>(KUNCI_STORAGE, (x) => (typeof x === "object" && x !== null ? (x as SnippetCTA) : null));
  return hasil.length > 0 ? hasil : SNIPPET_BAWAAN;
}

export function simpanSnippet(daftar: SnippetCTA[]): void {
  tulisJson(KUNCI_STORAGE, daftar);
}
