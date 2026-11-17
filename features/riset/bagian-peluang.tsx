/**
 * Bagian 2, 2b, 3: hasil riset, perbandingan niche, dan tabel peluang produk.
 * Dipecah dari panel-riset.tsx (R6c) — tanpa perubahan perilaku.
 */
import Link from "next/link";
import { Card } from "@/components/card";
import { EmptyState } from "@/components/empty-state";
import { TabelResponsif, type BarisTabel } from "@/components/tabel-responsif";
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

      {/* Satu kolom penuh: situasi & alasan butuh lebar baca, bukan grid 2 kolom
          yang menjepit teks ke ~45% layar dan bikin card tinggi tidak rata. */}
      <ol className="space-y-3">
        {riset.masalah.map((m, i) => (
          <li
            key={`${m.masalah}-${i}`}
            className="border border-surface-border p-3 sm:flex sm:gap-3"
          >
            <span
              aria-hidden="true"
              className="mb-1 block font-mono text-meta text-muted-foreground sm:mb-0 sm:pt-0.5"
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-isi font-semibold leading-snug">{m.masalah}</p>
              {/* Label sumber (masukan review UI): jujur soal asal data. */}
              <p className="mt-1 text-mikro font-medium uppercase tracking-badge text-muted-foreground">
                sumber: analisis AI
              </p>
              {m.situasi ? (
                <p className="mt-2 text-badan text-muted-foreground">
                  <span className="font-medium text-foreground">situasi: </span>
                  {m.situasi}
                </p>
              ) : null}
              {m.produk_contoh.length > 0 ? (
                <div className="mt-2 flex flex-wrap items-center gap-1">
                  <span className="text-meta text-muted-foreground">produk: </span>
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
              {m.alasan ? (
                <p className="mt-2 text-meta text-muted-foreground">
                  <span className="font-medium text-foreground">kenapa muncul: </span>
                  {m.alasan}
                </p>
              ) : null}
            </div>
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
        <p className="border border-surface-border bg-muted px-3 py-2 text-meta text-muted-foreground">
          Skor di bawah adalah <strong className="text-foreground">saran awal AI</strong>,
          bukan data penjualan. Validasi dulu lewat Review pasar (bagian atas halaman ini)
          dan performa kontenmu di Analitik sebelum menekan “Buat produk”.
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
          className="mt-2 h-11 border border-surface-border px-3 text-meta font-medium hover:bg-muted sm:h-8"
        >
          Simpan untuk perbandingan niche
        </button>
      </div>

      <TabelResponsif
        kolom={["#", "Kategori", "Skor", "Prioritas", "Masalah terkait", "Contoh produk", "Aksi"]}
        caption="Daftar kategori peluang produk hasil riset"
        kelasTabel="text-badan"
        baris={urutkanPeluang(peluang).map(
          (p): BarisTabel => ({
            kunci: p.id,
            sel: [
              {
                isi: String(p.urutan).padStart(2, "0"),
                kelasTabel: "font-mono text-meta text-muted-foreground",
              },
              {
                isi: (
                  <>
                    <p className="font-medium">{p.kategori}</p>
                    <p className="mt-0.5 text-meta text-muted-foreground">{p.alasan}</p>
                  </>
                ),
                kelasTabel: "max-w-[16rem]",
              },
              {
                isi: (
                  <>
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
                  </>
                ),
              },
              {
                isi: (
                  <>
                    <span
                      className={`inline-block px-2 py-0.5 text-meta font-medium ${labelPrioritas[p.prioritas]}`}
                    >
                      {p.prioritas}
                    </span>
                    <p className="mt-1 text-meta text-muted-foreground">
                      konten: {p.kesulitan_konten}
                    </p>
                  </>
                ),
              },
              {
                isi: p.masalah_terkait ?? "—",
                kelasTabel: "max-w-[12rem] text-meta text-muted-foreground",
              },
              {
                isi: p.contoh_produk.join(", ") || "—",
                kelasTabel: "max-w-[12rem] text-meta text-muted-foreground",
              },
              {
                isi: p.dipilih && p.produk_id ? (
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
                ),
              },
            ],
          }),
        )}
      />
    </Card>
  );
}
