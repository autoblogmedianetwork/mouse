"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/card";
import { hitungKomisiTarget } from "@/lib/affiliate/kalkulator-komisi";
import { formatRupiah } from "@/lib/impor/normalisasi";
import { komisiPerKontenDariData, kebutuhanUntukTarget } from "@/lib/kalkulator/kalkulator-cuan";
import { bandingkanProduk } from "@/lib/kalkulator/banding";
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

      <BandingDuaProduk targetBulanan={Number(target) || 0} penjualanPerKonten={Number(penjualanPerKonten) || 0} />
    </Card>
  );
}

/** Bandingkan 2 produk: mana yang lebih cepat balik modal WAKTU (konten). */
function BandingDuaProduk({
  targetBulanan,
  penjualanPerKonten,
}: {
  targetBulanan: number;
  penjualanPerKonten: number;
}) {
  const [buka, setBuka] = useState(false);
  const [namaA, setNamaA] = useState("");
  const [hargaA, setHargaA] = useState("");
  const [rateA, setRateA] = useState("");
  const [namaB, setNamaB] = useState("");
  const [hargaB, setHargaB] = useState("");
  const [rateB, setRateB] = useState("");
  const [hasil, setHasil] = useState<ReturnType<typeof bandingkanProduk> | null>(null);

  const hitung = () => {
    setHasil(
      bandingkanProduk(
        { nama: namaA.trim() || "Produk A", harga: Number(hargaA), ratePersen: Number(rateA) },
        { nama: namaB.trim() || "Produk B", harga: Number(hargaB), ratePersen: Number(rateB) },
        targetBulanan,
        penjualanPerKonten > 0 ? 1 / penjualanPerKonten : 0,
      ),
    );
  };

  return (
    <div className="mt-4 border-t border-surface-border pt-4">
      <button type="button" className="text-badan font-medium underline" aria-expanded={buka} onClick={() => setBuka((v) => !v)}>
        {buka ? "Tutup perbandingan produk" : "Bandingkan 2 produk — mana lebih cepat cuan?"}
      </button>
      {buka ? (
        <div className="mt-3">
          <p className="text-meta text-muted-foreground">
            Memakai target dan estimasi penjualan di atas. Yang dibandingkan: berapa KONTEN yang
            harus dibuat per bulan untuk target yang sama — konten lebih sedikit = cuan lebih cepat.
          </p>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            <fieldset className="border border-surface-border p-3">
              <legend className="px-1 text-meta font-medium">Produk A</legend>
              <input value={namaA} onChange={(e) => setNamaA(e.target.value)} placeholder="Nama produk A" aria-label="Nama produk A" className={`mb-2 ${inputClass}`} />
              <div className="flex gap-2">
                <input type="number" min={0} inputMode="numeric" value={hargaA} onChange={(e) => setHargaA(e.target.value)} placeholder="Harga" aria-label="Harga produk A" className={inputClass} />
                <input type="number" min={0} step="0.1" inputMode="decimal" value={rateA} onChange={(e) => setRateA(e.target.value)} placeholder="Komisi %" aria-label="Persen komisi produk A" className={inputClass} />
              </div>
            </fieldset>
            <fieldset className="border border-surface-border p-3">
              <legend className="px-1 text-meta font-medium">Produk B</legend>
              <input value={namaB} onChange={(e) => setNamaB(e.target.value)} placeholder="Nama produk B" aria-label="Nama produk B" className={`mb-2 ${inputClass}`} />
              <div className="flex gap-2">
                <input type="number" min={0} inputMode="numeric" value={hargaB} onChange={(e) => setHargaB(e.target.value)} placeholder="Harga" aria-label="Harga produk B" className={inputClass} />
                <input type="number" min={0} step="0.1" inputMode="decimal" value={rateB} onChange={(e) => setRateB(e.target.value)} placeholder="Komisi %" aria-label="Persen komisi produk B" className={inputClass} />
              </div>
            </fieldset>
          </div>
          <button type="button" onClick={hitung} className="mt-3 inline-flex h-11 sm:h-9 items-center border border-primary bg-primary px-4 text-meta font-medium text-primary-foreground hover:opacity-90">
            Bandingkan
          </button>
          {hasil ? (
            hasil.ok ? (
              <div className="mt-3 space-y-2 text-badan">
                <p className={hasil.pemenang === "seri" ? "" : "font-medium"}>
                  {hasil.pemenang === "seri" ? "🤝" : "🏆"} {hasil.alasan}
                </p>
                <dl className="grid gap-2 sm:grid-cols-2">
                  {[hasil.a, hasil.b].map((s, i) => (
                    <div key={i} className={`border p-2 ${hasil.pemenang === (i === 0 ? "a" : "b") ? "border-primary bg-primary/5" : "border-surface-border"}`}>
                      <dt className="text-meta text-muted-foreground">
                        {s.nama} {hasil.pemenang === (i === 0 ? "a" : "b") ? "(pemenang)" : ""}
                      </dt>
                      <dd className="tabular-nums">
                        Komisi {formatRupiah(s.komisiPerUnit)}/unit · {s.kontenPerBulan} konten/bulan (± {s.kontenPerHari}/hari)
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            ) : (
              <p className="mt-3 text-meta text-status-failed" role="alert">
                {hasil.galat}
              </p>
            )
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
