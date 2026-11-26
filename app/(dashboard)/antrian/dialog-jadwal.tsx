"use client";

/**
 * Dialog jadwal native <dialog> (UI-Spec 2.5/3.4) — dipecah dari
 * antrian-review.tsx (R6d). Hanya penanda jadwal di kalender; konfirmasi
 * tetap di dalam dialog.
 */
import { Card } from "@/components/card";
import { cn } from "@/lib/utils";
import { inputClass } from "./antrian-bersama";

interface Props {
  judul: string;
  tanggal: string;
  setTanggal: (v: string) => void;
  refDialog: React.RefObject<HTMLDialogElement | null>;
  onBatal: () => void;
  onSimpan: () => void;
}

export function DialogJadwal({
  judul,
  tanggal,
  setTanggal,
  refDialog,
  onBatal,
  onSimpan,
}: Props) {
  return (
    <dialog
      ref={refDialog}
      aria-labelledby="jadwal-judul"
      onCancel={(e) => {
        e.preventDefault();
        onBatal();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onBatal();
      }}
      className="m-auto w-[min(94vw,26rem)] border-0 bg-transparent p-0 backdrop:bg-black/50"
    >
      <Card
        role="dialog"
        aria-modal="true"
        aria-labelledby="jadwal-judul"
        className="w-[min(94vw,26rem)] p-5"
      >
        <h2 id="jadwal-judul" className="text-isi font-semibold">
          Jadwalkan konten
        </h2>
        <p className="mt-2 text-badan text-muted-foreground">
          Hanya penanda jadwal di kalender (mode manual tetap jalur utama). Konten yang dijadwalkan
          bisa dibatalkan kapan saja dari tab Terjadwal.
        </p>
        <p className="mt-3 text-badan font-medium">{judul}</p>
        <label className="mt-3 block text-meta text-muted-foreground">
          Tanggal dan jam
          <input
            type="datetime-local"
            value={tanggal}
            onChange={(e) => setTanggal(e.target.value)}
            className={cn(inputClass, "mt-1")}
          />
        </label>
        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={onBatal}
            className="h-11 sm:h-9 border border-surface-border px-4 text-badan font-medium hover:bg-muted"
          >
            Batal
          </button>
          <button
            type="button"
            autoFocus
            onClick={onSimpan}
            className="h-11 sm:h-9 bg-primary px-4 text-badan font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
          >
            Simpan jadwal
          </button>
        </div>
      </Card>
    </dialog>
  );
}
