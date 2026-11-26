"use client";

/**
 * EksporCsv — unduh Konten, Katalog, dan Performa sebagai CSV
 * (bank ide #1). Tujuannya Google Sheets: user bisa membuat rumus dan
 * pivot sendiri di sana. Unduhan lewat Blob karena butuh DOM.
 */
import { useMemo, useState } from "react";
import { Card } from "@/components/card";
import { muatKonten } from "@/lib/konten/store";
import { muatProduk } from "@/lib/produk/store";
import { usePerforma } from "@/features/impor/use-performa";
import {
  NAMA_BERKAS_CSV,
  csvKatalog,
  csvKonten,
  csvPerforma,
} from "@/lib/ekspor/csv-data";

const tombol =
  "inline-flex h-11 sm:h-9 items-center border border-surface-border px-3 text-meta font-medium hover:bg-muted disabled:opacity-40";

function unduh(nama: string, isi: string) {
  const blob = new Blob(["\uFEFF" + isi], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nama;
  a.click();
  URL.revokeObjectURL(url);
}

export function EksporCsv() {
  const [pesan, setPesan] = useState<string | null>(null);
  const konten = useMemo(() => muatKonten(), []);
  const produk = useMemo(() => muatProduk(), []);
  const { simpanan } = usePerforma();

  const aksi = {
    konten: () => unduh(NAMA_BERKAS_CSV.konten, csvKonten(konten)),
    katalog: () => unduh(NAMA_BERKAS_CSV.katalog, csvKatalog(produk)),
    performa: () => unduh(NAMA_BERKAS_CSV.performa, csvPerforma(simpanan.baris)),
  } as const;

  const jalankan = (jenis: keyof typeof aksi, jumlah: number) => {
    aksi[jenis]();
    setPesan(`${NAMA_BERKAS_CSV[jenis]} diunduh (${jumlah} baris). Buka di Google Sheets atau Excel.`);
  };

  return (
    <Card>
      <h2 className="text-isi font-semibold">Ekspor data (CSV)</h2>
      <p className="mt-1 text-badan text-muted-foreground">
        Unduh data untuk dianalisis bebas di Google Sheets atau Excel. Berkas
        berheader, aman dari rumus jebakan, dan siap dibuka langsung.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className={tombol} disabled={konten.length === 0} onClick={() => jalankan("konten", konten.length)}>
          Unduh Konten ({konten.length})
        </button>
        <button type="button" className={tombol} disabled={produk.length === 0} onClick={() => jalankan("katalog", produk.length)}>
          Unduh Katalog ({produk.length})
        </button>
        <button
          type="button"
          className={tombol}
          disabled={simpanan.baris.length === 0}
          onClick={() => jalankan("performa", simpanan.baris.length)}
        >
          Unduh Performa ({simpanan.baris.length})
        </button>
      </div>
      {pesan ? (
        <p role="status" className="mt-3 text-meta text-status-ready">
          {pesan}
        </p>
      ) : null}
    </Card>
  );
}
