/**
 * Tag pelacak Shopee (Gelombang 4) — khusus link Shopee Affiliate.
 *
 * Shopee hanya menerima karakter alfanumerik (a-z, A-Z, 0-9) pada parameter
 * `tag`, jadi nama produk harus diubah ke PascalCase tanpa spasi/tanda baca.
 * Tag disimpan per konten supaya laporan bulanan tetap konsisten; tagging
 * ulang dengan nama berbeda membuat data terpecah.
 */

/** Batas aman panjang tag. Shopee membatasi kolom tag; 30 karakter aman. */
export const MAKS_TAG = 30;

/** Platform yang bisa dipilih saat menyalin link. */
export const PLATFORM_TAG = ["threads", "instagram", "tiktok", "facebook", "whatsapp"] as const;
export type PlatformTag = (typeof PLATFORM_TAG)[number];

export const KODE_PLATFORM: Record<PlatformTag, string> = {
  threads: "TH",
  instagram: "IG",
  tiktok: "TT",
  facebook: "FB",
  whatsapp: "WA",
};

export const LABEL_PLATFORM: Record<PlatformTag, string> = {
  threads: "Threads",
  instagram: "Instagram",
  tiktok: "TikTok",
  facebook: "Facebook",
  whatsapp: "WhatsApp",
};

/** Jenis konten mengikuti gaya hook yang sudah dipakai skema Konten. */
export const JENIS_TAG = ["status", "story", "video", "review"] as const;
export type JenisTag = (typeof JENIS_TAG)[number];

export const KODE_JENIS: Record<JenisTag, string> = {
  status: "Status",
  story: "Story",
  video: "Video",
  review: "Review",
};

/** Pendekkan nama produk menjadi PascalCase alfanumerik. */
export function rapikanNamaProduk(nama: string, maks = 14): string {
  const bersih = (nama ?? "")
    .normalize("NFD")
    // buang diakritik agar tetap a-z
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .trim();
  if (bersih === "") return "Produk";
  const kata = bersih.split(/\s+/).filter((k) => k !== "");
  const pascal = kata
    .map((k) => k.charAt(0).toUpperCase() + k.slice(1).toLowerCase())
    .join("");
  return pascal.slice(0, maks);
}

/**
 * Susun tag: [Platform][Jenis][NamaProduk] lalu jepit ke MAKS_TAG.
 * Awalan platform+jenis tidak pernah dipotong supaya laporan tetap terbaca.
 */
export function susunTag(
  platform: PlatformTag,
  jenis: JenisTag,
  namaProduk: string,
): string {
  const awalan = `${KODE_PLATFORM[platform]}${KODE_JENIS[jenis]}`;
  const sisa = Math.max(4, MAKS_TAG - awalan.length);
  return `${awalan}${rapikanNamaProduk(namaProduk, sisa)}`.slice(0, MAKS_TAG);
}

/** True bila tag hanya berisi huruf/angka dan tidak kosong. */
export function tagValid(tag: string): boolean {
  return /^[a-zA-Z0-9]{1,30}$/.test((tag ?? "").trim());
}

/**
 * Tempelkan tag ke link Shopee. Link yang sudah punya `tag` diganti, bukan
 * ditambah, supaya tidak muncul dua parameter tag.
 * Mengembalikan link apa adanya bila bukan URL valid.
 */
export function pasangTag(link: string, tag: string): string {
  const bersih = (link ?? "").trim();
  const t = (tag ?? "").trim();
  if (bersih === "" || !tagValid(t)) return bersih;
  try {
    const url = new URL(bersih);
    url.searchParams.set("tag", t);
    return url.toString();
  } catch {
    return bersih;
  }
}

/** Ambil tag yang sudah ada di link, atau null. */
export function tagDariLink(link: string): string | null {
  try {
    const nilai = new URL((link ?? "").trim()).searchParams.get("tag");
    return nilai && nilai !== "" ? nilai : null;
  } catch {
    return null;
  }
}
