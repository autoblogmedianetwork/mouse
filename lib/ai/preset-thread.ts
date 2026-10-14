/**
 * "Panjang thread" presets (N-2).
 *
 * Satu preset hanya memetakan dua pengaturan yang sudah ada: jumlah status
 * (BATAS_JUMLAH) dan panjang per status. Tidak ada pengaturan baru dan tidak
 * ada kolom baru, jadi nilai yang dikirim ke prompt tetap lewat `Pengaturan`.
 */
import type { Pengaturan } from "./schemas";

export const PRESET_THREAD = {
  pendek: { jumlah_status: "pendek", panjang_status: "singkat" },
  sedang: { jumlah_status: "menengah", panjang_status: "sedang" },
  panjang: { jumlah_status: "panjang", panjang_status: "panjang" },
} as const;

export type PresetThread = keyof typeof PRESET_THREAD;

export const PRESET_THREAD_IDS = Object.keys(PRESET_THREAD) as PresetThread[];

export const LABEL_PRESET_THREAD: Record<PresetThread, string> = {
  pendek: "Pendek",
  sedang: "Sedang",
  panjang: "Panjang",
};

/**
 * Preset yang sedang berlaku, atau null kalau pilihan user tidak sama dengan
 * preset mana pun (mis. jumlah panjang + panjang singkat). UI menampilkan
 * "Kustom" untuk null.
 */
export function presetThreadAktif(pengaturan: Pengaturan): PresetThread | null {
  const ketemu = PRESET_THREAD_IDS.find(
    (id) =>
      PRESET_THREAD[id].jumlah_status === pengaturan.jumlah_status &&
      PRESET_THREAD[id].panjang_status === pengaturan.panjang_status,
  );
  return ketemu ?? null;
}

/** Terapkan preset tanpa menyentuh pengaturan lain (persona, hook, dst.). */
export function terapkanPresetThread(pengaturan: Pengaturan, preset: PresetThread): Pengaturan {
  return { ...pengaturan, ...PRESET_THREAD[preset] };
}
