"use client";

/**
 * Tahap 2: Analisis & ide (refactor R3). JSX dipindah utuh dari
 * alur-buat-posting.tsx — dua layar (analisis + ide) + navigasi bersama.
 */
import { useState } from "react";
import { Card } from "@/components/card";
import { EmptyState } from "@/components/empty-state";
import { cn } from "@/lib/utils";
import { FORMAT_LABELS } from "@/lib/ai/schemas";
import { buatIdeManual } from "@/lib/konten/ide-manual";
import type { DraftState, Langkah } from "./draft-posting";
import { primaryBtn, ghostBtn } from "./draft-posting";

interface Props {
  draft: DraftState;
  busy: string | null;
  setBusy: (b: string | null) => void;
  ringkasan: string;
  catatanAturan: string | null;
  update: (patch: Partial<DraftState>) => void;
  setLangkah: (l: Langkah) => void;
  setError: (e: string | null) => void;
  setPesan: (p: string | null) => void;
  jalankanAnalisis: () => void;
  jalankanSemuanya: () => void;
  jalankanIde: () => void;
  toggleIde: (judul: string) => void;
}

export function TahapAnalisisIde({
  draft,
  busy,
  setBusy,
  ringkasan,
  catatanAturan,
  update,
  setLangkah,
  setError,
  setPesan,
  jalankanAnalisis,
  jalankanSemuanya,
  jalankanIde,
  toggleIde,
}: Props) {
  // Form ide manual (PRD F1): selalu tersedia walau panggilan AI gagal.
  const [judulManual, setJudulManual] = useState("");
  const [deskripsiManual, setDeskripsiManual] = useState("");
  const [formatManual, setFormatManual] = useState<(typeof FORMAT_LABELS)[number]>("Problem-Solution");

  /** Tambah satu ide buatan tangan; langsung terpilih supaya alur bisa lanjut. */
  const tambahIdeManual = () => {
    const hasil = buatIdeManual({
      judul: judulManual,
      deskripsi: deskripsiManual,
      format_label: formatManual,
    });
    if (!hasil.ok) {
      setError(hasil.error);
      return;
    }
    if (draft.ideList.some((i) => i.judul === hasil.ide.judul)) {
      setError("Ide dengan judul itu sudah ada di daftar.");
      return;
    }
    update({
      ideList: [...draft.ideList, hasil.ide],
      ideDipilih: [...draft.ideDipilih, hasil.ide.judul],
    });
    setJudulManual("");
    setDeskripsiManual("");
    setError(null);
    setPesan(`Ide "${hasil.ide.judul}" ditambahkan dan ikut terpilih.`);
  };

  const bannerAturan = catatanAturan ? (
    <div className="flex items-start gap-3 border border-warning/40 bg-warning/10 p-3.5 font-mono text-meta">
      <span aria-hidden className="text-badan leading-none font-bold text-warning">
        !!
      </span>
      <div>
        <p className="font-semibold text-warning uppercase tracking-meta">
          Pengingat Aturan Program Affiliate:
        </p>
        <p className="mt-1 leading-relaxed">{catatanAturan}</p>
      </div>
    </div>
  ) : null;

  return (
    <>
      {/* ----------------------------- Tahap 2: analisis -------------------------- */}
      <div className="space-y-6">
        <Card>
          <h2 className="text-isi font-semibold">Analisis penawaran</h2>
          <p className="mt-1 text-badan text-muted-foreground">
            Hasil AI bersifat draft dan bisa dikoreksi sebelum lanjut (PRD 10.3).
          </p>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => jalankanAnalisis()}
              disabled={busy !== null || !draft.produk}
              className={primaryBtn}
            >
              {busy === "analisis" ? "Menganalisis…" : "Analisis penawaran"}
            </button>
            {draft.produk ? (
              <button
                type="button"
                onClick={() => jalankanSemuanya()}
                disabled={busy !== null}
                className={primaryBtn}
              >
                {busy === "analisis"
                  ? "Buat Semuanya: 1/3 menganalisis…"
                  : busy === "ide"
                    ? "Buat Semuanya: 2/3 menyusun ide…"
                    : busy === "generate"
                      ? "Buat Semuanya: 3/3 menulis konten…"
                      : "Buat Semuanya (analisis → ide → konten)"}
              </button>
            ) : null}
            {busy === "analisis" ? (
              <button type="button" onClick={() => setBusy(null)} className={ghostBtn}>
                Batalkan
              </button>
            ) : null}
          </div>

          {!draft.produk ? (
            <p className="mt-3 text-badan text-status-failed">
              Isi penawaran di tahap 1 dulu.
            </p>
          ) : null}
        </Card>

        {draft.analisis ? (
          <Card>
            <div className="flex items-center justify-between">
              <h3 className="text-badan font-semibold">Hasil analisis</h3>
              <span className="text-meta text-muted-foreground">
                Confidence: {draft.analisis.confidence}
              </span>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-badan leading-6">
              {draft.analisis.ringkasan}
            </p>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-meta font-semibold uppercase tracking-meta text-muted-foreground">
                  Fitur
                </dt>
                <dd className="mt-1 list-inside list-disc text-badan">
                  {draft.analisis.fitur.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </dd>
              </div>
              <div>
                <dt className="text-meta font-semibold uppercase tracking-meta text-muted-foreground">
                  Target audiens
                </dt>
                <dd className="mt-1 list-inside list-disc text-badan">
                  {draft.analisis.target_audiens.map((a) => (
                    <li key={a}>{a}</li>
                  ))}
                </dd>
              </div>
            </dl>
            {draft.analisis.klaim_perlu_cek.length > 0 ? (
              <p className="mt-4 border border-status-failed/40 bg-status-failed/10 p-3 text-meta">
                Klaim yang perlu dicek: {draft.analisis.klaim_perlu_cek.join("; ")}
              </p>
            ) : null}
          </Card>
        ) : null}

        <Card>
          <label htmlFor="analisis-manual" className="mb-1 block text-badan font-medium">
            Ringkasan (bisa dikoreksi atau ditulis manual)
          </label>
          <textarea
            id="analisis-manual"
            rows={4}
            value={draft.analisisManual}
            onChange={(e) => update({ analisisManual: e.target.value })}
            placeholder="Tulis ringkasan produk sendiri jika AI tidak tersedia."
            className="w-full border border-surface-border bg-surface px-3 py-2 text-badan outline-none focus:border-primary"
          />
        </Card>

      </div>

      {/* ------------------------------- Tahap 3: ide ----------------------------- */}
      <div className="space-y-6">
        {bannerAturan}
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-isi font-semibold">Ide konten</h2>
              <p className="mt-1 text-badan text-muted-foreground">
                AI membuat 10 ide. Pilih satu atau beberapa (PRD F2).
              </p>
            </div>
            <button
              type="button"
              onClick={() => jalankanIde()}
              disabled={busy !== null}
              className={primaryBtn}
            >
              {busy === "ide" ? "Membuat ide…" : "Buat 10 ide"}
            </button>
          </div>
        </Card>

        {draft.ideList.length > 0 ? (
          <>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => update({ ideDipilih: draft.ideList.map((i) => i.judul) })}
                className="text-badan underline-offset-2 hover:underline"
              >
                Pilih semua
              </button>
              <button
                type="button"
                onClick={() => update({ ideDipilih: [] })}
                className="text-badan underline-offset-2 hover:underline"
              >
                Batalkan semua
              </button>
              <span className="ml-auto text-badan text-muted-foreground">
                {draft.ideDipilih.length} dipilih
              </span>
            </div>

            <ul className="grid gap-3 sm:grid-cols-2">
              {draft.ideList.map((ide) => {
                const dipilih = draft.ideDipilih.includes(ide.judul);
                return (
                  <li key={ide.judul}>
                    <label className="block h-full cursor-pointer">
                      <Card
                        nada={dipilih ? "aksen" : "netral"}
                        padat
                        className={cn(
                          "flex h-full flex-col p-4 transition-colors",
                          !dipilih && "hover:bg-muted/50",
                        )}
                      >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-badan font-semibold leading-5">{ide.judul}</span>
                        <input
                          type="checkbox"
                          checked={dipilih}
                          onChange={() => toggleIde(ide.judul)}
                          className="mt-1 h-4 w-4 accent-[var(--primary)]"
                        />
                      </div>
                      <p className="mt-2 text-badan text-muted-foreground">{ide.deskripsi}</p>
                      <p className="mt-2 text-meta">
                        <span className="bg-muted px-2 py-0.5 text-muted-foreground">
                          {ide.format_label}
                        </span>
                      </p>
                      <p className="mt-2 text-meta text-muted-foreground">
                        Jembatan: {ide.jembatan}
                      </p>
                      </Card>
                    </label>
                  </li>
                );
              })}
            </ul>
          </>
        ) : (
          <EmptyState
            title="Belum ada ide"
            description="Tekan “Buat 10 ide” untuk menghasilkan ide dari hasil analisis. Kalau AI tidak tersedia atau sedang gagal, tulis idemu sendiri di kartu Ide manual di bawah — alur tetap bisa lanjut sampai tahap edit."
          />
        )}

        {/* Ide manual: PRD F1 — input manual tidak pernah dihapus, AI hanya pelengkap. */}
        <Card>
          <h2 className="text-isi font-semibold">Ide manual</h2>
          <p className="mt-1 text-badan text-muted-foreground">
            Tanpa AI pun alur tetap berjalan: tulis idemu di sini, lanjut, lalu ketik
            statusnya sendiri di editor.
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto]">
            <input
              id="ide-manual-judul"
              type="text"
              value={judulManual}
              onChange={(e) => setJudulManual(e.target.value)}
              placeholder="Judul ide, mis. 5 alasan tas kanvas awet"
              className="w-full border border-surface-border bg-surface px-3 py-2 text-badan outline-none focus:border-primary"
            />
            <select
              id="ide-manual-format"
              value={formatManual}
              onChange={(e) =>
                setFormatManual(e.target.value as (typeof FORMAT_LABELS)[number])
              }
              aria-label="Label format ide"
              className="border border-surface-border bg-surface px-3 py-2 text-badan outline-none focus:border-primary"
            >
              {FORMAT_LABELS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>
          <input
            id="ide-manual-deskripsi"
            type="text"
            value={deskripsiManual}
            onChange={(e) => setDeskripsiManual(e.target.value)}
            placeholder="Deskripsi singkat (opsional)"
            className="mt-3 w-full border border-surface-border bg-surface px-3 py-2 text-badan outline-none focus:border-primary"
          />
          <div className="mt-3">
            <button type="button" onClick={tambahIdeManual} className={ghostBtn}>
              Tambah ide
            </button>
          </div>
        </Card>

      </div>

      {/* Navigasi bersama layar Analisis & ide (Fase 2-B) */}
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => setLangkah("produk")} className={ghostBtn}>
          Kembali
        </button>
        <button
          type="button"
          onClick={() => {
            if (!ringkasan.trim()) {
              if (draft.produk?.deskripsi_bersih || draft.produk?.deskripsi) {
                update({
                  analisisManual:
                    draft.produk.deskripsi_bersih || draft.produk.deskripsi,
                });
              } else {
                setError("Isi ringkasan penawaran dulu sebelum lanjut ke generate.");
                return;
              }
            }
            if (draft.ideDipilih.length === 0) {
              setError("Pilih minimal satu ide (atau tambah ide manual).");
              return;
            }
            setError(null);
            setLangkah("generate");
          }}
          className={primaryBtn}
        >
          Lanjut ke generate &gt;&gt;
        </button>
      </div>
    </>
  );
}
