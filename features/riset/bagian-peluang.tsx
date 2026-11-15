/**
 * Bagian 2, 2b, 3: hasil riset, perbandingan niche, dan tabel peluang produk.
 * Dipecah dari panel-riset.tsx (R6c) — tanpa perubahan perilaku.
 */
import Link from "next/link";
import { Card } from "@/components/card";
import { EmptyState } from "@/components/empty-state";
import { csvPeluang, csvRiset, NAMA_BERKAS } from "@/lib/riset/ekspor";
import {
  urutkanPeluang,
  type Peluang,
  type Riset,
} from "@/lib/riset/skema";
import { AMBANG_DIREKOMENDASIKAN, direkomendasikan } from "@/lib/riset/skor-peluang";
import {
  KEY_BANDING,
  bandingkanDua,
  buatSnapshot,
  simpanSnapshot,
  type SnapshotRiset,
} from "@/lib/riset/banding";
import { btnGhost, labelPrioritas, unduhCsv } from "./riset-bersama";

interface PropsHasil {
  riset: Riset | null;
  peluang: Peluang[];
  simpanKeBank: (
    masalah: readonly string[],
    kategori: string,
    sumber: "riset" | "review",
  ) => void;
}

export function BagianHasilRiset({ riset, peluang, simpanKeBank }: PropsHasil) {
  if (!riset) {
    return (
      <EmptyState
        title="Belum ada riset dipilih"
        description="Isi niche dan target audiens di atas, lalu jalankan riset. Riwayat riset sebelumnya ada di bagian bawah."
      />
    );
  }
  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-isi font-semibold">2. Masalah audiens ({riset.masalah.length})</h2>
          <p className="mt-1 text-badan text-muted-foreground">
            {riset.niche} · {riset.audiens} ·{" "}
            {new Date(riset.created_at).toLocaleString("id-ID")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={btnGhost}
            onClick={() =>
              simpanKeBank(
                riset.masalah.map((m) => m.masalah),
                riset.niche,
                "riset",
              )
            }
          >
            Simpan masalah ke bank
          </button>
          <button
            type="button"
            className={btnGhost}
            onClick={() => unduhCsv(NAMA_BERKAS.riset, csvRiset(riset))}
          >
            Ekspor {NAMA_BERKAS.riset}
          </button>
          {peluang.length > 0 ? (
            <button
              type="button"
              className={btnGhost}
              onClick={() => unduhCsv(NAMA_BERKAS.peluang, csvPeluang(peluang))}
            >
              Ekspor {NAMA_BERKAS.peluang}
            </button>
          ) : null}
        </div>
      </div>

      {riset.ringkasan ? (
        <p className="bg-muted px-3 py-2 text-badan">{riset.ringkasan}</p>
      ) : null}

      <ol className="grid gap-3 sm:grid-cols-2">
        {riset.masalah.map((m, i) => (
          <li key={`${m.masalah}-${i}`} className="border border-surface-border p-3">
            <div className="flex gap-2">
              <span className="font-mono text-meta text-muted-foreground">
                {String(i + 1).padStart(2, "0")}
              </span>
              <p className="text-badan font-medium">{m.masalah}</p>
            </div>
            {m.situasi ? (
              <p className="mt-1 text-meta text-muted-foreground">{m.situasi}</p>
            ) : null}
            {m.produk_contoh.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-1">
                {m.produk_contoh.map((p) => (
                  <span
                    key={p}
                    className="bg-muted px-2 py-0.5 text-meta text-muted-foreground"
                  >
                    {p}
                  </span>
                ))}
              </div>
            ) : null}
            {m.alasan ? <p className="mt-2 text-meta">{m.alasan}</p> : null}
          </li>
        ))}
      </ol>
    </Card>
  );
}

interface PropsBanding {
  snapshots: SnapshotRiset[];
}

export function BagianBandingNiche({ snapshots }: PropsBanding) {
  if (snapshots.length === 0) return null;
  return (
    <Card className="space-y-2">
      <h2 className="text-isi font-semibold">Perbandingan niche</h2>
      {snapshots.length === 2 ? (
        <ul className="space-y-1 text-badan">
          {bandingkanDua(snapshots[0], snapshots[1]).baris.map((t) => (
            <li key={t} className="border border-surface-border p-2">
              {t}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-badan text-muted-foreground">
          Snapshot tersimpan: &quot;{snapshots[0].niche}&quot;. Jalankan riset niche kedua
          lalu simpan untuk membandingkan.
        </p>
      )}
    </Card>
  );
}

interface PropsPeluang {
  riset: Riset | null;
  peluang: Peluang[];
  niche: string;
  snapshots: SnapshotRiset[];
  setSnapshots: React.Dispatch<React.SetStateAction<SnapshotRiset[]>>;
  buatProduk: (p: Peluang) => void;
  produkDiproses: string | null;
}

export function BagianPeluang({
  riset,
  peluang,
  niche,
  snapshots,
  setSnapshots,
  buatProduk,
  produkDiproses,
}: PropsPeluang) {
  if (!riset || peluang.length === 0) return null;
  return (
    <Card className="space-y-3">
      <div>
        <h2 className="text-isi font-semibold">3. Peluang produk ({peluang.length})</h2>
        <p className="mt-1 text-badan text-muted-foreground">
          Tekan “Buat produk” pada kategori yang ingin dikerjakan. Produk dibuat dengan
          sumber manual; harga dan tautan diisi di form produk.
        </p>
        <button
          type="button"
          onClick={() => {
            const snapshot = buatSnapshot(
              niche,
              peluang.map((p) => ({
                kategori: p.kategori,
                skor_total: p.skor_total ?? null,
                direkomendasikan: direkomendasikan(p),
              })),
            );
            const berikut = simpanSnapshot(snapshots, snapshot);
            setSnapshots(berikut);
            try {
              window.localStorage.setItem(KEY_BANDING, JSON.stringify(berikut));
            } catch {
              // storage tidak tersedia: snapshot tetap di layar
            }
          }}
          className="mt-2 h-8 border border-surface-border px-3 text-meta font-medium hover:bg-muted"
        >
          Simpan untuk perbandingan niche
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[46rem] text-badan">
          <caption className="sr-only">Daftar kategori peluang produk hasil riset</caption>
          <thead>
            <tr className="border-b border-surface-border text-left font-mono text-meta uppercase tracking-meta text-muted-foreground">
              <th className="py-2 pr-3 font-medium">#</th>
              <th className="py-2 pr-3 font-medium">Kategori</th>
              <th className="py-2 pr-3 font-medium">Skor</th>
                <th className="py-2 pr-3 font-medium">Prioritas</th>
              <th className="py-2 pr-3 font-medium">Masalah terkait</th>
              <th className="py-2 pr-3 font-medium">Contoh produk</th>
              <th className="py-2 pr-3 font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {urutkanPeluang(peluang).map((p) => (
              <tr key={p.id} className="border-b border-surface-border/60 align-top">
                <td className="py-2 pr-3 font-mono text-meta text-muted-foreground">
                  {String(p.urutan).padStart(2, "0")}
                </td>
                <td className="max-w-[16rem] py-2 pr-3">
                  <p className="font-medium">{p.kategori}</p>
                  <p className="mt-0.5 text-meta text-muted-foreground">{p.alasan}</p>
                </td>
                <td className="py-2 pr-3">
                  {p.skor_total ? (
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 text-meta font-medium ${
                        direkomendasikan(p)
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground"
                      }`}
                      title={
                        p.skor
                          ? `permintaan ${p.skor.permintaan ?? "-"}: ${p.skor.alasan_permintaan ?? "-"}; kompetisi ${p.skor.kompetisi ?? "-"}: ${p.skor.alasan_kompetisi ?? "-"}; kemudahan konten ${p.skor.kemudahan_konten ?? "-"}: ${p.skor.alasan_kemudahan_konten ?? "-"}; komisi ${p.skor.potensi_komisi ?? "-"}: ${p.skor.alasan_potensi_komisi ?? "-"}`
                          : undefined
                      }
                    >
                      {p.skor_total}/20{direkomendasikan(p) ? " ★" : ""}
                    </span>
                  ) : (
                    <span className="text-meta text-muted-foreground">—</span>
                  )}
                  {p.skor_total ? (
                    <p className="mt-1 text-meta text-muted-foreground">
                      layak duluan &ge; {AMBANG_DIREKOMENDASIKAN}
                    </p>
                  ) : null}
                </td>
                <td className="py-2 pr-3">
                  <span
                    className={`inline-block px-2 py-0.5 text-meta font-medium ${labelPrioritas[p.prioritas]}`}
                  >
                    {p.prioritas}
                  </span>
                  <p className="mt-1 text-meta text-muted-foreground">
                    konten: {p.kesulitan_konten}
                  </p>
                </td>
                <td className="max-w-[12rem] py-2 pr-3 text-meta text-muted-foreground">
                  {p.masalah_terkait ?? "—"}
                </td>
                <td className="max-w-[12rem] py-2 pr-3 text-meta text-muted-foreground">
                  {p.contoh_produk.join(", ") || "—"}
                </td>
                <td className="py-2 pr-3">
                  {p.dipilih && p.produk_id ? (
                    <Link
                      href="/posting/baru"
                      className="text-meta font-medium text-primary underline-offset-2 hover:underline"
                    >
                      Produk dibuat →
                    </Link>
                  ) : (
                    <button
                      type="button"
                      className={btnGhost}
                      onClick={() => buatProduk(p)}
                      disabled={produkDiproses !== null}
                    >
                      {produkDiproses === p.id ? "Membuat…" : "Buat produk"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
