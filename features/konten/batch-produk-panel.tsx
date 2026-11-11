"use client";

/**
 * Batch produk: pilih 3–5 produk, buat draft konten (satu per produk), lalu
 * review satu per satu. Tidak ada posting otomatis dan tidak ada AI.
 */
import { useMemo, useState } from "react";
import { Card } from "@/components/card";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import Link from "next/link";
import { muatProduk, type ProdukRingkas } from "@/lib/produk/store";
import { useLocalState } from "@/lib/konten/use-local-state";
import type { Konten } from "@/lib/konten/skema";
import {
  KUNCI_BATCH_PRODUK,
  MAKS_PRODUK_BATCH,
  MIN_PRODUK_BATCH,
  buatBatch,
  hapusBatch,
  mulaiReview,
  ringkasanBatch,
  simpanBatch,
  tandaiDireview,
  validasiBatch,
  type BatchProduk,
} from "@/lib/konten/batch-produk";
import { formatAngka } from "@/lib/impor/normalisasi";


const mikro = "font-mono text-meta uppercase tracking-meta";
const btnGhost = "border border-surface-border px-3 py-1.5 text-meta font-medium hover:bg-muted";
const btnUtama =
  "inline-flex h-9 items-center border-2 border-foreground bg-primary px-4 font-mono text-meta font-semibold uppercase tracking-meta text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-60";

export function BatchProdukPanel() {
  const [produk] = useState<ProdukRingkas[]>(() =>
    typeof window === "undefined" ? [] : muatProduk(),
  );
  const [konten, setKonten] = useLocalState<Konten[]>("autothreads-konten", []);
  const [batchList, setBatchList] = useLocalState<BatchProduk[]>(KUNCI_BATCH_PRODUK, []);
  const [terpilih, setTerpilih] = useState<string[]>([]);
  const [formTerbuka, setFormTerbuka] = useState(false);
  const [pesan, setPesan] = useState<string | null>(null);
  const [galat, setGalat] = useState<string | null>(null);

  const produkMap = useMemo(
    () => new Map(produk.map((p) => [p.id, p])),
    [produk],
  );

  const ringkas = ringkasanBatch(batchList);

  const togglePilih = (id: string) => {
    setTerpilih((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const buat = () => {
    setGalat(null);
    const masalah = validasiBatch(terpilih, new Set(produk.map((p) => p.id)));
    if (masalah) {
      setGalat(masalah);
      return;
    }
    const { batch, kontenBaru } = buatBatch(terpilih, produkMap);
    setKonten((prev) => [...kontenBaru, ...prev]);
    const next = [batch, ...batchList];
    setBatchList(next);
    simpanBatch(next);
    setTerpilih([]);
    setFormTerbuka(false);
    setPesan(
      `${kontenBaru.length} draft dibuat dari batch ${batch.id.slice(0, 8)}. Buka tab Perlu review untuk meninjau satu per satu.`,
    );
  };

  const mulai = (id: string) => {
    setBatchList((prev) => {
      const next = prev.map((b) => (b.id === id ? mulaiReview(b) : b));
      simpanBatch(next);
      return next;
    });
  };

  const tandai = (id: string) => {
    setBatchList((prev) => {
      const next = prev.map((b) => (b.id === id ? tandaiDireview(b) : b));
      simpanBatch(next);
      const selesai = next.find((b) => b.id === id)?.status === "selesai";
      if (selesai) setPesan("Batch selesai: semua draft sudah direview.");
      return next;
    });
  };

  const hapus = (id: string) => {
    if (!window.confirm("Hapus batch ini? Draft konten yang sudah dibuat tetap ada di Antrian.")) return;
    const next = hapusBatch(batchList, id);
    setBatchList(next);
    simpanBatch(next);
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Batch produk"
        description="Buat 3–5 draft konten dari produk terpilih, lalu review satu per satu. Tidak ada posting otomatis."
      />

      {pesan ? (
        <p className="text-badan text-status-ready" aria-live="polite">
          {pesan}
        </p>
      ) : null}

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-isi font-semibold">Buat batch baru</h2>
            <p className="mt-1 text-badan text-muted-foreground">
              Pilih {MIN_PRODUK_BATCH}–{MAKS_PRODUK_BATCH} produk dari pustaka. Setiap produk
              menjadi satu draft di tab Perlu review.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setFormTerbuka((v) => !v)}
            className={btnUtama}
          >
            {formTerbuka ? "Tutup" : "Pilih produk"}
          </button>
        </div>

        {formTerbuka ? (
          <div className="mt-4 space-y-3">
            {produk.length === 0 ? (
              <p className="text-badan text-muted-foreground">
                Belum ada produk. Tambahkan produk dulu di halaman Produk.
              </p>
            ) : (
              <>
                <ul className="max-h-64 space-y-2 overflow-auto border-2 border-foreground p-2">
                  {produk.map((p) => (
                    <li key={p.id}>
                      <label className="flex cursor-pointer items-center gap-3 px-2 py-1.5 hover:bg-muted">
                        <input
                          type="checkbox"
                          checked={terpilih.includes(p.id)}
                          onChange={() => togglePilih(p.id)}
                          className="h-4 w-4 accent-[var(--primary)]"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block font-medium">{p.nama_internal || p.nama || p.id}</span>
                          {p.varian ? (
                            <span className={`${mikro} text-muted-foreground`}>{p.varian}</span>
                          ) : null}
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
                <p className={`${mikro} text-muted-foreground`}>
                  Terpilih: {formatAngka(terpilih.length)} / {MAKS_PRODUK_BATCH}
                </p>
                {galat ? (
                  <p className={`${mikro} border-2 border-status-failed bg-background px-3 py-2 text-status-failed`} role="alert">
                    ! {galat}
                  </p>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={buat} className={btnUtama} disabled={terpilih.length === 0}>
                    Buat batch
                  </button>
                  <button type="button" onClick={() => { setTerpilih([]); setGalat(null); }} className={btnGhost}>
                    Bersihkan pilihan
                  </button>
                </div>
              </>
            )}
          </div>
        ) : null}
      </Card>

      {batchList.length > 0 ? (
        <>
          <div className="grid gap-3 sm:grid-cols-4">
            <div className="border-2 border-foreground px-3 py-2">
              <p className={mikro}>Total batch</p>
              <p className="mt-1 font-mono text-badan font-semibold tabular-nums">
                {formatAngka(ringkas.total)}
              </p>
            </div>
            <div className="border-2 border-foreground px-3 py-2">
              <p className={mikro}>Antri</p>
              <p className="mt-1 font-mono text-badan font-semibold tabular-nums">{formatAngka(ringkas.antri)}</p>
            </div>
            <div className="border-2 border-foreground px-3 py-2">
              <p className={mikro}>Sedang review</p>
              <p className="mt-1 font-mono text-badan font-semibold tabular-nums">{formatAngka(ringkas.proses)}</p>
            </div>
            <div className="border-2 border-foreground px-3 py-2">
              <p className={mikro}>Selesai</p>
              <p className="mt-1 font-mono text-badan font-semibold tabular-nums">{formatAngka(ringkas.selesai)}</p>
            </div>
          </div>

          <ul className="space-y-3">
            {batchList.map((b) => {
              const itemSaatIni = b.konten_ids[b.indeks_review];
              const kontenSaatIni = itemSaatIni ? konten.find((k) => k.id === itemSaatIni) : null;
              const selesai = b.status === "selesai";
              return (
                <li key={b.id} className="border-2 border-foreground p-3 sm:p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium">Batch {b.id.slice(0, 8)}</p>
                      <p className={`${mikro} mt-1 text-muted-foreground`}>
                        {formatAngka(b.konten_ids.length)} draft · status {b.status} · dibuat{" "}
                        {new Date(b.dibuat_pada).toLocaleDateString("id-ID")}
                        {selesai && b.selesai_pada
                          ? ` · selesai ${new Date(b.selesai_pada).toLocaleDateString("id-ID")}`
                          : ""}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => hapus(b.id)}
                      className={`${mikro} border-2 border-foreground px-2 py-1 text-muted-foreground hover:bg-muted`}
                    >
                      Hapus
                    </button>
                  </div>

                  {b.status === "antri" ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button type="button" onClick={() => mulai(b.id)} className={btnUtama}>
                        Mulai review
                      </button>
                      <span className={`${mikro} self-center text-muted-foreground`}>
                        Draft sudah masuk tab Perlu review.
                      </span>
                    </div>
                  ) : null}

                  {b.status === "proses" ? (
                    <div className="mt-3 space-y-2 border-2 border-foreground bg-muted/30 p-3">
                      <p className={`${mikro} text-muted-foreground`}>
                        Review {b.indeks_review + 1} dari {b.konten_ids.length}
                      </p>
                      {kontenSaatIni ? (
                        <>
                          <p className="font-medium">{kontenSaatIni.judul}</p>
                          <p className="text-meta text-muted-foreground">
                            {kontenSaatIni.produk_nama} · {kontenSaatIni.statuses.length} status
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <Link
                              href="/antrian"
                              className="inline-flex h-9 items-center border-2 border-foreground px-4 font-mono text-meta font-medium hover:bg-muted"
                            >
                              Buka Konten
                            </Link>
                            <button type="button" onClick={() => tandai(b.id)} className={btnUtama}>
                              Sudah direview, lanjut
                            </button>
                          </div>
                        </>
                      ) : (
                        <p className="text-badan text-muted-foreground">
                          Draft tidak ditemukan (mungkin dihapus). Lewati.
                        </p>
                      )}
                      {kontenSaatIni ? null : (
                        <button type="button" onClick={() => tandai(b.id)} className={btnUtama}>
                          Lewati
                        </button>
                      )}
                    </div>
                  ) : null}

                  {selesai ? (
                    <p className={`${mikro} mt-3 border-2 border-status-ready bg-background px-3 py-2 text-status-ready`}>
                      + Selesai: semua draft sudah direview. Lanjutkan tandai siap posting di Antrian.
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </>
      ) : (
        <EmptyState
          title="Belum ada batch"
          description="Pilih 3–5 produk untuk membuat batch draft pertama."
          actionLabel="Pilih produk"
          actionHref="#"
        />
      )}

      <p className="text-meta text-muted-foreground">
        Catatan: batch hanya membuat draft. Setiap draft wajib ditinjau di tab
        Perlu review dan lolos checklist sebelum bisa ditandai siap posting (AGENTS
        aturan 4). Tidak ada pengiriman otomatis.
      </p>
    </div>
  );
}
