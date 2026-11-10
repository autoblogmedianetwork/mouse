"use client";

/** Status anggaran AI ringkas di topbar; detail lengkap ada di /biaya. */
import Link from "next/link";
import { useEffect, useState } from "react";
import { ambilJson } from "@/lib/api/klien";
import { cn } from "@/lib/utils";

interface Ringkas {
  bulanIniUsd: number | null;
  batasUsd: number;
  persenBulan: number;
}

export function BudgetIndicator() {
  const [data, setData] = useState<Ringkas | null>(null);

  useEffect(() => {
    let hidup = true;
    void ambilJson<Ringkas & { ok: boolean }>("/api/biaya").then((hasil) => {
      if (!hidup || !hasil.ok) return;
      setData({
        bulanIniUsd: hasil.data.bulanIniUsd ?? null,
        batasUsd: typeof hasil.data.batasUsd === "number" ? hasil.data.batasUsd : 0,
        persenBulan: typeof hasil.data.persenBulan === "number" ? hasil.data.persenBulan : 0,
      });
    });
    return () => {
      hidup = false;
    };
  }, []);

  if (!data) return null;

  const persen = Math.min(100, Math.max(0, data.persenBulan));
  const dipakai = data.bulanIniUsd ?? 0;

  return (
    <Link
      href="/biaya"
      title="Biaya AI bulan ini — buka rincian"
      className={cn(
        "ml-auto shrink-0 border px-2 py-1 font-mono text-mikro uppercase tracking-badge tabular-nums",
        persen >= 100
          ? "border-status-failed text-status-failed"
          : persen >= 80
            ? "border-warning text-warning-foreground"
            : "border-surface-border text-muted-foreground hover:text-foreground",
      )}
    >
      AI ${dipakai.toFixed(2)} / ${data.batasUsd.toFixed(2)}
    </Link>
  );
}
