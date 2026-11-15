/**
 * Prompt 13 — analisa gaya postingan publik (Gelombang 4).
 *
 * Versi: v2. Perubahan dari v1 (v1 TIDAK diubah, AGENTS rule 13):
 * - Batas salin dipertegas: maksimal 5 kata berturut-turut (dari "jangan menyalin
 *   kalimat utuh" yang masih kabur).
 * - "catchphrase" dibatasi 5 kata, karena frasa panjang = kutipan.
 * - Uji anti-plagiat: bila ragu, kosongkan.
 *
 * Tujuan tetap sama: MENYUSUN deskripsi gaya, bukan menyalin kalimat.
 */
export const PROMPT_VERSION = "analisa-gaya.v2";

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
- "pembuka": bagaimana biasanya post dibuka (jelaskan BENTUKNYA, jangan tiru kalimatnya), maksimal 2 pola.
- "nada": 3-5 kata sifat nada bicara (mis. "santai, skeptis, tidak menggurui").
- "ciri_khas": kebiasaan khas yang berulang (mis. "selalu menyebut kekurangan duluan", "sering mengaku salah dulu").
- "struktur": urutan khas isi post (mis. "masalah lalu cerita lalu kekurangan lalu kesimpulan").
- "catchphrase": frasa yang benar-benar berulang di post, MAKSIMAL 2 dan MAKSIMAL 5 KATA per frasa; kosongkan bila tidak ada yang konsisten atau bila lebih dari 5 kata.
- "gaya_bicara": satu paragraf padat (maksimal 300 karakter) siap ditempel ke kolom "Gaya bicara" persona. Tulis sebagai deskripsi orang ketiga, bukan salinan kalimat siapa pun.
- "keyakinan": "tinggi" bila pola konsisten di semua post, "sedang" bila sebagian, "rendah" bila post terlalu sedikit atau pendek — dan sebutkan alasannya di "catatan".

ATURAN ANTI-PLAGIAT (WAJIB):
- DILARANG menyalin lebih dari 5 kata berturut-turut dari postingan mana pun, di kolom mana pun.
- Tulis pola sebagai DESKRIPSI ("pembukanya berupa pertanyaan singkat"), bukan sebagai contoh kalimat yang meniru.
- Bila ragu apakah sebuah frasa masih termasuk kutipan, KOSONGKAN. Lebih aman kosong daripada menyalin.
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
