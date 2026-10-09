/**
 * Prompt 3 — generate status Threads (PRD F3, F3a, F4, 10.4).
 * Versi: v1. Jangan menimpa versi lama; buat v2 jika isi berubah (AGENTS rule 10).
 *
 * Parameter panjang, kepadatan, Anti AI Slop, persona, hook, letak link,
 * dan aturan kepercayaan masuk ke prompt sesuai F3/F3a.
 */
export const PROMPT_VERSION = "generate-status.v1";

import { BATAS_JUMLAH, type Ide, type Pengaturan } from "@/lib/ai/schemas";

export interface GenerateStatusInput {
  namaProduk: string;
  ringkasan: string;
  fitur: string[];
  ide: Ide;
  pengaturan: Pengaturan;
  link?: string;
}

const HOOK_INSTRUCTIONS: Record<Pengaturan["gaya_hook"], string> = {
  pertanyaan: "Status pertama dibuka dengan pertanyaan yang memancing rasa penasaran.",
  masalah_relatif: "Status pertama dibuka dengan masalah yang relatable bagi pembaca.",
  pernyataan_mengejutkan: "Status pertama dibuka dengan pernyataan mengejutkan (tetapi jujur, tanpa klaim berlebihan).",
  bawaan: "Status pertama dibuka dengan hook kuat yang cocok untuk Threads.",
};

const LENGTH_INSTRUCTIONS: Record<Pengaturan["panjang_status"], string> = {
  singkat: "Panjang per status: singkat (1-3 kalimat).",
  sedang: "Panjang per status: sedang (3-6 kalimat).",
  panjang: "Panjang per status: panjang (6-10 kalimat), tetapi tetap di bawah 500 karakter.",
};

const LINK_INSTRUCTIONS: Record<Pengaturan["letak_link"], string> = {
  status_terakhir: `Letak link: sisipkan link produk di status TERAKHIR saja: ${""}${""}`,
  balasan: "Letak link: JANGAN taruh link di utas utama. Tulis satu baris placeholder [LINK] yang akan dipindahkan ke balasan terpisah setelah generate.",
  tanpa_link: "Letak link: jangan sisipkan link apa pun.",
};

export function buildGenerateStatusPrompt(input: GenerateStatusInput): string {
  const { pengaturan, ide, link } = input;
  const batas = BATAS_JUMLAH[pengaturan.jumlah_status];

  const linkLine =
    pengaturan.letak_link === "status_terakhir" && link
      ? LINK_INSTRUCTIONS.status_terakhir + link
      : LINK_INSTRUCTIONS[pengaturan.letak_link];

  const trustLine = pengaturan.aturan_kepercayaan
    ? "- Wajib ada minimal satu status yang menyebut kekurangan atau batasan produk secara jujur."
    : "- Aturan kepercayaan nonaktif: tidak wajib menyebut kekurangan, tetapi tetap jangan mengarang kelebihan.";

  const slopLine = pengaturan.anti_ai_slop
    ? `- Anti AI Slop aktif: panjang antarstatus TIDAK boleh seragam (campur pendek dan panjang), bentuk tiap status harus berbeda (ada yang paragraf, ada yang daftar singkat, ada yang satu kalimat), dan dilarang membuka dengan frasa generik seperti "Dalam dunia yang serba cepat".`
    : "- Gaya bebas, panjang boleh lebih seragam.";

  const instruksiLine = pengaturan.instruksi.trim()
    ? `- Instruksi tambahan dari user: ${pengaturan.instruksi.trim()}`
    : "";

  return `Kamu adalah kreator konten affiliate Shopee untuk Threads berbahasa Indonesia kasual.

PRODUK: ${input.namaProduk}
Ringkasan: ${input.ringkasan}
Fitur: ${input.fitur.join("; ") || "-"}

KONTEN yang harus ditulis:
- Judul: ${ide.judul}
- Deskripsi ide: ${ide.deskripsi}
- Jembatan ke produk: ${ide.jembatan}
- Label format: ${ide.format_label}

PENGATURAN:
- Jumlah status: ${batas.min}-${batas.max} status (pilih di rentang ini).
${LENGTH_INSTRUCTIONS[pengaturan.panjang_status]}
- Persona: ${pengaturan.persona}
- ${HOOK_INSTRUCTIONS[pengaturan.gaya_hook]}
- ${linkLine}
${trustLine}
${slopLine}
${instruksiLine}

Aturan keras:
- Setiap status MAKSIMAL 500 karakter. Hitung sebelum menjawab.
- Bahasa Indonesia kasual, gaya Threads, tanpa hashtag berlebihan.
- Jangan mengarang spesifikasi, harga, klaim "terbaik", atau diskon yang tidak ada di data.
- Tulis tepat dalam rentang jumlah status yang diminta.
- Balas HANYA dalam JSON valid, tanpa teks lain dan tanpa markdown.

Format JSON:
{
  "statuses": ["status 1", "status 2"]
}`;
}
