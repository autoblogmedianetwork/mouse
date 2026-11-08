/**
 * Prompt Google Flow per scene, disusun dari template `prompts/07-prompt-foto-ke-video.md`
 * (v1). Tidak ada panggilan AI: teks hanya disusun dan disalin user.
 *
 * Setiap prompt scene wajib memuat kunci produk, karena Flow paling sering
 * mengubah bentuk/warna produk dari satu klip ke klip berikutnya.
 */
import type { SceneStoryboard, Storyboard } from "./storyboard";

export const PROMPT_FLOW_VERSI = "foto-ke-video.v1";

export const GAYA_FLOW = [
  "UGC problem-solution",
  "hook produk",
  "unboxing",
  "demo pemakaian",
] as const;

export type GayaFlow = (typeof GAYA_FLOW)[number];

export const KUNCI_PRODUK =
  "Produk harus tetap persis seperti di foto: bentuk, warna, desain, dan jumlah komponen tidak boleh berubah.";

const LARANGAN = [
  "Jangan menampilkan harga, diskon, atau angka penjualan.",
  'Jangan menambahkan klaim berlebihan seperti "terbaik", "100% aman", atau "paling murah".',
  "Jangan menambahkan logo atau merek yang tidak ada di foto.",
  "Jangan membuat tangan atau wajah yang menyerupai tokoh nyata.",
];

export interface OpsiPromptFlow {
  namaProduk: string;
  varian?: string;
  gaya?: string;
  instruksiTambahan?: string;
}

/** Batas kata narasi per scene (2 kata per detik, aturan prompt 04). */
export function batasKataNarasi(durasiDetik: number): number {
  return Math.max(1, Math.floor(durasiDetik * 2));
}

export function susunPromptFlowScene(scene: SceneStoryboard, opsi: OpsiPromptFlow): string {
  const gaya = opsi.gaya?.trim() || GAYA_FLOW[0];
  const produk = [opsi.namaProduk.trim(), opsi.varian?.trim()].filter(Boolean).join(" — ");

  const baris: string[] = [
    `Buat video vertikal 9:16 berdurasi ${scene.durasi_detik} detik untuk promosi affiliate.`,
    "",
    "Gunakan foto produk yang diupload sebagai referensi visual utama.",
    KUNCI_PRODUK,
    "Jangan ada morphing, distorsi, atau logo tambahan.",
    "",
    `Produk: ${produk || "(produk belum diisi)"}`,
    `Adegan (scene ${scene.urutan}): ${scene.visual}`,
    `Gerakan kamera: ${scene.gerakan_kamera}`,
    `Gaya: ${gaya}`,
  ];

  if (scene.urutan === 1) {
    baris.push("Hook dalam 3 detik pertama.");
  }

  if (scene.teks_layar.trim().length > 0) {
    baris.push(`Teks di layar (tulis apa adanya, tanpa menambah teks lain): "${scene.teks_layar}"`);
  }

  if (scene.narasi) {
    baris.push(
      `Narasi voice-over Bahasa Indonesia kasual, maksimal ${batasKataNarasi(scene.durasi_detik)} kata: "${scene.narasi}"`,
    );
  } else {
    baris.push("Tanpa narasi voice-over.");
  }

  baris.push("", "Larangan:", ...LARANGAN.map((l) => `- ${l}`));

  const tambahan = opsi.instruksiTambahan?.trim();
  if (tambahan) {
    baris.push("", `Instruksi tambahan dari user: ${tambahan}`);
  }

  return baris.join("\n");
}

/**
 * Prompt untuk Google Flow, satu blok per scene ditambah '=== PENGINGAT ==='
 * yang menutup dengan cek produk di setiap klip.
 */
export function susunSemuaPromptFlow(storyboard: Storyboard, opsi: OpsiPromptFlow): string {
  const blok = storyboard.scenes.map((scene) => {
    const judul = `=== SCENE ${scene.urutan} (${scene.durasi_detik} dtk) ===`;
    return [judul, susunPromptFlowScene(scene, opsi)].join("\n");
  });

  const pengingat = [
    "=== PENGINGAT ===",
    "Setelah tiap klip selesai: bandingkan bentuk, warna, dan isi paket dengan foto asli.",
    "Kalau berbeda, buat ulang klip itu — jangan diperbaiki dengan cara lain.",
    "Beri tanda AI pada video dan disclosure affiliate saat upload.",
  ].join("\n");

  return [...blok, pengingat].join("\n\n");
}

/** Satu scene dipakai untuk preview singkat di halaman. */
export function ringkasScene(scene: SceneStoryboard): string {
  const teks = scene.teks_layar.trim();
  return teks.length > 0 ? `${scene.durasi_detik} dtk · ${teks}` : `${scene.durasi_detik} dtk`;
}
