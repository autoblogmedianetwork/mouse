/**
 * One content → three ready-to-paste packages (Threads thread, TikTok caption,
 * WhatsApp status). Pure functions, no storage access, so the packaging rules
 * are unit-tested (Gelombang 2).
 */
import { BATAS_PLATFORM } from "@/lib/platforms/batas";
import type { Konten } from "./skema";

export interface KemasanKonten {
  threads: string;
  tiktok: string;
  whatsapp: string;
  /** Seluruh paket dengan judul bagian, untuk disalin sekali klik. */
  teks: string;
}

/** Potong teks ke batas platform tanpa memotong kata di tengah. */
export function potongAman(teks: string, batas: number): string {
  const rapi = teks.trim();
  if (rapi.length <= batas) return rapi;
  const ruang = batas - 1;
  if (ruang <= 0) return "";
  const mentah = rapi.slice(0, ruang);
  // Batas jatuh tepat di akhir kata: tidak perlu mundur lagi.
  const lanjut = rapi.slice(ruang, ruang + 1);
  if (lanjut === "" || lanjut === " ") return `${mentah.trimEnd()}…`;
  const spasi = mentah.lastIndexOf(" ");
  // Potong di kata terakhir hanya bila tidak memangkas terlalu banyak teks.
  const badan = spasi > ruang * 0.6 ? mentah.slice(0, spasi) : mentah;
  return `${badan.trimEnd()}…`;
}

/**
 * Kemasan lengkap (Gelombang 2). Threads memakai utas penuh karena tiap status
 * sudah dijaga 500 karakter; TikTok dan WhatsApp memakai status pembuka plus
 * link (bila letak link bukan "tanpa_link") dan dipotong sesuai batas platform.
 */
export function kemasanMultiPlatform(
  k: Pick<Konten, "judul" | "statuses" | "link_produk" | "letak_link">,
): KemasanKonten {
  const statuses = k.statuses.map((s) => s.trim()).filter((s) => s !== "");
  const pembuka = statuses[0] ?? "";
  const link = k.letak_link !== "tanpa_link" && k.link_produk.trim() !== "" ? k.link_produk.trim() : "";

  const threads = statuses.join("\n\n");

  const tiktokMentah = [pembuka, link].filter((s) => s !== "").join("\n\n");
  const tiktok = potongAman(tiktokMentah, BATAS_PLATFORM.tiktok_caption);

  const whatsappMentah = [pembuka, link].filter((s) => s !== "").join("\n\n");
  const whatsapp = potongAman(whatsappMentah, BATAS_PLATFORM.whatsapp_status);

  const teks = [
    `=== UTAS THREADS (${statuses.length} status) ===`,
    threads,
    "",
    "=== CAPTION TIKTOK ===",
    tiktok,
    "",
    "=== STATUS WHATSAPP ===",
    whatsapp,
  ].join("\n");

  return { threads, tiktok, whatsapp, teks };
}
