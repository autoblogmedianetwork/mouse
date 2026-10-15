"use client";

/**
 * Daftar produk yang lama tidak diposting (feedback Claude #3 — Sedang):
 * "Mengingatkan produk yang sudah lama tidak diangkat, tanpa harus
 * mengingat sendiri."
 *
 * Sumbernya pustaka konten (localStorage), bukan laporan impor — jadi
 * bagian ini tetap tampil meski halaman Analitik belum punya baris performa.
 * Logika penilaian murni di lib/produk/status-posting.ts (bertes).
 */
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  BATAS_HARI_AWAL,
  BATAS_HARI_OPSI,
  filterUsiaTerakhir,
  statusPostingProduk,
} from "@/lib/produk/status-posting";
import { kontenSkema, type Konten } from "@/lib/konten/skema";
import { useLocalState } from "@/lib/konten/use-local-state";

/** Label produk: "belum pernah" dibuat eksplisit, bukan tanggal palsu. */
function usiaLabel(usiaHari: number | null): string {
  if (usiaHari === null) return "Belum pernah";
  if (usiaHari === 0) return "Hari ini";
  return `${usiaHari} hari lalu`;
}

function tanggalLabel(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isFinite(d.getTime())
    ? d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })
    : "—";
}

export function DaftarProdukBelumDiposting() {
  const [konten] = useLocalState<Konten[]>("autothreads-konten", []);
  const [batasHari, setBatasHari] = useState<number>(BATAS_HARI_AWAL);

  /** "Sekarang" diisi setelah mount lewat rAF (pola halaman Kalender). */
  const [sekarang, setSekarang] = useState<number | null>(null);
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setSekarang(Date.now()));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const daftar = useMemo(
    () =>
      konten.flatMap((k) => {
        const hasil = kontenSkema.safeParse(k);
        return hasil.success ? [hasil.data] : [];
      }),
    [konten],
  );

  const semuanya = useMemo(
    () => (sekarang === null ? [] : statusPostingProduk(daftar, sekarang)),
    [daftar, sekarang],
  );
  const hasil = useMemo(
    () => filterUsiaTerakhir(semuanya, batasHari),
    [semuanya, batasHari],
  );

  if (semuanya.length === 0) {
    return null; // Tidak ada produk sama sekali: bagian ini diam, bukan mengangguk.
  }

  return (
    <section className="rounded-xl border border-surface-border bg-surface p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Produk yang lama tidak diposting</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Dihitung dari konten terkirim di pustaka, termasuk konten terarsip. Buat ulang konten
            untuk produk yang sudah lama tidak diangkat.
          </p>
        </div>
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          Batas tidak diposting
          <select
            value={batasHari}
            onChange={(e) => setBatasHari(Number(e.target.value))}
            className="rounded-lg border border-surface-border bg-surface px-2 py-1.5 text-sm outline-none focus:border-primary"
            aria-label="Batas hari sejak terkirim terakhir"
          >
            {BATAS_HARI_OPSI.map((opsi) => (
              <option key={opsi} value={opsi}>
                {opsi} hari
              </option>
            ))}
          </select>
        </label>
      </div>

      {hasil.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">
          Semua produk sudah diposting dalam {batasHari} hari terakhir. Bagus.
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[40rem] text-sm">
            <caption className="sr-only">
              Produk beserta waktu terkirim terakhir dan usianya
            </caption>
            <thead>
              <tr className="border-surface-border text-muted-foreground border-b text-left text-xs uppercase tracking-wide">
                <th className="py-2 pr-3 font-medium">Produk</th>
                <th className="py-2 pr-3 font-medium">Konten</th>
                <th className="py-2 pr-3 font-medium">Terkirim terakhir</th>
                <th className="py-2 pr-3 font-medium">Usia</th>
                <th className="py-2 pr-3 font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {hasil.map((r) => (
                <tr key={r.produk} className="border-surface-border/60 border-b transition-colors">
                  <td className="py-2.5 pr-3 font-medium">{r.produk}</td>
                  <td className="py-2.5 pr-3 text-muted-foreground">
                    {r.jumlahTerkirim}/{r.jumlahKonten} terkirim
                  </td>
                  <td className="py-2.5 pr-3 tabular-nums">{tanggalLabel(r.terakhirTerkirim)}</td>
                  <td
                    className={
                      r.belumPernah
                        ? "text-status-failed py-2.5 pr-3 text-xs font-medium uppercase"
                        : "py-2.5 pr-3 tabular-nums"
                    }
                  >
                    {usiaLabel(r.usiaHari)}
                  </td>
                  <td className="py-2.5 pr-3">
                    <Link
                      href="/posting/baru"
                      className="text-primary text-xs underline-offset-2 hover:underline"
                    >
                      Buat ulang konten
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
