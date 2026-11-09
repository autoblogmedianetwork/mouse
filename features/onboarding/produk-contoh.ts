import type { SavedProduct } from "@/features/posting/form-produk-manual";

/**
 * Onboarding helpers (Fase 1, task C).
 *
 * Flag localStorage: begitu tur selesai (atau ditutup dengan cara apa pun),
 * tur tidak muncul lagi. Kunci draft harus sama persis dengan DRAFT_KEY di
 * features/posting/alur-buat-posting.tsx supaya produk contoh langsung
 * terbaca oleh form Buat posting.
 */
export const ONBOARDING_KEY = "autothreads-onboarding-selesai";
export const DRAFT_POSTING_KEY = "autothreads-draft-posting";

export function onboardingSelesai(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(ONBOARDING_KEY) === "1";
  } catch {
    return true;
  }
}

export function tandaiOnboardingSelesai(): void {
  try {
    window.localStorage.setItem(ONBOARDING_KEY, "1");
  } catch {
    // Penyimpanan penuh/diblokir: tur tetap berjalan di sesi ini saja.
  }
}

/** Produk contoh yang jelas ditandai sebagai contoh, mudah dihapus user. */
export function buatProdukContoh(stempelWaktu = new Date().toISOString()): SavedProduct {
  return {
    id: "contoh-tumbler-stainless",
    saved_at: stempelWaktu,
    nama_internal: "Contoh: Tumbler Stainless 500ml",
    nama: "Tumbler Stainless Steel 500ml",
    varian: "Hitam matte",
    harga: "89000",
    deskripsi:
      "Tumbler stainless 500 ml dengan dinding dua lapis. Air tetap panas sampai 6 jam dan dingin sampai 10 jam. Tutup geser bisa dibuka satu tangan, aman untuk dibawa di tas karena tutupnya kencang. Bagian luarnya matte anti sidik jari, dasarnya muat di holder gelas mobil. Tidak untuk minuman bersoda atau microwave.",
    deskripsi_bersih:
      "Tumbler stainless 500 ml dengan dinding dua lapis. Air tetap panas sampai 6 jam dan dingin sampai 10 jam. Tutup geser bisa dibuka satu tangan, aman untuk dibawa di tas karena tutupnya kencang. Bagian luarnya matte anti sidik jari, dasarnya muat di holder gelas mobil. Tidak untuk minuman bersoda atau microwave.",
    url_referensi: "",
  };
}

/**
 * Tulis draft berisi produk contoh ke localStorage supaya form Buat posting
 * terbuka dengan langkah 1 sudah terisi. Sisanya memakai default (loadDraft
 * di alur-buat-posting menggabungkan dengan DRAFT_AWAL).
 */
export function siapkanDraftProdukContoh(produk: SavedProduct = buatProdukContoh()): void {
  try {
    window.localStorage.setItem(
      DRAFT_POSTING_KEY,
      JSON.stringify({ produk, updatedAt: new Date().toISOString() }),
    );
  } catch {
    // Penyimpanan tidak tersedia: user tetap bisa isi form manual.
  }
}
