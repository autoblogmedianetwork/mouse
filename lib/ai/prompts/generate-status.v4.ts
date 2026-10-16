/**
 * Prompt 3 — generate status, versi v4 (kategori penawaran non-marketplace & marketplace).
 *
 * v4 menambah kesadaran kategori penawaran:
 * - Hosting/SaaS: angle edukasi, perbandingan spesifikasi, kebutuhan siapa, value for money.
 * - Kursus: angle peningkatan skill, kurikulum, dan transformasi belajar.
 * - Marketplace: angle promo harga dan review produk kepraktisan harian.
 * - Lainnya: angle solusi masalah dan manfaat utama.
 * Batas platform Threads (500) dan X (280) tetap dipertahankan dari v3.
 * v1, v2, dan v3 tidak diubah (AGENTS aturan 13).
 */
export const PROMPT_VERSION = "generate-status.v4";

import { labelPersonaUntukPrompt } from "@/lib/ai/persona";
import { batasPlatform, type PlatformId } from "@/lib/platforms/batas";
import { BATAS_JUMLAH, type Ide, type Pengaturan } from "@/lib/ai/schemas";

export interface GenerateStatusInput {
  namaProduk: string;
  ringkasan: string;
  fitur: string[];
  ide: Ide;
  pengaturan: Pengaturan;
  link?: string;
  /** Platform tujuan; default Threads. Dipakai untuk batas karakter dan gaya. */
  platform?: PlatformId;
  /** Kategori penawaran untuk membedakan gaya konten */
  kategori?: string;
}

const HOOK_INSTRUCTIONS: Record<Pengaturan["gaya_hook"], string> = {
  pertanyaan: "Status pertama dibuka dengan pertanyaan yang memancing rasa penasaran.",
  masalah_relatif: "Status pertama dibuka dengan masalah yang relatable bagi pembaca.",
  pernyataan_mengejutkan: "Status pertama dibuka dengan pernyataan mengejutkan (tetapi jujur, tanpa klaim berlebihan).",
  bawaan: "Status pertama dibuka dengan hook kuat yang cocok untuk platform ini.",
};

const LINK_INSTRUCTIONS: Record<Pengaturan["letak_link"], string> = {
  status_terakhir: "Letak link: sisipkan link penawaran di status TERAKHIR saja: ",
  balasan: "Letak link: JANGAN taruh link di utas utama. Tulis satu baris placeholder [LINK] yang akan dipindahkan ke balasan terpisah setelah generate.",
  tanpa_link: "Letak link: jangan sisipkan link apa pun.",
};

const GAYA_PLATFORM: Record<PlatformId, string> = {
  threads: "Gaya Threads: santai, percakapan, boleh panjang dan bernuansa cerita.",
  x: "Gaya X: ringkas dan tajam; satu ide per status; hindari basa-basi karena ruang sangat terbatas.",
};

export function instruksiKategori(kategori?: string): string {
  const k = (kategori ?? "").toLowerCase().trim();
  if (k.includes("hosting") || k.includes("saas")) {
    return "- Kategori Penawaran (Hosting / SaaS): Gunakan sudut pandang EDUKASI dan PERBANDINGAN spesifikasi atau kebutuhan siapa (value for money). HINDARI hard-selling seperti promo harga murah meriah khas marketplace fisik.";
  }
  if (k.includes("kursus")) {
    return "- Kategori Penawaran (Kursus): Gunakan sudut pandang PENINGKATAN SKILL, kurikulum praktis, pemecahan masalah, dan hasil belajar nyata.";
  }
  if (k.includes("marketplace") || k.includes("shopee") || k.includes("tokopedia")) {
    return "- Kategori Penawaran (Marketplace): Gunakan sudut pandang REVIEW PRODUK, kepraktisan pemakaian harian, dan promo harga/manfaat belanja.";
  }
  return "- Kategori Penawaran: Gunakan sudut pandang pemecahan masalah dan manfaat nyata bagi pengguna.";
}

export function buildGenerateStatusPrompt(input: GenerateStatusInput): string {
  const platform: PlatformId = input.platform ?? "threads";
  const batas = batasPlatform(platform);
  const { pengaturan, ide, link, kategori } = input;
  const rentang = BATAS_JUMLAH[pengaturan.jumlah_status];

  const panjangLine =
    pengaturan.panjang_status === "singkat"
      ? "Panjang per status: singkat (1-3 kalimat)."
      : pengaturan.panjang_status === "sedang"
        ? "Panjang per status: sedang (3-6 kalimat)."
        : `Panjang per status: panjang (6-10 kalimat), tetapi tetap di bawah ${batas} karakter.`;

  const linkLine =
    pengaturan.letak_link === "status_terakhir" && link
      ? LINK_INSTRUCTIONS.status_terakhir + link
      : LINK_INSTRUCTIONS[pengaturan.letak_link];

  const personaLine = `- Persona: ${labelPersonaUntukPrompt(pengaturan.persona)}`;

  const trustLine = pengaturan.aturan_kepercayaan
    ? "- Wajib ada minimal satu status yang menyebut kekurangan atau batasan penawaran secara jujur."
    : "- Aturan kepercayaan nonaktif: tidak wajib menyebut kekurangan, tetapi tetap jangan mengarang kelebihan.";

  const slopLine = pengaturan.anti_ai_slop
    ? `- Anti AI Slop aktif: panjang antarstatus TIDAK boleh seragam (campur pendek dan panjang), bentuk tiap status harus berbeda (ada yang paragraf, ada yang daftar singkat, ada yang satu kalimat), dan dilarang membuka dengan frasa generik seperti "Dalam dunia yang serba cepat".`
    : "- Gaya bebas, panjang boleh lebih seragam.";

  const instruksiLine = pengaturan.instruksi.trim()
    ? `- Instruksi tambahan dari user: ${pengaturan.instruksi.trim()}`
    : "";

  const kategoriLine = instruksiKategori(kategori);

  return `Kamu adalah kreator konten affiliate berbahasa Indonesia kasual untuk platform ${platform === "x" ? "X" : "Threads"}.

PENAWARAN: ${input.namaProduk}
Kategori: ${kategori || "Umum"}
Ringkasan: ${input.ringkasan}
Fitur/Spesifikasi: ${input.fitur.join("; ") || "-"}

KONTEN yang harus ditulis:
- Judul: ${ide.judul}
- Deskripsi ide: ${ide.deskripsi}
- Jembatan ke penawaran: ${ide.jembatan}
- Label format: ${ide.format_label}

PENGATURAN:
- Platform tujuan: ${platform}. ${GAYA_PLATFORM[platform]}
- Jumlah status: ${rentang.min}-${rentang.max} status (pilih di rentang ini).
${panjangLine}
${personaLine}
${kategoriLine}
- ${HOOK_INSTRUCTIONS[pengaturan.gaya_hook]}
- ${linkLine}
${trustLine}
${slopLine}
${instruksiLine}

Aturan keras:
- Setiap status MAKSIMAL ${batas} karakter. Hitung sebelum menjawab.
- Ikuti persona dan arah nadanya, tetapi jangan mengubah, menambah, atau mengarang fakta penawaran demi gaya.
- Bahasa Indonesia kasual, tanpa hashtag berlebihan.
- Jangan mengarang spesifikasi, harga, klaim "terbaik", atau diskon yang tidak ada di data.
- Tulis tepat dalam rentang jumlah status yang diminta.
- Balas HANYA dalam JSON valid, tanpa teks lain dan tanpa markdown.

Format JSON:
{
  "statuses": ["status 1", "status 2"]
}`;
}
