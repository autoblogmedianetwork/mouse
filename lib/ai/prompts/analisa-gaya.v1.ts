/**
 * Prompt 13 — analisa gaya postingan publik (Gelombang 4).
 *
 * Versi: v1. Jangan menimpa versi lama; buat v2 jika isi berubah (AGENTS rule 13).
 *
 * User menempel 3-5 postingan publik (miliknya sendiri atau akun lain yang
 * ingin dijadikan referensi) TANPA username. Tujuannya MENYUSUN deskripsi
 * gaya, bukan menyalin kalimat: hasilnya dipakai untuk mengisi persona
 * bernama di Pengaturan.
 */
export const PROMPT_VERSION = "analisa-gaya.v1";

import { ATURAN_BAHASA } from "@/lib/ai/gaya-bahasa";

export interface AnalisaGayaInput {
  /** Teks post mentah yang ditempel user, dipisah baris kosong. */
  postMentah: string;
}

export function buildAnalisaGayaPrompt(input: AnalisaGayaInput): string {
  return `Kamu analis gaya menulis untuk konten Threads berbahasa Indonesia.

Berikut 3-5 postingan publik yang ditempel user. Mereka ingin MENIRU POLA gaya bicaranya (bukan menyalin kalimatnya) untuk karakter konten afiliasi mereka.

=== POSTINGAN ===
${input.postMentah}
=== AKHIR POSTINGAN ===

Tugasmu: kenali POLA, bukan isi. Jangan pernah menyalin kalimat dari postingan; ringkas polanya saja.

Keluaran:
- "pola_kalimat": panjang kalimat (pendek/sedang/panjang), jumlah baris per post, pakai emoji atau tidak, pakai huruf kapital di awal atau tidak.
- "pembuka": bagaimana biasanya post dibuka (contoh bentuk, bukan salinan), maksimal 2 pola.
- "nada": 3-5 kata sifat nada bicara (mis. "santai, skeptis, tidak menggurui").
- "ciri_khas": kebiasaan khas yang berulang (mis. "selalu menyebut kekurangan duluan", "sering pakai kata 'jujur ya'").
- "struktur": urutan khas isi post (mis. "masalah → cerita → kekurangan → kesimpulan").
- "catchphrase": frasa yang benar-benar berulang di post, MAKSIMAL 2; kosongkan bila tidak ada yang konsisten.
- "gaya_bicara": satu paragraf padat (maksimal 300 karakter) siap ditempel ke kolom "Gaya bicara" persona. Tulis sebagai deskripsi orang ketiga, bukan salinan kalimat siapa pun.
- "keyakinan": "tinggi" bila pola konsisten di semua post, "sedang" bila sebagian, "rendah" bila post terlalu sedikit/pendek — dan sebutkan alasannya di "catatan".

Aturan:
- JANGAN menyalin kalimat utuh dari postingan.
- JANGAN menyebut nama orang, akun, atau merek yang muncul.
- Bila data terlalu sedikit (kurang dari 3 post atau isinya sangat pendek), tetap jawab dengan "keyakinan": "rendah" dan jelaskan di "catatan".

${ATURAN_BAHASA}

Balas HANYA dalam JSON valid, tanpa teks lain dan tanpa markdown. Format:
{
  "pola_kalimat": "string",
  "pembuka": ["string"],
  "nada": ["string"],
  "ciri_khas": ["string"],
  "struktur": "string",
  "catchphrase": ["string"],
  "gaya_bicara": "string",
  "keyakinan": "tinggi | sedang | rendah",
  "catatan": "string"
}`;
}
