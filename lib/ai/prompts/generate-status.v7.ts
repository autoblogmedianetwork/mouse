/**
 * Prompt 3 — generate status, versi v7 (anti-terjemahan).
 *
 * Wrapper di atas v6: kategori, hook, persona, gaya bahasa, dan kerangka tetap
 * utuh; v7 menambahkan blok `ATURAN_ANTI_TERJEMAHAN` di akhir prompt.
 *
 * Alasan: model kecil (mis. Nemotron lightning di OpenRouter) menghasilkan
 * kalimat yang gramatikalnya benar tetapi berpola iklan Inggris yang
 * diterjemahkan kata per kata — "Pernah nyesel kalau…?", "Hidup di warung itu
 * kan penuh tantangan", "Ada solusi yang bisa bikin semua lebih nyaman".
 * Larangan kata formal di v5/v6 tidak menyentuh pola itu, dan model kecil jauh
 * lebih patuh pada contoh konkret daripada pada daftar larangan. Karena itu
 * blok ini memuat larangan pola, kewajiban detail nyata, batas panjang, dan
 * tiga pasang contoh sebelum → sesudah.
 *
 * v1–v6 tidak diubah (AGENTS rule 13).
 */
export const PROMPT_VERSION = "generate-status.v7";

import { buildGenerateStatusPrompt as buildV6 } from "./generate-status.v6";

export type { GenerateStatusInput } from "./generate-status.v6";

/**
 * Ditulis dalam bahasa Indonesia karena model membaca prompt dalam bahasa
 * Indonesia (lihat catatan di `lib/ai/gaya-bahasa.ts`).
 */
export const ATURAN_ANTI_TERJEMAHAN = `ANTI-TERJEMAHAN (WAJIB, lebih kuat dari aturan lain di atas):

1. Kalimat yang bisa diterjemahkan balik ke bahasa Inggris lalu tetap terdengar wajar seperti iklan = kalimat terjemahan. Buang dan tulis ulang.
2. DILARANG membuka dengan pertanyaan retoris: "Pernah ...?", "Siapa yang ...?", "Pernah nyesel ...?".
3. DILARANG frasa klise terjemahan ini, dalam bentuk apa pun: "di tengah keramaian", "penuh tantangan", "ada solusi yang", "bikin semua lebih nyaman", "rasa dingin", "pelanggan rasa ...", "hidup di ... itu kan ...", "solusi tepat untuk", "tak perlu khawatir lagi".
4. DILARANG memakai partikel "kan", "loh", "nih" sebagai pengisi kalimat. Pakai hanya kalau benar-benar bunyi seperti orang ngobrol.
5. WAJIB menyebut minimal satu hal konkret dari data produk: harga, ukuran, isi, bahan, atau jumlah. Kalau datanya tidak ada, sebut satu situasi spesifik yang jelas (siapa, kapan, berapa lama). Jangan mengarang angka atau klaim.
6. Panjang 2–4 kalimat, target di bawah 300 karakter. Satu ide saja, jangan menumpuk manfaat.
7. Setelah menulis, periksa: apakah ada satu detail yang bisa diingat pembaca? Kalau tidak ada, ulang dari awal.

CONTOH (ilustrasi pola, bukan data untuk dipakai):
- Sebelum: "Pernah nyesel kalau nasi hangat hilang cepat di warung?" → Sesudah: "Nasi baru matang cuma hangat sekitar 15 menit. Lewat itu, pembeli sudah mikir dua kali."
- Sebelum: "Karyawan juga ribet cari air dingin sambil buka." → Sesudah: "Satu orang harus bolak-balik ke kulkas tiap ada yang minta es, padahal meja masih penuh."
- Sebelum: "Ada solusi yang bisa bikin semua lebih nyaman." → Sesudah: "Wadah 1,8 liter ini menahan dingin sampai 12 jam, jadi tidak perlu angkat kulkas lagi."`;

/**
 * Blok anti-terjemahan diletakkan paling akhir supaya menjadi aturan terakhir
 * yang dibaca model dan menimpa kebiasaan dari blok sebelumnya.
 */
export function buildGenerateStatusPrompt(input: Parameters<typeof buildV6>[0]): string {
  return `${buildV6(input)}\n\n${ATURAN_ANTI_TERJEMAHAN}`;
}
