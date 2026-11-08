/**
 * Storyboard yang ditempel balik dari ChatGPT (prompt 04). Tidak ada panggilan
 * AI di sini: teks JSON diurai, dirapikan, lalu diperiksa.
 *
 * Tiga keluaran: struktur yang sudah dinormalkan, `peringatan` yang tidak
 * menghalangi (gaya penulisan), dan `error` yang menghalangi (bukan JSON,
 * tidak ada scene, durasi tidak masuk akal). Pemeriksaan ketat soal klaim tetap
 * di tangan user — sistem tidak tahu mana klaim yang benar.
 */
import { z } from "zod";
import { parseModelJson } from "@/lib/ai/parse-json";

/**
 * Batas scene prompt 04 (v1). Awalnya 3–5; dilonggarkan ke 6 pada ADR 0019
 * karena alur cepat yang dipakai user memakai 6 scene pendek.
 */
export const DURASI_TOTAL_DETIK = 10;
export const JUMLAH_SCENE_MIN = 3;
export const JUMLAH_SCENE_MAX = 6;
export const MAKS_KATA_TEKS_LAYAR = 8;
/** Narasi maksimal 2 kata per detik durasi scene. */
export const KATA_NARASI_PER_DETIK = 2;

const angkaPositif = z.coerce.number().finite().positive("durasi harus lebih dari 0");

const sceneSkema = z.object({
  urutan: z.coerce.number().int().min(1).optional(),
  durasi_detik: angkaPositif,
  visual: z.string().trim().min(1, "deskripsi visual scene kosong"),
  gerakan_kamera: z.string().trim().default("statis"),
  teks_layar: z.string().trim().default(""),
  narasi: z.string().trim().nullable().default(null),
  suara_latar: z.string().trim().nullable().default(null),
});

export const storyboardSkema = z
  .object({
    durasi_total_detik: angkaPositif.optional(),
    rasio: z.string().trim().default("9:16"),
    scenes: z.array(sceneSkema).min(1, "storyboard tidak punya scene"),
    klaim_perlu_cek: z.array(z.string()).default([]),
    catatan: z.string().trim().nullable().default(null),
  })
  .transform((sb) => ({
    ...sb,
    scenes: sb.scenes.map((scene, i) => ({
      ...scene,
      urutan: scene.urutan ?? i + 1,
      narasi: scene.narasi && scene.narasi.length > 0 ? scene.narasi : null,
      suara_latar: scene.suara_latar && scene.suara_latar.length > 0 ? scene.suara_latar : null,
    })),
  }));

export type Storyboard = z.infer<typeof storyboardSkema>;
export type SceneStoryboard = Storyboard["scenes"][number];

export type HasilValidasiStoryboard =
  | { ok: true; storyboard: Storyboard; peringatan: string[] }
  | { ok: false; error: string };

export function hitungKata(teks: string | null | undefined): number {
  if (!teks) return 0;
  return teks.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * ChatGPT kadang memakai nama kolom dari Template-Video-Affiliate (tahap 3:
 * `deskripsi_visual`, `kamera`, `id`) bukan dari prompt 04 (`visual`,
 * `gerakan_kamera`, `urutan`). Keduanya diterima supaya JSON yang benar tidak
 * ditolak hanya karena namanya berbeda.
 */
function normalisasiScene(mentah: unknown): unknown {
  if (typeof mentah !== "object" || mentah === null) return mentah;
  const o = mentah as Record<string, unknown>;
  return {
    urutan: o.urutan ?? o.id ?? o.nomor,
    durasi_detik: o.durasi_detik ?? o.durasi ?? o.durasi_scene,
    visual: o.visual ?? o.deskripsi_visual ?? o.deskripsi ?? o.adegan,
    gerakan_kamera: o.gerakan_kamera ?? o.kamera ?? o.gerakan,
    teks_layar: o.teks_layar ?? o.teks ?? "",
    narasi: o.narasi ?? o.voice_over ?? o.narasi_vo ?? null,
    suara_latar: o.suara_latar ?? o.suara ?? null,
  };
}

function normalisasiAkar(mentah: unknown): unknown {
  if (typeof mentah !== "object" || mentah === null) return mentah;
  const o = mentah as Record<string, unknown>;
  // Template lama membungkus data di `video` dan `scenes` ada di akar.
  const video = (o.video ?? {}) as Record<string, unknown>;
  return {
    durasi_total_detik: o.durasi_total_detik ?? video.durasi_detik ?? o.durasi_detik,
    rasio: o.rasio ?? video.rasio ?? "9:16",
    scenes: Array.isArray(o.scenes) ? o.scenes.map(normalisasiScene) : o.scenes,
    klaim_perlu_cek: o.klaim_perlu_cek ?? [],
    catatan: o.catatan ?? video.gaya_visual ?? null,
  };
}

/** Peringatan gaya: tidak menghalangi, tetapi perlu dibaca sebelum lanjut. */
export function periksaPeringatan(sb: Storyboard): string[] {
  const hasil: string[] = [];
  const jumlah = sb.scenes.length;

  if (jumlah < JUMLAH_SCENE_MIN || jumlah > JUMLAH_SCENE_MAX) {
    hasil.push(
      `Jumlah scene ${jumlah}; prompt 04 meminta ${JUMLAH_SCENE_MIN}–${JUMLAH_SCENE_MAX}. Lebih banyak scene = lebih banyak sambungan yang bisa meleset.`,
    );
  }

  const totalScene = sb.scenes.reduce((s, sc) => s + sc.durasi_detik, 0);
  if (sb.durasi_total_detik && Math.abs(totalScene - sb.durasi_total_detik) > 0.01) {
    hasil.push(
      `Durasi scene berjumlah ${totalScene} detik, tetapi tertulis ${sb.durasi_total_detik} detik.`,
    );
  }

  for (const scene of sb.scenes) {
    const kata = hitungKata(scene.teks_layar);
    if (kata > MAKS_KATA_TEKS_LAYAR) {
      hasil.push(
        `Scene ${scene.urutan}: teks layar ${kata} kata (maksimal ${MAKS_KATA_TEKS_LAYAR}).`,
      );
    }
    const batasNarasi = Math.floor(scene.durasi_detik * KATA_NARASI_PER_DETIK);
    const kataNarasi = hitungKata(scene.narasi);
    if (kataNarasi > batasNarasi) {
      hasil.push(
        `Scene ${scene.urutan}: narasi ${kataNarasi} kata untuk ${scene.durasi_detik} detik (maksimal ${batasNarasi}).`,
      );
    }
  }

  const urutan = sb.scenes.map((s) => s.urutan);
  if (new Set(urutan).size !== urutan.length) {
    hasil.push("Ada nomor scene yang dobel. Perbaiki urutannya sebelum menyalin prompt.");
  }

  if (sb.klaim_perlu_cek.length > 0) {
    hasil.push(
      `${sb.klaim_perlu_cek.length} klaim perlu dicek manual: ${sb.klaim_perlu_cek.join("; ")}.`,
    );
  }

  return hasil;
}

/**
 * Validasi JSON tempelan. `parseModelJson` dipakai bersama supaya pagar
 * ```json dan kalimat pembuka dari ChatGPT ikut dibersihkan.
 */
export function validasiStoryboard(teks: string): HasilValidasiStoryboard {
  const bersih = teks.trim();
  if (bersih.length === 0) {
    return { ok: false, error: "Tempel dulu JSON storyboard dari ChatGPT." };
  }

  let mentah: unknown;
  try {
    mentah = parseModelJson(bersih);
  } catch {
    return {
      ok: false,
      error: "Teks ini bukan JSON yang bisa dibaca. Minta ChatGPT mengirim ulang hanya JSON.",
    };
  }

  const parsed = storyboardSkema.safeParse(normalisasiAkar(mentah));
  if (!parsed.success) {
    const pesan = parsed.error.issues
      .slice(0, 2)
      .map((issue) => {
        const jalur = issue.path.join(".");
        return jalur ? `${jalur}: ${issue.message}` : issue.message;
      })
      .join(" · ");
    return { ok: false, error: `JSON belum sesuai: ${pesan}` };
  }

  return { ok: true, storyboard: parsed.data, peringatan: periksaPeringatan(parsed.data) };
}
