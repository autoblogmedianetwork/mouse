/**
 * Adapter untuk HyperFrames video render (ADR 0003 & ADR 0002).
 * Berjalan secara lokal di HYPERFRAMES_URL (default: http://localhost:7002).
 * Panggil `isHyperFramesAvailable()` sebelum menampilkan tombol render aktif.
 */

export const DEFAULT_HYPERFRAMES_URL = "http://localhost:7002";

export interface HyperFramesScene {
  id: number;
  durasiDetik: number;
  tipe: "hook" | "isi" | "cta";
  teksUtama: string;
  teksTambahan?: string;
  mediaUrl?: string;
}

export interface HyperFramesPayload {
  judul: string;
  produkNama: string;
  fotoUrl?: string;
  rasio: "9:16";
  scenes: HyperFramesScene[];
}

export interface RenderResult {
  ok: boolean;
  videoUrl?: string;
  error?: string;
}

/**
 * Mengubah daftar status teks Threads menjadi urutan scene video 9:16.
 * - Status 1: Hook pembuka (3 detik)
 * - Status 2..N-1: Poin ulasan / masalah / solusi (3-4 detik)
 * - Status terakhir: Review jujur + CTA + #affiliate (3 detik)
 */
export function susunScenesDariStatuses(
  statuses: string[],
  fotoUrl?: string,
): HyperFramesScene[] {
  const bersih = statuses.map((s) => s.trim()).filter((s) => s.length > 0);
  if (bersih.length === 0) {
    return [
      {
        id: 1,
        durasiDetik: 3,
        tipe: "hook",
        teksUtama: "Rekomendasi Produk Pilihan",
        mediaUrl: fotoUrl,
      },
    ];
  }

  if (bersih.length === 1) {
    return [
      {
        id: 1,
        durasiDetik: 5,
        tipe: "hook",
        teksUtama: bersih[0],
        mediaUrl: fotoUrl,
      },
    ];
  }

  const scenes: HyperFramesScene[] = [];

  // Scene 1: Hook
  scenes.push({
    id: 1,
    durasiDetik: 3,
    tipe: "hook",
    teksUtama: bersih[0],
    mediaUrl: fotoUrl,
  });

  // Scene tengah (isi)
  for (let i = 1; i < bersih.length - 1; i += 1) {
    scenes.push({
      id: i + 1,
      durasiDetik: 4,
      tipe: "isi",
      teksUtama: bersih[i],
      mediaUrl: fotoUrl,
    });
  }

  // Scene terakhir (CTA & Disclosure)
  scenes.push({
    id: scenes.length + 1,
    durasiDetik: 4,
    tipe: "cta",
    teksUtama: bersih[bersih.length - 1],
    mediaUrl: fotoUrl,
  });

  return scenes;
}

/**
 * Mengecek apakah service HyperFrames di localhost/server sedang menyala.
 */
export async function isHyperFramesAvailable(url?: string): Promise<boolean> {
  const baseUrl = (url || process.env.NEXT_PUBLIC_HYPERFRAMES_URL || DEFAULT_HYPERFRAMES_URL).replace(/\/+$/, "");
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1500);
    const res = await fetch(`${baseUrl}/health`, {
      method: "GET",
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Mengirim data scene ke service HyperFrames untuk dirender menjadi video.
 */
export async function kirimRenderHyperFrames(
  payload: HyperFramesPayload,
  url?: string,
): Promise<RenderResult> {
  const baseUrl = (url || process.env.NEXT_PUBLIC_HYPERFRAMES_URL || DEFAULT_HYPERFRAMES_URL).replace(/\/+$/, "");
  try {
    const res = await fetch(`${baseUrl}/render`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { ok: false, error: err.error || `HTTP ${res.status} gagal render video.` };
    }

    const data = await res.json();
    return { ok: true, videoUrl: data.videoUrl || data.previewUrl };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Tidak dapat terhubung ke service render video.",
    };
  }
}
