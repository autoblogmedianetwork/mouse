/**
 * Mode cepat: satu prompt panjang siap tempel di Google Flow (Gemini Omni),
 * meniru alur yang dipakai user sehari-hari (ADR 0019).
 *
 * Bedanya dengan mode JSON: tidak ada storyboard terstruktur yang diperiksa,
 * jadi hasilnya lebih cepat tetapi tanpa checkpoint 1. Negative prompt dan
 * larangan tetap sama supaya video tidak melanggar aturan platform.
 *
 * Tidak ada model atau orang di video: hanya produk dan tangan.
 */
import { DURASI_TOTAL_DETIK, JUMLAH_SCENE_MAX, JUMLAH_SCENE_MIN } from "./storyboard";
import { NEGATIVE_PROMPT } from "./prompt-flow";

export const PROMPT_CEPAT_VERSI = "foto-ke-video-cepat.v1";

export interface DataPromptCepat {
  namaProduk: string;
  varian?: string;
  deskripsi: string;
  durasiDetik?: number;
  jumlahScene?: number;
  instruksiTambahan?: string;
}

function isi(nilai: string | undefined | null): string {
  const teks = (nilai ?? "").trim();
  return teks.length > 0 ? teks : "(tidak diisi)";
}

export function susunPromptCepat(data: DataPromptCepat): string {
  const durasi = data.durasiDetik ?? DURASI_TOTAL_DETIK;
  const scene = Math.min(Math.max(data.jumlahScene ?? JUMLAH_SCENE_MIN, JUMLAH_SCENE_MIN), JUMLAH_SCENE_MAX);

  const baris = [
    `Buatkan storyboard ${durasi} detik untuk generate video dengan aspek rasio 9:16.`,
    "",
    "Ketentuan visual:",
    `- ${scene} scene, tiap scene pendek supaya sambungannya tidak berantakan.`,
    "- Fokus ke barang 100% sama seperti gambar yang diupload: bentuk, warna, bahan, dan jumlah komponen tidak boleh berubah.",
    "- Ukuran produk di frame wajar, jangan terlalu besar.",
    "- Boleh ada efek pemanis secukupnya: bubble text keterangan produk, highlight halus, transisi bersih.",
    "- Jangan ada teks hook besar atau judul di dalam video.",
    "",
    "Ketentuan orang:",
    "- Jangan tampilkan wajah atau tubuh orang sama sekali.",
    "- Bila perlu interaksi, cukup tangan yang memegang atau memakai produk.",
    "",
    "Audio:",
    "- Pakai sound effect yang mendukung produk (bunyi benda, ambience dapur/rumah), tidak berlebihan.",
    "- Voice-over Bahasa Indonesia kasual secukupnya, maksimal dua kalimat pendek, jangan berbelit.",
    "",
    `Negative prompt: ${NEGATIVE_PROMPT}`,
    "",
    "Larangan tambahan:",
    "- Jangan menampilkan harga, diskon, angka penjualan, atau badge promo.",
    '- Jangan menambahkan klaim seperti "terbaik", "100% aman", "paling murah".',
    "- Jangan menambahkan logo atau merek yang tidak ada di gambar.",
  ];

  const tambahan = data.instruksiTambahan?.trim();
  if (tambahan) {
    baris.push("", `Instruksi tambahan: ${tambahan}`);
  }

  baris.push(
    "",
    "Informasi produk:",
    `<produk>`,
    `- Nama: ${isi(data.namaProduk)}`,
    `- Varian: ${isi(data.varian)}`,
    `- Deskripsi: ${isi(data.deskripsi)}`,
    `</produk>`,
  );

  return baris.join("\n");
}

/** Langkah setelah prompt cepat dipakai, dicetak di halaman sebagai panduan. */
export const LANGKAH_PROMPT_CEPAT = [
  "Buka Google Flow, pilih Gemini Omni, unggah foto produk (boleh infografis dari seller).",
  "Tempel prompt di atas, lalu generate storyboard.",
  "Periksa storyboard: bentuk dan warna produk harus sama dengan foto, tidak ada keranjang atau teks checkout.",
  "Minta ChatGPT mengubah storyboard itu menjadi prompt video, atau pakai langsung storyboard-nya di Flow.",
  "Di Flow, unggah foto produk dan gambar storyboard, tempel prompt video, lalu generate.",
  "Bandingkan tiap klip dengan foto asli; klip yang meleset digenerate ulang.",
  "Unduh, beri tanda AI dan disclosure affiliate, lalu simpan linknya.",
];
