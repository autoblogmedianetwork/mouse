/**
 * Prompt 3 — generate status Threads, versi v2 (PRD F3, F3a, F4).
 *
 * v2 hanya menambah blok persona: judul persona dan deskripsi nadanya dirakit
 * dari `lib/ai/persona.ts` supaya model menerima arah nada, bukan sekadar satu
 * kata. Parameter lain sama dengan v1. v1 tidak diubah (AGENTS rule 10); fitur
 * berikutnya yang mengubah isi prompt ini harus memakai versi baru lagi.
 */
export const PROMPT_VERSION = "generate-status.v2";

import { labelPersonaUntukPrompt } from "@/lib/ai/persona";
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
  curiosity_gap: "Status pertama dibuka dengan formula CURIOSITY GAP: ungkapkan fakta unik atau celah penasaran yang memancing pembaca untuk membaca kelanjutannya tanpa clickbait palsu.",
  before_after: "Status pertama dibuka dengan formula BEFORE-AFTER: kontraskan kondisi repot/frustrasi sebelum menemukan solusi dengan kemudahan sesudahnya.",
  contrarian: "Status pertama dibuka dengan formula CONTRARIAN: bantah anggapan umum atau mitos keliru yang sering dipercaya seputar topik penawaran ini.",
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
  status_terakhir: "Letak link: sisipkan link produk di status TERAKHIR saja: ",
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
${personaLine}
- ${HOOK_INSTRUCTIONS[pengaturan.gaya_hook]}
- ${linkLine}
${trustLine}
${slopLine}
${instruksiLine}

Aturan keras:
- Setiap status MAKSIMAL 500 karakter. Hitung sebelum menjawab.
- Ikuti persona dan arah nadanya, tetapi jangan mengubah, menambah, atau mengarang fakta produk demi gaya.
- Bahasa Indonesia kasual, gaya Threads, tanpa hashtag berlebihan.
- Jangan mengarang spesifikasi, harga, klaim "terbaik", atau diskon yang tidak ada di data.
- Tulis tepat dalam rentang jumlah status yang diminta.
- Balas HANYA dalam JSON valid, tanpa teks lain dan tanpa markdown.

Format JSON:
{
  "statuses": ["status 1", "status 2"]
}`;
}
