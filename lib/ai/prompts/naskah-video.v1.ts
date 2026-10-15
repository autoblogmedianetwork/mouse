/**
 * Prompt 9 — naskah video tiga bagian, versi v1 (mode naskah video).
 *
 * Output: hook visual (3 detik pertama), fungsi produk, dan CTA, dengan durasi
 * total 30 sampai 60 detik. Divalidasi Zod di `lib/ai/schemas.ts`
 * (`naskahVideoSkema`); setiap bagian juga dibatasi 500 karakter karena hasil
 * disimpan ke bank konten yang punya constraint database itu (AGENTS aturan 10).
 */
export const PROMPT_VERSION = "naskah-video.v1";

import { labelPersonaUntukPrompt } from "@/lib/ai/persona";
import type { Ide, Pengaturan } from "@/lib/ai/schemas";

export interface NaskahVideoInput {
  namaProduk: string;
  ringkasan: string;
  fitur: string[];
  ide: Ide;
  pengaturan: Pengaturan;
}

export function buildNaskahVideoPrompt(input: NaskahVideoInput): string {
  const { pengaturan, ide } = input;

  const trustLine = pengaturan.aturan_kepercayaan
    ? "- Sebutkan satu batasan atau kekurangan produk yang jujur di bagian fungsi produk."
    : "- Tidak wajib menyebut kekurangan, tetapi tetap jangan mengarang kelebihan.";

  const instruksiLine = pengaturan.instruksi.trim()
    ? `- Instruksi tambahan dari user: ${pengaturan.instruksi.trim()}`
    : "";

  return `Kamu adalah penulis naskah video pendek affiliate Shopee berbahasa Indonesia kasual untuk video vertikal (rasio 9:16).

PRODUK: ${input.namaProduk}
Ringkasan: ${input.ringkasan}
Fitur: ${input.fitur.join("; ") || "-"}

KONTEN yang harus ditulis:
- Judul: ${ide.judul}
- Deskripsi ide: ${ide.deskripsi}
- Jembatan ke produk: ${ide.jembatan}

PENGATURAN:
- Persona: ${labelPersonaUntukPrompt(pengaturan.persona)}
- Durasi total video: 30 sampai 60 detik.
${trustLine}
${instruksiLine}

Struktur naskah (tepat tiga bagian, berurutan):
1. hook_visual: 3 detik pertama. Satu kalimat pembuka yang menghentikan scroll, plus arahan visual singkat dalam kurung siku, mis. [close-up produk di tangan, cahaya pagi].
2. fungsi_produk: bagian utama. Jelaskan satu atau dua fungsi nyata dari data produk; sertakan arahan visual singkat dalam kurung siku.
3. cta: ajakan singkat ke link affiliate di bio atau komentar, maksimal dua kalimat.

Aturan keras:
- Jangan mengarang spesifikasi, harga, diskon, atau klaim "terbaik" yang tidak ada di data.
- Setiap bagian maksimal 500 karakter.
- durasi_total_detik harus realistis: kira-kira 2 sampai 3 kata per detik untuk seluruh naskah, dan selalu antara 30 dan 60.
- Balas HANYA dalam JSON valid, tanpa teks lain dan tanpa markdown.

Format JSON:
{
  "hook_visual": "string",
  "fungsi_produk": "string",
  "cta": "string",
  "durasi_total_detik": 45
}`;
}
