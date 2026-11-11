"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/card";
import { hitungKomisiTarget } from "@/lib/affiliate/kalkulator-komisi";
import { formatRupiah } from "@/lib/impor/normalisasi";
import { komisiPerKontenDariData, kebutuhanUntukTarget } from "@/lib/kalkulator/kalkulator-cuan";
import { useAtribusi } from "@/features/performa/use-atribusi";

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
  const [penjualanPerKonten, setPenjualanPerKonten] = useState("20");
  const atribusi = useAtribusi();

  const hasil = useMemo(
    () =>
      hitungKomisiTarget({
        hargaProduk: Number(harga),
        persenKomisi: Number(persen),
        targetBulanan: Number(target),
      }),
    [harga, persen, target],
  );

  // Komisi per konten: dari data performa nyata bila cukup (>= 3 konten),
  // kalau belum, dari estimasi user (1 penjualan tiap N konten).
  const dariData = useMemo(() => {
    if (!atribusi.siap) return null;
    const jumlah = atribusi.hasil.per_konten.filter((k) => k.komisi_cair > 0).length;
    return komisiPerKontenDariData(atribusi.hasil.total.komisi, jumlah);
  }, [atribusi.siap, atribusi.hasil]);

  const kebutuhanKonten = useMemo(() => {
    if (hasil.komisiPerPenjualan <= 0) return null;
    if (dariData) return kebutuhanUntukTarget(Number(target) || 0, dariData, 1);
    const n = Number(penjualanPerKonten);
    if (n <= 0) return null;
    return kebutuhanUntukTarget(Number(target) || 0, hasil.komisiPerPenjualan, 1 / n);
  }, [hasil.komisiPerPenjualan, dariData, penjualanPerKonten, target]);

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

      {!dariData ? (
        <label className="mt-3 block text-meta font-medium">
          Estimasi pengalaman Anda: 1 penjualan tiap{" "}
          <input
            type="number"
            min={1}
            inputMode="numeric"
            value={penjualanPerKonten}
            onChange={(e) => setPenjualanPerKonten(e.target.value)}
            className="w-20 border border-surface-border bg-surface px-2 py-1 tabular-nums outline-none focus:border-primary"
          />{" "}
          konten
        </label>
      ) : null}
      {dariData ? (
        <p className="mt-3 text-meta text-muted-foreground">
          Dari data performa Anda: rata-rata{" "}
          <span className="font-medium text-foreground">{formatRupiah(dariData)}</span> komisi
          cair per konten — dipakai sebagai dasar hitungan di bawah.
        </p>
      ) : null}

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

      {kebutuhanKonten ? (
        <div className="mt-3 border border-primary/40 bg-primary/5 p-3 text-badan">
          <p className="font-medium">
            Untuk mencapai target: buat ±{" "}
            <span className="font-semibold">{kebutuhanKonten.kontenPerBulan}</span> konten per
            bulan (± {kebutuhanKonten.kontenPerHari} konten per hari).
          </p>
        </div>
      ) : null}

      {hasil.penjualanDibutuhkan === 0 ? (
        <p className="mt-3 text-meta text-muted-foreground">
          Isi harga, komisi, dan target di atas untuk melihat perkiraan.
        </p>
      ) : null}
    </Card>
  );
}
