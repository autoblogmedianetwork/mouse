/**
 * Prompt 04 untuk ChatGPT, disusun di browser (tanpa panggilan AI dari
 * aplikasi). Isinya mengikuti `prompts/04-storyboard-json.md` versi v1.
 *
 * Nilai kosong diganti penanda "(tidak diisi)" agar ChatGPT tetap tahu kolom
 * itu ada dan tidak mengarang isinya.
 */
import {
  DURASI_TOTAL_DETIK,
  JUMLAH_SCENE_MAX,
  JUMLAH_SCENE_MIN,
  MAKS_KATA_TEKS_LAYAR,
  KATA_NARASI_PER_DETIK,
} from "./storyboard";

export const PROMPT_STORYBOARD_VERSI = "storyboard.v1";

export interface DataPromptStoryboard {
  namaProduk: string;
  varian?: string;
  ringkasan: string;
  adaFoto: boolean;
  angleJudul?: string;
  angleFormat?: string;
  hook?: string;
  durasiDetik?: number;
  jumlahScene?: number;
  instruksiTambahan?: string;
}

function isi(nilai: string | undefined | null): string {
  const teks = (nilai ?? "").trim();
  return teks.length > 0 ? teks : "(tidak diisi)";
}

export function susunPromptStoryboard(data: DataPromptStoryboard): string {
  const durasi = data.durasiDetik ?? DURASI_TOTAL_DETIK;
  const jumlahScene = data.jumlahScene ?? JUMLAH_SCENE_MIN;

  return `Kamu adalah sutradara storyboard video promosi affiliate pendek untuk TikTok, Reels, dan Threads, berbahasa Indonesia kasual.

Produk:
- Nama: ${isi(data.namaProduk)}
- Varian: ${isi(data.varian)}
- Ringkasan (hasil analisis): ${isi(data.ringkasan)}
- Foto referensi tersedia: ${data.adaFoto ? "ya" : "tidak"}

Angle terpilih:
<angle>
Judul: ${isi(data.angleJudul)}
Format: ${isi(data.angleFormat)}
Hook: ${isi(data.hook)}
</angle>

Pengaturan:
- Durasi total: ${durasi} detik (kunci: ${DURASI_TOTAL_DETIK})
- Rasio: 9:16
- Jumlah scene: ${jumlahScene} (${JUMLAH_SCENE_MIN} sampai ${JUMLAH_SCENE_MAX})
- Instruksi tambahan: ${isi(data.instruksiTambahan)}

Aturan wajib:
1. Jumlah durasi semua scene harus tepat sama dengan durasi total.
2. Scene 1 adalah hook. Dalam 3 detik pertama harus ada masalah atau pertanyaan yang relatable.
3. Sertakan satu scene yang menampilkan produk dengan jujur, termasuk batasan atau kekurangannya bila relevan.
4. Scene terakhir berisi ajakan halus, tanpa kata "beli sekarang" yang keras.
5. Teks layar maksimal ${MAKS_KATA_TEKS_LAYAR} kata per scene.
6. Narasi (jika ada) maksimal ${KATA_NARASI_PER_DETIK} kata per detik durasi scene.
7. Jangan menyebut harga, klaim yang tidak ada di ringkasan, atau hasil yang tidak bisa dibuktikan.
8. Produk harus digambarkan sesuai ringkasan. Jangan mengubah bentuk, warna, atau isi paket.
9. Balas HANYA dengan JSON valid. Tanpa teks lain dan tanpa markdown.

Format:
{
  "durasi_total_detik": ${durasi},
  "rasio": "9:16",
  "scenes": [
    {
      "urutan": 1,
      "durasi_detik": 3,
      "visual": "string",
      "gerakan_kamera": "string",
      "teks_layar": "string",
      "narasi": "string | null",
      "suara_latar": "string | null"
    }
  ],
  "klaim_perlu_cek": ["string"],
  "catatan": "string | null"
}`;
}
