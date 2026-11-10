"use client";

/**
 * Peta panen komisi: heatmap hari × blok jam dari laporan yang sudah diimpor.
 *
 * Angkanya dari `hitungPetaPanen` (lib/performa/peta-panen.ts) — bukan estimasi.
 * Metrik yang dipakai komisi cair, karena komisi pesanan batal hanya akan
 * membuat blok jam terlihat ramai padahal uangnya tidak diterima. Jumlah
 * pesanan dan klik tetap ditulis di tooltip supaya konteksnya tidak hilang.
 */
import { useMemo } from "react";
import { Card } from "@/components/card";
import { formatAngka, formatRupiah } from "@/lib/impor/normalisasi";
import type { BarisPerforma } from "@/lib/impor/skema";
import { BLOK_JAM, hitungPetaPanen, LABEL_HARI, labelBlok } from "@/lib/performa/peta-panen";
import { cn } from "@/lib/utils";

/** Lima tingkat warna; kelas ditulis utuh supaya tidak hilang saat dipindai Tailwind. */
const TINGKAT = ["bg-muted", "bg-primary/15", "bg-primary/30", "bg-primary/55", "bg-primary/80"];

function tingkatSel(rasio: number): string {
  if (rasio <= 0) return TINGKAT[0];
  if (rasio < 0.2) return TINGKAT[1];
  if (rasio < 0.45) return TINGKAT[2];
  if (rasio < 0.75) return TINGKAT[3];
  return TINGKAT[4];
}

const mikro = "font-mono text-meta uppercase tracking-meta";

function Ringkas({ label, nilai, catatan }: { label: string; nilai: string; catatan: string }) {
  return (
    <div className="border-2 border-foreground px-3 py-2">
      <p className={`${mikro} text-muted-foreground`}>{label}</p>
      <p className="mt-1 font-mono text-badan font-semibold tabular-nums">{nilai}</p>
      <p className="mt-0.5 text-meta text-muted-foreground">{catatan}</p>
    </div>
  );
}

export function PetaPanenKomisi({ baris }: { baris: BarisPerforma[] }) {
  const peta = useMemo(() => hitungPetaPanen(baris), [baris]);
  if (peta.total.baris === 0) return null;

  const maksHari = Math.max(...peta.per_hari.map((h) => h.komisi_cair), 1);
  const hariTerbaik = peta.hari_terbaik;
  const selTerbaik = peta.sel_terbaik;
  const jumlahHariAktif = peta.per_hari.filter((h) => h.baris > 0).length;

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-isi font-semibold">Peta panen komisi</h2>
          <p className="mt-1 text-badan text-muted-foreground">
            Kapan laporan Anda menghasilkan uang, dihitung dari {formatAngka(peta.total.baris)} baris
            bertanggal. Warna makin pekat = komisi cair makin besar.
          </p>
        </div>
        <p className={`${mikro} shrink-0 border-2 border-foreground px-2 py-1`}>
          {formatAngka(jumlahHariAktif)}/7 hari terisi
        </p>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Ringkas
          label="Hari terbaik"
          nilai={hariTerbaik ? hariTerbaik.label : "—"}
          catatan={
            hariTerbaik
              ? `${formatRupiah(hariTerbaik.komisi_cair)} cair · ${formatAngka(hariTerbaik.pesanan)} pesanan`
              : "Belum ada komisi"
          }
        />
        <Ringkas
          label="Jam terbaik"
          nilai={selTerbaik ? `${LABEL_HARI[selTerbaik.hari]} ${labelBlok(selTerbaik.blok)}` : "—"}
          catatan={
            selTerbaik
              ? `${formatRupiah(selTerbaik.komisi_cair)} cair · ${formatAngka(selTerbaik.klik)} klik`
              : peta.ada_jam
                ? "Belum ada komisi di grid jam"
                : "Laporan tidak memuat jam"
          }
        />
        <Ringkas
          label="Tanpa tanggal"
          nilai={formatAngka(peta.tanpa_tanggal.baris)}
          catatan={
            peta.tanpa_tanggal.baris > 0
              ? `${formatRupiah(peta.tanpa_tanggal.komisi)} tidak bisa ditempatkan di peta`
              : "Semua baris punya tanggal"
          }
        />
      </div>

      {peta.ada_jam ? (
        <>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[34rem] border-collapse text-meta">
              <caption className="sr-only">
                Komisi cair per hari dan blok jam. Baris hari Senin sampai Minggu, kolom blok empat
                jam.
              </caption>
              <thead>
                <tr>
                  <th scope="col" className={`${mikro} border-b-2 border-foreground py-2 pr-2 text-left font-medium text-muted-foreground`}>
                    Hari / jam
                  </th>
                  {BLOK_JAM.map((b) => (
                    <th
                      key={b.indeks}
                      scope="col"
                      className={`${mikro} border-b-2 border-foreground px-1 py-2 text-center font-medium text-muted-foreground`}
                    >
                      {b.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {LABEL_HARI.map((label, hari) => (
                  <tr key={label}>
                    <th
                      scope="row"
                      className="border-b border-surface-border py-1 pr-2 text-left font-mono text-meta font-medium uppercase tracking-meta"
                    >
                      {label}
                    </th>
                    {BLOK_JAM.map((b) => {
                      const sel = peta.per_sel[hari * BLOK_JAM.length + b.indeks];
                      const rasio = peta.maks_sel > 0 ? sel.komisi_cair / peta.maks_sel : 0;
                      const keterangan = `${label} ${b.label}: ${formatRupiah(sel.komisi_cair)} cair, ${formatAngka(sel.pesanan)} pesanan, ${formatAngka(sel.klik)} klik, ${formatAngka(sel.baris)} baris`;
                      return (
                        <td key={b.indeks} className="border-b border-surface-border p-0.5">
                          <div
                            role="img"
                            aria-label={keterangan}
                            title={keterangan}
                            className={cn(
                              "h-8 border border-foreground/15 sm:h-9",
                              tingkatSel(rasio),
                            )}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-meta text-muted-foreground">
            <span className={mikro}>Sepi</span>
            {TINGKAT.map((kelas) => (
              <span key={kelas} className={cn("h-3 w-6 border border-foreground/20", kelas)} aria-hidden="true" />
            ))}
            <span className={mikro}>Ramai</span>
            <span className="ml-2">
              Skala 0 – {formatRupiah(peta.maks_sel)} komisi cair per sel.{" "}
              {formatAngka(peta.baris_berjam)} dari {formatAngka(peta.total.baris)} baris membawa jam.
            </span>
          </div>
        </>
      ) : (
        <>
          <p className={`${mikro} mt-5 border-2 border-foreground bg-muted px-3 py-2`}>
            Laporan ini hanya memuat tanggal, jadi peta ditampilkan per hari. Ekspor yang menyertakan
            waktu pesanan (mis. kolom Waktu Pesanan Dibuat) akan mengisi grid jam.
          </p>
          <ul className="mt-4 space-y-3">
            {peta.per_hari.map((h) => (
              <li key={h.indeks} className="space-y-1">
                <div className="flex items-baseline justify-between gap-3 text-badan">
                  <span className="font-medium">{h.label}</span>
                  <span className="shrink-0 tabular-nums text-muted-foreground">
                    {formatRupiah(h.komisi_cair)} · {formatAngka(h.pesanan)} pesanan
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full bg-primary"
                    style={{
                      width: `${h.komisi_cair > 0 ? Math.max(2, Math.round((h.komisi_cair / maksHari) * 100)) : 0}%`,
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      <p className="mt-4 text-meta text-muted-foreground">
        Komisi cair dipakai karena pesanan batal tidak menghasilkan uang; jumlah pesanan batal tetap
        terlihat di ringkasan performa di atas.
      </p>
    </Card>
  );
}
