"use client";

import type { ContentStatus } from "@/components/status-badge";
import { StatusBadge } from "@/components/status-badge";

/**
 * ActionBar (UI-Spec 3.2 bilah aksi): sticky bottom bar. "Posting sekarang"
 * is not shown in MVP; "Jadwalkan" appears only after M6 (F8).
 */
export function ActionBar({
  status,
  semuaChecklist,
  semuaValid,
  tersimpanPukul,
  busy = false,
  onSimpanDraft,
  onTandaiSiap,
  onSalin,
}: {
  status: ContentStatus;
  semuaChecklist: boolean;
  semuaValid: boolean;
  tersimpanPukul: string | null;
  busy?: boolean;
  onSimpanDraft: () => void;
  onTandaiSiap: () => void;
  onSalin: () => void;
}) {
  const bisaTandai = semuaChecklist && semuaValid && status !== "siap_posting";

  return (
    <div className="sticky bottom-0 z-20 -mx-4 border-t border-surface-border bg-background/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onSimpanDraft}
          disabled={busy}
          className="h-10 rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-60"
        >
          Simpan draft
        </button>
        <button
          type="button"
          onClick={onTandaiSiap}
          disabled={!bisaTandai || busy}
          title={
            !semuaValid
              ? "Masih ada status yang tidak valid"
              : !semuaChecklist
                ? "Lengkapi checklist dulu"
                : undefined
          }
          className="h-10 rounded-lg border border-surface-border px-5 text-sm font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
        >
          Tandai siap posting
        </button>
        <button
          type="button"
          onClick={onSalin}
          disabled={busy}
          className="h-10 rounded-lg border border-surface-border px-5 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-60"
        >
          Salin utas lengkap
        </button>

        <div className="ml-auto flex items-center gap-3">
          {tersimpanPukul ? (
            <span className="text-xs text-muted-foreground" aria-live="polite">
              Tersimpan pukul {tersimpanPukul}
            </span>
          ) : null}
          <StatusBadge status={status} />
        </div>
      </div>
    </div>
  );
}
