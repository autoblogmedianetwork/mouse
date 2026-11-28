"use client";

/**
 * Periksa kepatuhan konten (adaptasi kerangka "compliance-checker").
 *
 * Panel lipat di tahap preview: memeriksa teks terhadap aturan Shopee Affiliate
 * yang paling mudah dilanggar tanpa sadar (merek, clickbait, klaim kesehatan,
 * tautan dipendekkan). Semua dihitung di browser lewat lib/kepatuhan/periksa.ts
 * — tanpa AI, tanpa jaringan, jadi tetap jalan offline.
 */
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { periksaKepatuhan, type KonteksKonten } from "@/lib/kepatuhan/periksa";

export function PeriksaKepatuhan({ statuses }: { statuses: readonly string[] }) {
  const [buka, setBuka] = useState(false);
  const [konteks, setKonteks] = useState<KonteksKonten>("organik");
  const teks = statuses.join("\n\n");
  const hasil = useMemo(() => periksaKepatuhan(teks, { konteks }), [teks, konteks]);

  if (teks.trim() === "") return null;

  const blokir = hasil.temuan.filter((t) => t.tingkat === "blokir").length;

  return (
    <div className="border border-surface-border bg-surface">
      <button
        type="button"
        onClick={() => setBuka((b) => !b)}
        aria-expanded={buka}
        className="flex w-full items-center justify-between gap-3 px-3.5 py-3 text-left"
      >
        <span className="text-meta font-medium">
          Periksa kepatuhan
          <span className="ml-2 font-normal text-muted-foreground">
            {hasil.temuan.length === 0 ? "tidak ada temuan" : `${hasil.temuan.length} temuan`}
          </span>
        </span>
        <span className="flex items-center gap-2">
          <span
            className={cn(
              "border px-1.5 py-0.5 text-meta font-medium",
              hasil.lulus
                ? "border-status-ready/50 text-status-ready"
                : "border-status-failed/50 text-status-failed",
            )}
          >
            {hasil.lulus ? "Lulus" : `${blokir} blokir`}
          </span>
          <span className="text-meta text-muted-foreground">{buka ? "Tutup" : "Buka"}</span>
        </span>
      </button>

      {buka ? (
        <div className="space-y-3 border-t border-surface-border px-3.5 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-meta text-muted-foreground">Teks ini untuk:</span>
            {(["organik", "iklan"] as const).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setKonteks(k)}
                className={cn(
                  "border px-2 py-0.5 text-meta",
                  konteks === k
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-surface-border text-muted-foreground hover:bg-muted",
                )}
                aria-pressed={konteks === k}
              >
                {k === "organik" ? "Postingan biasa" : "Iklan berbayar"}
              </button>
            ))}
          </div>

          <p className="text-meta text-muted-foreground">
            Skor {hasil.skor}/100. Aturan diambil dari Syarat dan Ketentuan Program Afiliasi Shopee
            dan etika iklan Indonesia — bukan selera.
          </p>

          {hasil.temuan.length === 0 ? (
            <p className="text-meta text-status-ready">
              Tidak ada yang dilanggar. Tetap cek manual: harga, stok, dan klaim produk harus benar.
            </p>
          ) : (
            <ul className="space-y-2">
              {hasil.temuan.map((t) => (
                <li
                  key={t.id}
                  className={cn(
                    "border p-2.5",
                    t.tingkat === "blokir"
                      ? "border-status-failed/40 bg-status-failed/5"
                      : "border-warning/40 bg-warning/10",
                  )}
                >
                  <p className="text-meta font-semibold">
                    {t.tingkat === "blokir" ? "Blokir" : "Peringatan"} · {t.label}
                  </p>
                  {t.cuplikan ? (
                    <p className="mt-1 text-meta text-muted-foreground">“{t.cuplikan}”</p>
                  ) : null}
                  <p className="mt-1 text-meta">{t.pesan}</p>
                </li>
              ))}
            </ul>
          )}

          <details className="text-meta text-muted-foreground">
            <summary className="cursor-pointer">Pengingat tetap</summary>
            <ul className="mt-1 space-y-1">
              {hasil.catatan.map((c) => (
                <li key={c}>• {c}</li>
              ))}
            </ul>
          </details>
        </div>
      ) : null}
    </div>
  );
}
