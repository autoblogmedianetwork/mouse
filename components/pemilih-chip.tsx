"use client";

/**
 * PemilihChip (Fase 3-B, ditata ulang per masukan review UI): kelompok tombol
 * chip multi-pilih atau satu-pilih. Target sentuh minimal 44px, status
 * terpilih tampak jelas (warna + centang), penghitung untuk grup multi, dan
 * aria-pressed agar terbaca pembaca layar. Tanpa dependency baru.
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
    <div>
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
                "inline-flex h-11 items-center gap-1.5 border px-3 text-badan font-medium transition-colors",
                aktif
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-surface-border bg-surface hover:border-primary",
              )}
            >
              {/* Centang: penanda tambahan selain warna, untuk aksesibilitas. */}
              <span aria-hidden className={cn("text-mikro", !aktif && "opacity-0")}>
                ✓
              </span>
              {nilai}
            </button>
          );
        })}
      </div>
      {multi && terpilih.length > 0 ? (
        <p className="mt-1 text-meta text-muted-foreground" aria-live="polite">
          {terpilih.length} dipilih
        </p>
      ) : null}
    </div>
  );
}
