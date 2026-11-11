"use client";

/**
 * Insight otomatis (power-up Analitik): ringkasan satu kalimat per dimensi
 * A/B dari data atribusi konten. Murni tampilan; logika di lib murni.
 */
import { useMemo } from "react";
import { Card } from "@/components/card";
import { useAtribusi } from "@/features/performa/use-atribusi";
import { insightAtribusi } from "@/lib/performa/rekomendasi";

export function InsightAtribusi() {
  const atribusi = useAtribusi();
  const insight = useMemo(
    () => (atribusi.siap ? insightAtribusi(atribusi.hasil) : []),
    [atribusi.siap, atribusi.hasil],
  );

  if (!atribusi.siap) return null;
  if (insight.length === 0) return null;

  return (
    <Card>
      <h2 className="text-isi font-semibold">Insight otomatis</h2>
      <p className="mt-1 text-badan text-muted-foreground">
        Dibaca otomatis dari pemetaan gaya pembuka dan posisi link Anda.
      </p>
      <ul className="mt-3 space-y-2">
        {insight.map((teks) => (
          <li key={teks} className="border border-surface-border p-3 text-badan">
            {teks}
          </li>
        ))}
      </ul>
    </Card>
  );
}
