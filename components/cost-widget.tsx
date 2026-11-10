"use client";

/**
 * CostWidget (UI-Spec 3.9 header, PRD F10): today's and this month's AI cost
 * with progress against the monthly budget. Turns orange at 80% and red at
 * 100%, where PRD F10 says AI calls must stop.
 *
 * Pure presentation: the caller supplies the numbers, so this stays testable
 * and never reads env on its own.
 */
import Link from "next/link";
import { Card } from "@/components/card";
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
  perProvider = {},
  fallbackTerakhir = null,
  fallbackPanggilan = 0,
}: {
  hariIniUsd: number | null;
  bulanIniUsd: number | null;
  adaCatatan: boolean;
  batasUsd: number;
  perProvider?: Record<string, { panggilan: number; usd: number | null }>;
  fallbackTerakhir?: string | null;
  fallbackPanggilan?: number;
}) {
  // Provider paling banyak dipakai bulan ini; cukup tiga supaya widget tetap ringkas.
  const providerTeratas = Object.entries(perProvider)
    .sort(([, a], [, b]) => b.panggilan - a.panggilan)
    .slice(0, 3)
    .map(([nama, r]) => {
      const label =
        nama === "tidak tercatat" ? "lama" : nama === "env-fallback" ? "env (fallback)" : nama;
      return `${label} (${r.panggilan})`;
    });
  const pakai = bulanIniUsd ?? 0;
  const persen = batasUsd > 0 ? Math.min(100, (pakai / batasUsd) * 100) : 0;
  const hampirHabis = persen >= 80;

  return (
    <Card padat className="min-w-56 px-4 py-3">
      <p className="font-mono text-meta uppercase tracking-meta text-muted-foreground">
        Biaya AI
      </p>

      {adaCatatan ? (
        <>
          <dl className="mt-1 flex items-baseline gap-4 text-badan">
            <div>
              <dt className="text-meta text-muted-foreground">Hari ini</dt>
              <dd className="font-medium tabular-nums">
                {hariIniUsd === null ? "—" : formatUsd(hariIniUsd)}
              </dd>
            </div>
            <div>
              <dt className="text-meta text-muted-foreground">Bulan ini</dt>
              <dd className="font-medium tabular-nums">
                {bulanIniUsd === null ? "—" : formatUsd(bulanIniUsd)}
              </dd>
            </div>
          </dl>

          {/* Round track is a documented exception (ADR 0013: progress track). */}
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
              "mt-1.5 text-meta tabular-nums",
              persen >= 100 ? "text-status-failed" : "text-muted-foreground",
            )}
          >
            {formatUsd(pakai)} dari {formatUsd(batasUsd)} ({formatRupiah(batasUsd)})
            {persen >= 100 ? " — batas tercapai, panggilan AI berhenti" : ""}
            {persen >= 80 && persen < 100 ? " — mendekati batas" : ""}
          </p>

          {providerTeratas.length > 0 ? (
            <p className="mt-1 hidden text-meta text-muted-foreground sm:block">
              Provider: {providerTeratas.join(" · ")}
            </p>
          ) : null}

          {fallbackTerakhir ? (
            <p className="mt-1 border border-warning/50 bg-warning/10 px-2 py-1 text-meta text-warning-foreground">
              Provider database gagal; {fallbackPanggilan} panggilan bulan ini lewat env. Terakhir:{" "}
              {new Date(fallbackTerakhir).toLocaleString("id-ID", {
                dateStyle: "short",
                timeStyle: "short",
              })}
              .
            </p>
          ) : null}

          <Link
            href="/biaya"
            className="mt-1 inline-block text-meta text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
          >
            Rincian biaya →
          </Link>
        </>
      ) : (
        <p className="mt-1 text-badan text-muted-foreground">
          Belum ada panggilan AI tercatat. Batas bulanan {formatUsd(batasUsd)} (
          {formatRupiah(batasUsd)}).
        </p>
      )}
    </Card>
  );
}
