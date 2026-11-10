/**
 * Penyimpanan lokal untuk snippet CTA & penutup konten favorit (ADR 0020).
 * Disimpan di localStorage agar cepat, privat, dan siap dipakai 1-klik di editor.
 */

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
  if (typeof window === "undefined") return SNIPPET_BAWAAN;
  try {
    const raw = window.localStorage.getItem(KUNCI_STORAGE);
    if (!raw) return SNIPPET_BAWAAN;
    const data = JSON.parse(raw);
    return Array.isArray(data) && data.length > 0 ? data : SNIPPET_BAWAAN;
  } catch {
    return SNIPPET_BAWAAN;
  }
}

export function simpanSnippet(daftar: SnippetCTA[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KUNCI_STORAGE, JSON.stringify(daftar));
  } catch {
    // Abaikan kegagalan storage
  }
}
