/**
 * Prompt iklan Meta Ads untuk Heaviliate.
 *
 * Versi: v1. Jangan menimpa versi lama; buat v2 bila isi berubah (AGENTS rule 13).
 *
 * Menghasilkan 3 varian iklan Meta (headline, primary text, CTA) dalam suara
 * Pak Slem. Anti-clickbait dan patuh pada syarat Shopee Affiliate Indonesia:
 * kreatif tidak menyebut merek marketplace, tidak memakai keyword merek, dan
 * selalu memuat tanda materi promosi (#publi).
 */
import { ATURAN_BAHASA } from "@/lib/ai/gaya-bahasa";

export const PROMPT_VERSION = "iklan-meta.v1";

export interface IklanMetaInput {
  /** Nama atau deskripsi singkat produk. */
  produk: string;
  /** Harga jual bila diketahui (string supaya bebas format Rp). */
  harga?: string;
  /** Persentase komisi affiliate, untuk menakar sudut "hemat". */
  komisiPersen?: number;
}

export function buildAdIklanMetaPrompt(input: IklanMetaInput): string {
  const harga = input.harga?.trim() || "(tidak disebutkan)";
  const komisi = input.komisiPersen ?? 5;

  return `Kamu penulis iklan Meta (Facebook/Instagram) untuk afiliasi produk marketplace di Indonesia.

=== PRODUK ===
Nama/deskripsi: ${input.produk}
Harga jual: ${harga}
Komisi afiliasi: ${komisi}%

Tugasmu: tulis 3 VARIAN iklan yang berbeda sudut pendekatannya (misalnya: sudut masalah sehari-hari, sudut harga/hemat, sudut cerita pribadi). Tiap varian berisi headline, primary text, dan teks tombol CTA.

Aturan wajib:
- Bahasa Indonesia santai seperti orang beneran ngetik, bukan bahasa iklan korporat.
- Primary text maksimal 120 kata, kalimat pertama harus langsung memancing berhenti scroll.
- Sebut manfaat konkret dari produk, jangan mengarang klaim yang tidak ada di deskripsi.
- TIDAK BOLEH menyebut nama marketplace mana pun (Shopee, Tokopedia, dll) di headline, primary text, maupun CTA. Tautan afiliasi sudah membawa tujuannya sendiri.
- TIDAK BOLEH clickbait memancing klik palsu ("KLIK SEKARANG SEBELUM HILANG!!!"), tidak boleh janji hasil pasti, tidak boleh menyebut diskon yang tidak kamu ketahui.
- Setiap primary text diakhiri satu baris tanda materi promosi: "#publi".
- CTA maksimal 5 kata, berupa ajakan wajar (contoh: "Lihat detailnya", "Cek harganya").
- Jangan pakai kata formal: "merupakan", "tersedia", "memungkinkan", "tersebut".

${ATURAN_BAHASA}

Balas HANYA JSON valid, tanpa markdown dan tanpa teks lain. Format:
{
  "varian": [
    { "judul": "string", "isi": "string", "cta": "string" },
    { "judul": "string", "isi": "string", "cta": "string" },
    { "judul": "string", "isi": "string", "cta": "string" }
  ]
}`;
}
