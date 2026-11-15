/**
 * Kelas, tipe, dan helper bersama untuk antrian review (dipecah dari
 * antrian-review.tsx, R6d — tanpa perubahan perilaku).
 */
import type { Konten } from "@/lib/konten/skema";

export const inputClass =
  "w-full border border-surface-border bg-surface px-3 py-2 text-badan outline-none focus:border-primary";
export const btnGhost =
  "border border-surface-border px-3 py-1.5 text-meta font-medium hover:bg-muted";

/** Konfirmasi generik yang selalu lewat ConfirmDialog (PRD F0). */
export interface Konfirmasi {
  judul: string;
  pesan: string;
  labelKonfirmasi: string;
  destructive?: boolean;
  jalankan: () => void;
}

/** Satu tombol aksi pada kartu konten. */
export interface AksiKartu {
  label: string;
  jalankan: (k: Konten) => void;
  destructive?: boolean;
}

export function unduh(namaFile: string, isi: string, mime: string) {
  const blob = new Blob([isi], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = namaFile;
  a.click();
  URL.revokeObjectURL(url);
}
