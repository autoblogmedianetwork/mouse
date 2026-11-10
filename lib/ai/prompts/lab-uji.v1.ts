/**
 * Prompt 12 — lab uji konten / simulator pembeli (Gelombang 3).
 * Versi: v1. Jangan menimpa versi lama; buat v2 bila isi berubah (AGENTS rule 13).
 */
export const PROMPT_VERSION = "lab-uji.v1";

import { ATURAN_BAHASA } from "@/lib/ai/gaya-bahasa";
import { LABEL_LAB_PERSONA } from "@/lib/ai/schemas";

export interface LabUjiInput {
  statuses: string[];
  produk?: string;
}

export function buildLabUjiPrompt(input: LabUjiInput): string {
  const isi = input.statuses.map((s, i) => `[${i + 1}] ${s}`).join("\n\n");
  return `Kamu memerankan TIGA pembeli virtual yang membaca konten affiliate di media sosial. Tugasmu menilai konten sebelum diposting, bukan menulis ulang kontennya.

Produk: ${input.produk?.trim() || "tidak disebutkan"}

Konten yang diuji:
${isi}

Tiga persona (nilai "persona" wajib salah satu dari kode ini):
- skeptis — ${LABEL_LAB_PERSONA.skeptis}. Cepat curiga pada klaim berlebihan, ingin bukti, malas baca yang bertele-tele.
- ibu_muda — ${LABEL_LAB_PERSONA.ibu_muda}. Sibuk, memikirkan harga dan kepraktisan, sensitif pada rasa aman untuk keluarga.
- mahasiswa — ${LABEL_LAB_PERSONA.mahasiswa}. Budget ketat, suka hal relatable, benci gaya iklan kaku.

Tugasmu:
1. Beri skor kesiapan konten 0-100 (100 = layak posting tanpa revisi).
2. Untuk SETIAP persona, tulis reaksi jujur 1-3 kalimat seperti komentar asli, 0-3 keberatan utama, dan satu saran perbaikan konkret.
3. Ringkas dalam 1-2 kalimat: kekuatan terbesar dan kelemahan terbesar konten ini.
4. Sorot bila ada klaim berlebihan, urgensi palsu, atau janji hasil yang tidak bisa dibuktikan.

Aturan:
- Nilai HANYA dari teks yang diberikan. Jangan mengarang fakta produk.
- Keberatan harus spesifik ke kalimatnya, bukan pujian/keluhan generik.
- Balas HANYA dalam JSON valid, tanpa teks lain dan tanpa markdown.

Format JSON:
{
  "skor": 0,
  "ringkasan": "string",
  "penilaian": [
    {
      "persona": "skeptis | ibu_muda | mahasiswa",
      "reaksi": "string",
      "keberatan": ["string"],
      "saran": "string"
    }
  ]
}

${ATURAN_BAHASA}`;
}
