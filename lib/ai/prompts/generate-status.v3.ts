/**
 * Prompt 3 — generate status, versi v3 (fitur 9: batas platform).
 *
 * v3 hanya menambah parameter platform: batas karakter per status diambil dari
 * `lib/platforms/batas.ts` (Threads 500, X 280) alih-alih hard-coded 500, dan
 * baris gaya menyesuaikan platform tujuan. v1 dan v2 tidak diubah (AGENTS
 * aturan 13). Fitur format narasi (fitur 3) memakai versi v4.
 */
export const PROMPT_VERSION = "generate-status.v3";

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
}

const HOOK_INSTRUCTIONS: Record<Pengaturan["gaya_hook"], string> = {
  pertanyaan: "Status pertama dibuka dengan pertanyaan yang memancing rasa penasaran.",
  masalah_relatif: "Status pertama dibuka dengan masalah yang relatable bagi pembaca.",
  pernyataan_mengejutkan: "Status pertama dibuka dengan pernyataan mengejutkan (tetapi jujur, tanpa klaim berlebihan).",
  bawaan: "Status pertama dibuka dengan hook kuat yang cocok untuk platform ini.",
};

const LINK_INSTRUCTIONS: Record<Pengaturan["letak_link"], string> = {
  status_terakhir: "Letak link: sisipkan link produk di status TERAKHIR saja: ",
  balasan: "Letak link: JANGAN taruh link di utas utama. Tulis satu baris placeholder [LINK] yang akan dipindahkan ke balasan terpisah setelah generate.",
  tanpa_link: "Letak link: jangan sisipkan link apa pun.",
};

const GAYA_PLATFORM: Record<PlatformId, string> = {
  threads: "Gaya Threads: santai, percakapan, boleh panjang dan bernuansa cerita.",
  x: "Gaya X: ringkas dan tajam; satu ide per status; hindari basa-basi karena ruang sangat terbatas.",
};

export function buildGenerateStatusPrompt(input: GenerateStatusInput): string {
  const platform: PlatformId = input.platform ?? "threads";
  const batas = batasPlatform(platform);
  const { pengaturan, ide, link } = input;
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
    ? "- Wajib ada minimal satu status yang menyebut kekurangan atau batasan produk secara jujur."
    : "- Aturan kepercayaan nonaktif: tidak wajib menyebut kekurangan, tetapi tetap jangan mengarang kelebihan.";

  const slopLine = pengaturan.anti_ai_slop
    ? `- Anti AI Slop aktif: panjang antarstatus TIDAK boleh seragam (campur pendek dan panjang), bentuk tiap status harus berbeda (ada yang paragraf, ada yang daftar singkat, ada yang satu kalimat), dan dilarang membuka dengan frasa generik seperti "Dalam dunia yang serba cepat".`
    : "- Gaya bebas, panjang boleh lebih seragam.";

  const instruksiLine = pengaturan.instruksi.trim()
    ? `- Instruksi tambahan dari user: ${pengaturan.instruksi.trim()}`
    : "";

  return `Kamu adalah kreator konten affiliate Shopee berbahasa Indonesia kasual untuk platform ${platform === "x" ? "X" : "Threads"}.

PRODUK: ${input.namaProduk}
Ringkasan: ${input.ringkasan}
Fitur: ${input.fitur.join("; ") || "-"}

KONTEN yang harus ditulis:
- Judul: ${ide.judul}
- Deskripsi ide: ${ide.deskripsi}
- Jembatan ke produk: ${ide.jembatan}
- Label format: ${ide.format_label}

PENGATURAN:
- Platform tujuan: ${platform}. ${GAYA_PLATFORM[platform]}
- Jumlah status: ${rentang.min}-${rentang.max} status (pilih di rentang ini).
${panjangLine}
${personaLine}
- ${HOOK_INSTRUCTIONS[pengaturan.gaya_hook]}
- ${linkLine}
${trustLine}
${slopLine}
${instruksiLine}

Aturan keras:
- Setiap status MAKSIMAL ${batas} karakter. Hitung sebelum menjawab.
- Ikuti persona dan arah nadanya, tetapi jangan mengubah, menambah, atau mengarang fakta produk demi gaya.
- Bahasa Indonesia kasual, tanpa hashtag berlebihan.
- Jangan mengarang spesifikasi, harga, klaim "terbaik", atau diskon yang tidak ada di data.
- Tulis tepat dalam rentang jumlah status yang diminta.
- Balas HANYA dalam JSON valid, tanpa teks lain dan tanpa markdown.

Format JSON:
{
  "statuses": ["status 1", "status 2"]
}`;
}
