"use client";

/**
 * PemilihChip (Fase 3-B): kelompok tombol chip multi-pilih atau satu-pilih,
 * pola visual sama dengan pemilih mode output di form generate. Tanpa
 * dependency baru.
 */
import { cn } from "@/lib/utils";

export function PemilihChip({
  pilihan,
  terpilih,
  onPilih,
  multi = false,
  labelGrup,
}: {
  pilihan: readonly string[];
  terpilih: readonly string[];
  onPilih: (nilai: string) => void;
  multi?: boolean;
  labelGrup: string;
}) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label={labelGrup}>
      {pilihan.map((nilai) => {
        const aktif = terpilih.includes(nilai);
        return (
          <button
            key={nilai}
            type="button"
            aria-pressed={aktif}
            onClick={() => onPilih(nilai)}
            className={cn(
              "h-8 border px-3 text-meta font-medium transition-colors",
              aktif
                ? "border-primary bg-primary text-primary-foreground"
                : "border-surface-border bg-surface hover:border-primary",
            )}
          >
            {nilai}
          </button>
        );
      })}
      {multi ? null : null}
    </div>
  );
}
