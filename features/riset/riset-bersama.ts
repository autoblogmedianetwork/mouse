/**
 * Kelas & helper UI bersama untuk panel riset (dipecah dari panel-riset.tsx,
 * R6c — tanpa perubahan perilaku).
 */
import type { Peluang } from "@/lib/riset/skema";

export const inputClass =
  "w-full border border-surface-border bg-surface px-3 py-2 text-badan outline-none focus:border-primary";
export const btnUtama =
  "inline-flex h-9 items-center bg-primary px-4 text-badan font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-60";
export const btnGhost =
  "border border-surface-border px-3 py-1.5 text-meta font-medium hover:bg-muted disabled:opacity-60";

export const labelPrioritas: Record<Peluang["prioritas"], string> = {
  tinggi: "bg-primary text-primary-foreground",
  sedang: "bg-muted text-foreground",
  rendah: "bg-transparent text-muted-foreground",
};

export function unduhCsv(nama: string, isi: string) {
  const url = URL.createObjectURL(new Blob([isi], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = nama;
  a.click();
  URL.revokeObjectURL(url);
}
