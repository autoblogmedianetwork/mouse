/**
 * Arsip video dari jalur "prompt manual" (storyboard ChatGPT → Google Flow).
 *
 * localStorage sampai Supabase tersambung, sama seperti Bank Konten. Tidak ada
 * video yang diunggah atau diproses di server: yang disimpan hanya storyboard,
 * prompt, link hasil, dan jawaban checklist.
 */
import { bacaDaftar, tulisJson } from "@/lib/storage/kotak";
import { z } from "zod";
import { storyboardSkema } from "./storyboard";

const KUNCI = "autothreads-video";

export const CHECKLIST_IDS = [
  "produk_sesuai_foto",
  "tanpa_harga_klaim",
  "hook_3detik",
  "disclosure",
] as const;

export type ChecklistVideo = (typeof CHECKLIST_IDS)[number];

export const CHECKLIST_AWAL: Record<ChecklistVideo, boolean> = {
  produk_sesuai_foto: false,
  tanpa_harga_klaim: false,
  hook_3detik: false,
  disclosure: false,
};

export const LABEL_CHECKLIST: Record<ChecklistVideo, string> = {
  produk_sesuai_foto: "Produk di tiap klip sesuai foto asli (bentuk, warna, isi paket)",
  tanpa_harga_klaim: "Tidak ada harga, diskon, atau klaim yang tidak ada di listing",
  hook_3detik: "Hook muncul dalam 3 detik pertama",
  disclosure: "Ada tanda AI dan disclosure affiliate",
};

export const videoSkema = z.object({
  id: z.string().min(1),
  judul: z.string().min(1),
  nama_produk: z.string().default(""),
  storyboard: storyboardSkema,
  link_video: z.string().default(""),
  checklist: z.record(z.string(), z.boolean()).default({}),
  /** Semua hasil di jalur ini tetap draft sampai user memutuskan sendiri. */
  status: z.literal("draft").default("draft"),
  created_at: z.string(),
  updated_at: z.string(),
});

export type VideoTersimpan = z.infer<typeof videoSkema>;

export function muatVideo(): VideoTersimpan[] {
  return bacaDaftar<VideoTersimpan>(KUNCI, (entry) => {
    const hasil = videoSkema.safeParse(entry);
    return hasil.success ? hasil.data : null;
  });
}

function simpanDaftar(list: VideoTersimpan[]): void {
  tulisJson(KUNCI, list);
}

export function simpanVideo(list: VideoTersimpan[], video: VideoTersimpan): VideoTersimpan[] {
  const idx = list.findIndex((v) => v.id === video.id);
  const next = idx === -1 ? [video, ...list] : list.map((v, i) => (i === idx ? video : v));
  simpanDaftar(next);
  return next;
}

export function hapusVideo(list: VideoTersimpan[], id: string): VideoTersimpan[] {
  const next = list.filter((v) => v.id !== id);
  simpanDaftar(next);
  return next;
}

export function checklistVideoLengkap(checklist: Record<string, boolean>): boolean {
  return CHECKLIST_IDS.every((id) => checklist[id] === true);
}
