"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/card";
import { hitungKomisiTarget } from "@/lib/affiliate/kalkulator-komisi";
import { formatRupiah } from "@/lib/impor/normalisasi";

const inputClass =
  "w-full border border-surface-border bg-surface px-3 py-2 text-badan tabular-nums outline-none focus:border-primary";

/**
 * Kalkulator komisi & target cuan (Gelombang 1). Sepenuhnya lokal: user
 * memasukkan harga, persen komisi, dan target bulanan lalu melihat perkiraan
 * komisi per penjualan serta jumlah pesanan yang dibutuhkan.
 */
export function KalkulatorKomisi() {
  const [harga, setHarga] = useState("100000");
  const [persen, setPersen] = useState("10");
  const [target, setTarget] = useState("2000000");

  const hasil = useMemo(
    () =>
      hitungKomisiTarget({
        hargaProduk: Number(harga),
        persenKomisi: Number(persen),
        targetBulanan: Number(target),
      }),
    [harga, persen, target],
  );

  return (
    <Card>
      <h2 className="text-isi font-semibold">Kalkulator komisi &amp; target cuan</h2>
      <p className="mt-1 text-badan text-muted-foreground">
        Perkiraan kasar dari harga dan rate komisi. Semua dihitung di browser, tanpa API.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <label className="text-meta font-medium">
          Harga produk (Rp)
          <input
            type="number"
            min={0}
            inputMode="numeric"
            value={harga}
            onChange={(e) => setHarga(e.target.value)}
            className={`mt-1 ${inputClass}`}
          />
        </label>
        <label className="text-meta font-medium">
          Komisi (%)
          <input
            type="number"
            min={0}
            step="0.1"
            inputMode="decimal"
            value={persen}
            onChange={(e) => setPersen(e.target.value)}
            className={`mt-1 ${inputClass}`}
          />
        </label>
        <label className="text-meta font-medium">
          Target bulanan (Rp)
          <input
            type="number"
            min={0}
            inputMode="numeric"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className={`mt-1 ${inputClass}`}
          />
        </label>
      </div>

      <dl className="mt-4 grid gap-2 border-t border-surface-border pt-4 text-badan sm:grid-cols-2">
        <div className="flex items-baseline justify-between gap-3 sm:block">
          <dt className="text-meta text-muted-foreground">Komisi per penjualan</dt>
          <dd className="font-semibold tabular-nums">{formatRupiah(hasil.komisiPerPenjualan)}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-3 sm:block">
          <dt className="text-meta text-muted-foreground">Pesanan dibutuhkan / bulan</dt>
          <dd className="font-semibold tabular-nums">{hasil.penjualanDibutuhkan}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-3 sm:block">
          <dt className="text-meta text-muted-foreground">Estimasi omset produk</dt>
          <dd className="font-semibold tabular-nums">{formatRupiah(hasil.estimasiOmset)}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-3 sm:block">
          <dt className="text-meta text-muted-foreground">Rata-rata harian</dt>
          <dd className="font-semibold tabular-nums">
            {hasil.targetHarian.penjualanHarian} pesanan ·{" "}
            {formatRupiah(hasil.targetHarian.komisiHarian)}/hari
          </dd>
        </div>
      </dl>

      {hasil.penjualanDibutuhkan === 0 ? (
        <p className="mt-3 text-meta text-muted-foreground">
          Isi harga, komisi, dan target di atas untuk melihat perkiraan.
        </p>
      ) : null}
    </Card>
  );
}
