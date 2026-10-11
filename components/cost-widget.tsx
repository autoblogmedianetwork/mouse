"use client";

/**
 * CostWidget (UI-Spec 3.9 header, PRD F10): today's and this month's AI cost
 * with progress against the monthly budget. Turns orange at 80% and red at
 * 100%, where PRD F10 says AI calls must stop.
 *
 * Pure presentation: the caller supplies the numbers, so this stays testable
 * and never reads env on its own.
 */
import { cn } from "@/lib/utils";

const rupiahPerUsd = 16_300; // rough conversion for display only (K8 pending)

function formatUsd(usd: number): string {
  return `$${usd.toFixed(2)}`;
}

function formatRupiah(usd: number): string {
  return `≈ Rp ${Math.round(usd * rupiahPerUsd).toLocaleString("id-ID")}`;
}

export function CostWidget({
  hariIniUsd,
  bulanIniUsd,
  adaCatatan,
  batasUsd,
}: {
  hariIniUsd: number | null;
  bulanIniUsd: number | null;
  adaCatatan: boolean;
  batasUsd: number;
}) {
  const pakai = bulanIniUsd ?? 0;
  const persen = batasUsd > 0 ? Math.min(100, (pakai / batasUsd) * 100) : 0;
  const hampirHabis = persen >= 80;

  return (
    <div className="min-w-56 rounded-xl border border-surface-border bg-surface px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Biaya AI
      </p>

      {adaCatatan ? (
        <>
          <dl className="mt-1 flex items-baseline gap-4 text-sm">
            <div>
              <dt className="text-xs text-muted-foreground">Hari ini</dt>
              <dd className="font-medium tabular-nums">
                {hariIniUsd === null ? "—" : formatUsd(hariIniUsd)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Bulan ini</dt>
              <dd className="font-medium tabular-nums">
                {bulanIniUsd === null ? "—" : formatUsd(bulanIniUsd)}
              </dd>
            </div>
          </dl>

          <div
            className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuenow={Math.round(persen)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Progres biaya AI terhadap batas bulanan"
          >
            <div
              className={cn(
                "h-full rounded-full transition-all",
                persen >= 100
                  ? "bg-status-failed"
                  : hampirHabis
                    ? "bg-primary"
                    : "bg-status-ready",
              )}
              style={{ width: `${Math.max(persen, 1)}%` }}
            />
          </div>

          <p
            className={cn(
              "mt-1.5 text-xs",
              persen >= 100 ? "text-status-failed" : "text-muted-foreground",
            )}
          >
            {formatUsd(pakai)} dari {formatUsd(batasUsd)} ({formatRupiah(batasUsd)})
            {persen >= 100 ? " — batas tercapai, panggilan AI berhenti" : ""}
            {persen >= 80 && persen < 100 ? " — mendekati batas" : ""}
          </p>
        </>
      ) : (
        <p className="mt-1 text-sm text-muted-foreground">
          Belum ada panggilan AI tercatat. Batas bulanan {formatUsd(batasUsd)} (
          {formatRupiah(batasUsd)}).
        </p>
      )}
    </div>
  );
}
