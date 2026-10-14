"use client";

/**
 * Performa per konten dan per angle, plus pemetaan sub_id yang belum dikenali.
 *
 * Dipakai dua halaman: dashboard (versi ringkas, 3 konten teratas) dan
 * Analitik (versi lengkap). Semua angka berasal dari lib/performa/atribusi.ts.
 */
import Link from "next/link";
import { useState } from "react";
import { StatusBadge } from "@/components/status-badge";
import { formatAngka, formatRupiah } from "@/lib/impor/normalisasi";
import { LABEL_GAYA_HOOK, LABEL_LETAK_LINK } from "@/lib/konten/skema";
import { cn } from "@/lib/utils";
import type {
  RingkasanAngle,
  RingkasanDimensi,
  RingkasanKontenPerforma,
} from "@/lib/performa/atribusi";
import { useAtribusi } from "./use-atribusi";

const inputClass =
  "w-full rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary";
const btnGhost = "rounded-lg border border-surface-border px-3 py-1.5 text-xs font-medium hover:bg-muted";
const btnUtama =
  "inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-60";

function Bar({ nilai, maks }: { nilai: number; maks: number }) {
  const lebar = maks > 0 ? Math.max(2, Math.round((Math.abs(nilai) / maks) * 100)) : 0;
  return (
    <div className="h-2 w-full rounded-full bg-muted">
      <div className="h-2 rounded-full bg-primary" style={{ width: `${lebar}%` }} />
    </div>
  );
}

/** RingkasanAngle has the angle in its key; flatten it to the shared shape. */
function dariAngle(a: RingkasanAngle): RingkasanDimensi {
  return {
    kunci: a.angle,
    label: a.angle,
    konten: a.konten,
    komisi: a.komisi,
    komisi_cair: a.komisi_cair,
    pesanan: a.pesanan,
    klik: a.klik,
    konversi: a.konversi,
  };
}

/**
 * One recap block per content variable (angle, hook, letak link). The sort
 * toggle exists because Fase 6 asks two different questions of the same data:
 * which variable earns the most, and which one brings the most clicks.
 */
function BagianDimensi({
  judul,
  keterangan,
  satuan,
  daftar,
}: {
  judul: string;
  keterangan: string;
  /** Name of the variable in the row count line, e.g. "angle" or "hook". */
  satuan: string;
  daftar: RingkasanDimensi[];
}) {
  const [urut, setUrut] = useState<"komisi" | "klik">("komisi");
  if (daftar.length === 0) return null;

  const terurut = [...daftar].sort((a, b) =>
    urut === "klik" ? b.klik - a.klik || b.komisi - a.komisi : b.komisi - a.komisi || a.label.localeCompare(b.label),
  );
  const maks = Math.max(...terurut.map((d) => Math.abs(urut === "klik" ? d.klik : d.komisi)), 1);

  return (
    <section className="rounded-xl border border-surface-border bg-surface p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">{judul}</h2>
          <p className="mt-1 text-xs text-muted-foreground">{keterangan}</p>
        </div>
        <div className="flex gap-1" role="group" aria-label={`Urutkan ${judul}`}>
          {(
            [
              { value: "komisi", label: "Komisi" },
              { value: "klik", label: "Klik" },
            ] as const
          ).map((p) => (
            <button
              key={p.value}
              type="button"
              aria-pressed={urut === p.value}
              onClick={() => setUrut(p.value)}
              className={cn(
                "rounded-lg border border-surface-border px-2.5 py-1 text-xs font-medium transition-colors",
                urut === p.value ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted",
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <ul className="mt-4 space-y-4">
        {terurut.map((d) => (
          <li key={d.kunci} className="space-y-1.5">
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="min-w-0 truncate font-medium">{d.label}</span>
              <span className="shrink-0 tabular-nums text-muted-foreground">
                {formatRupiah(d.komisi)} · {d.konversi.toFixed(1)}%
              </span>
            </div>
            <Bar nilai={urut === "klik" ? d.klik : d.komisi} maks={maks} />
            <p className="text-xs text-muted-foreground">
              {formatAngka(d.konten)} konten ({satuan}) · {formatAngka(d.klik)} klik ·{" "}
              {formatAngka(d.pesanan)} pesanan
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function KartuRingkas({ daftar, catatan }: { daftar: RingkasanKontenPerforma[]; catatan: string }) {
  return (
    <section className="rounded-xl border border-surface-border bg-surface p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Konten paling menghasilkan</h2>
          <p className="mt-1 text-xs text-muted-foreground">{catatan}</p>
        </div>
        <Link href="/analitik" className="text-sm text-primary underline-offset-2 hover:underline">
          Lihat detail
        </Link>
      </div>
      <ul className="mt-4 space-y-4">
        {daftar.map((k) => (
          <li key={k.konten_id} className="space-y-1.5">
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="min-w-0 truncate font-medium">{k.judul}</span>
              <span className="shrink-0 tabular-nums text-muted-foreground">
                {formatRupiah(k.komisi)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {formatAngka(k.klik_dipakai)} klik · {formatAngka(k.pesanan)} pesanan ·{" "}
              {k.konversi.toFixed(1)}% konversi
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function BagianPerformaKonten({ lengkap = false }: { lengkap?: boolean }) {
  const { hasil, konten, siap, pesan, simpanBanyak } = useAtribusi();
  const [pilihan, setPilihan] = useState<Record<string, string>>({});

  if (!siap) {
    return (
      <div className="rounded-xl border border-surface-border bg-surface p-6 text-sm text-muted-foreground">
        Memuat atribusi konten…
      </div>
    );
  }

  // Tanpa satu pun konten, sub_id tak dikenal, atau baris tanpa sub_id, tidak ada
  // yang bisa ditampilkan. Baris tanpa sub_id tetap dihitung "ada" supaya import
  // yang tidak memuat kode pelacak tidak menghilang tanpa penjelasan.
  if (
    hasil.per_konten.length === 0 &&
    hasil.belum_terpetakan.length === 0 &&
    hasil.tanpa_subid.baris === 0
  ) {
    return null;
  }

  const belumDipetakan = hasil.belum_terpetakan.length;

  if (!lengkap) {
    // Tanpa konten terpetakan, kartu ringkas hanya akan jadi judul kosong.
    if (hasil.teratas.length === 0) return null;
    return (
      <div className="space-y-6">
        <KartuRingkas
          daftar={hasil.teratas}
          catatan={
            belumDipetakan > 0
              ? `${formatAngka(belumDipetakan)} sub_id dari laporan belum ditautkan ke konten.`
              : "Dihitung dari sub_id pada laporan yang diimpor."
          }
        />
      </div>
    );
  }

  const siapDiterapkan = Object.keys(pilihan).length > 0;

  return (
    <div className="space-y-6">
      {/* Tabel per konten */}
      <section className="rounded-xl border border-surface-border bg-surface p-4 sm:p-6">
        <h2 className="text-base font-semibold">Performa per konten</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Dihitung dari kolom Sub_id/Creator pada laporan yang Anda impor. Kode pelacak tiap konten
          bisa disalin di halaman Pustaka konten.
        </p>

        {hasil.per_konten.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Belum ada konten yang bisa dipasangkan dengan baris laporan. Salin kode pelacak konten di
            halaman Pustaka konten, pasang di link affiliate, lalu impor laporan berikutnya.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[46rem] text-sm">
              <caption className="sr-only">Performa per konten</caption>
              <thead>
                <tr className="border-b border-surface-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="py-2 pr-3 font-medium">Konten</th>
                  <th className="py-2 pr-3 font-medium">Sub ID</th>
                  <th className="py-2 pr-3 font-medium">Komisi</th>
                  <th className="py-2 pr-3 font-medium">Komisi cair</th>
                  <th className="py-2 pr-3 font-medium">Pesanan</th>
                  <th className="py-2 pr-3 font-medium">Klik</th>
                  <th className="py-2 pr-3 font-medium">Rp / klik</th>
                  <th className="py-2 pr-3 font-medium">Konversi</th>
                </tr>
              </thead>
              <tbody>
                {hasil.per_konten.map((k) => (
                  <tr key={k.konten_id} className="border-b border-surface-border/60 align-top">
                    <td className="max-w-[16rem] py-2 pr-3">
                      <p className="truncate font-medium">{k.judul}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {k.angle || "Tanpa angle"} · {k.produk_nama || "tanpa produk"}
                      </p>
                      <p className="truncate text-[11px] text-muted-foreground">
                        Hook: {LABEL_GAYA_HOOK[k.gaya_hook] ?? k.gaya_hook} · Link:{" "}
                        {LABEL_LETAK_LINK[k.letak_link] ?? k.letak_link}
                      </p>
                    </td>
                    <td className="py-2 pr-3 font-mono text-xs text-muted-foreground">
                      {k.sub_ids.join(", ") || "—"}
                    </td>
                    <td className="py-2 pr-3 tabular-nums">{formatRupiah(k.komisi)}</td>
                    <td className="py-2 pr-3 tabular-nums text-status-ready">
                      {formatRupiah(k.komisi_cair)}
                    </td>
                    <td className="py-2 pr-3 tabular-nums">{formatAngka(k.pesanan)}</td>
                    <td className="py-2 pr-3 tabular-nums">
                      {formatAngka(k.klik_dipakai)}
                      {k.klik_impor === 0 && k.klik_manual > 0 ? (
                        <span className="ml-1 text-xs text-muted-foreground">(manual)</span>
                      ) : null}
                    </td>
                    <td className="py-2 pr-3 tabular-nums">{formatRupiah(k.komisi_per_klik)}</td>
                    <td className="py-2 pr-3 tabular-nums">{k.konversi.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span>
            {formatAngka(hasil.total.baris_terpetakan)} baris laporan sudah tersambung ke konten.
          </span>
          {hasil.tanpa_subid.baris > 0 ? (
            <span>
              {formatAngka(hasil.tanpa_subid.baris)} baris tanpa sub_id ({formatRupiah(hasil.tanpa_subid.komisi)})
              belum bisa diatribusikan.
            </span>
          ) : null}
          {hasil.konten_tanpa_data > 0 ? (
            <span>{formatAngka(hasil.konten_tanpa_data)} konten belum punya komisi tercatat.</span>
          ) : null}
        </div>
      </section>

      {/* A/B per variabel (Fase 6): angle, gaya hook, letak link */}
      <BagianDimensi
        judul="Performa per angle"
        satuan="angle"
        keterangan="Angle diambil dari ide konten yang Anda pilih saat membuat utas."
        daftar={hasil.per_angle.map(dariAngle)}
      />
      <BagianDimensi
        judul="Performa per gaya hook"
        satuan="hook"
        keterangan="Gaya hook pembuka yang dipakai saat generate (Pengaturan generate). Ubah untuk A/B."
        daftar={hasil.per_hook}
      />
      <BagianDimensi
        judul="Performa per letak link"
        satuan="letak link"
        keterangan="Posisi link affiliate di dalam utas: status terakhir, balasan terpisah, atau tanpa link."
        daftar={hasil.per_letak_link}
      />

      {/* Pemetaan sub_id */}
      {belumDipetakan > 0 ? (
        <section className="rounded-xl border border-surface-border bg-surface p-4 sm:p-6">
          <h2 className="text-base font-semibold">
            Sub ID belum ditautkan ({formatAngka(belumDipetakan)})
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Kode ini muncul di laporan tetapi belum dikenali. Pilih konten yang memakainya, lalu
            terapkan. Pemetaan tersimpan di peramban ini.
          </p>

          <div className="mt-4 space-y-3">
            {hasil.belum_terpetakan.map((b) => (
              <div
                key={b.sub_id}
                className="flex flex-wrap items-center gap-3 rounded-lg border border-surface-border p-3 text-sm"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-mono text-xs">{b.sub_id}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatRupiah(b.komisi)} · {formatAngka(b.pesanan)} pesanan ·{" "}
                    {formatAngka(b.klik)} klik · {formatAngka(b.baris)} baris
                  </p>
                </div>
                <label className="flex items-center gap-2">
                  <span className="sr-only">Konten untuk {b.sub_id}</span>
                  <select
                    value={pilihan[b.sub_id] ?? ""}
                    aria-label={`Konten untuk sub_id ${b.sub_id}`}
                    className={`${inputClass} w-full sm:w-64`}
                    onChange={(e) => setPilihan((prev) => ({ ...prev, [b.sub_id]: e.target.value }))}
                  >
                    <option value="">— pilih konten —</option>
                    <option value="__lepas__">Lepas pemetaan</option>
                    {konten.map((k) => (
                      <option key={k.id} value={k.id}>
                        {k.judul}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              className={btnUtama}
              disabled={!siapDiterapkan}
              onClick={() => {
                simpanBanyak(
                  Object.entries(pilihan)
                    .filter(([, nilai]) => nilai !== "")
                    .map(([subId, nilai]) => ({
                      subId,
                      kontenId: nilai === "__lepas__" ? null : nilai,
                    })),
                );
                setPilihan({});
              }}
            >
              Terapkan pemetaan
            </button>
            {siapDiterapkan ? (
              <button type="button" className={btnGhost} onClick={() => setPilihan({})}>
                Batalkan pilihan
              </button>
            ) : (
              <span className="text-xs text-muted-foreground">
                Belum ada pilihan yang siap diterapkan.
              </span>
            )}
          </div>
        </section>
      ) : null}

      {/* Sub_id yang sudah dipetakan manual tetap perlu bisa dilepas */}
      {belumDipetakan === 0 && hasil.per_konten.length > 0 ? (
        <p className="text-xs text-muted-foreground">
          Semua sub_id pada laporan sudah dikenali.{" "}
          <Link href="/antrian" className="text-primary underline-offset-2 hover:underline">
            Buka Antrian review
          </Link>{" "}
          untuk menyalin kode pelacak konten baru.
        </p>
      ) : null}

      {pesan ? <p className="text-sm text-status-failed">{pesan}</p> : null}

      <div className="rounded-xl border border-surface-border bg-surface p-4 text-xs text-muted-foreground">
        <p className="font-medium text-foreground">Cara memasang kode pelacak</p>
        <p className="mt-1">
          Setiap konten punya kode seperti <span className="font-mono">at-3f9c21</span>. Tempel kode itu
          di kolom sub_id (Shopee), Creator (TikTok Shop), atau kanal (Tokopedia) pada pembuat link
          affiliate. Setelah laporan berikutnya diimpor, komisi konten itu terhitung otomatis.
        </p>
        <p className="mt-2">
          Status konten di tabel bersifat informasi:{" "}
          <StatusBadge status="terkirim" /> berarti utas itu sudah diposting.
        </p>
      </div>
    </div>
  );
}
