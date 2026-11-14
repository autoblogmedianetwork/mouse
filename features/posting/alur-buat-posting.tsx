"use client";

/**
 * Alur bertahap Buat posting (PRD F0 checkpoint per tahap):
 * Penawaran → Analisis → Ide → Generate → Preview/Edit/Salin.
 * Semua output berstatus draft sampai user menekan "Tandai siap posting".
 *
 * Refactor R3: file ini kini hanya orkestrator — state & logika ada di
 * use-draft-posting.ts, tipe & helper di draft-posting.ts, dan tiap tahap
 * punya komponen sendiri (tahap-*.tsx). Tidak ada perubahan perilaku.
 */
import { useEffect, useMemo } from "react";
import { TautanMasuk } from "@/components/pesan-galat";
import { cn } from "@/lib/utils";
import { decodePrefill, nilaiFormDariPrefill } from "@/lib/impor/prefill";
import { useDraftPosting } from "./use-draft-posting";
import { LANGKAH_LIST } from "./draft-posting";
import { TahapProduk } from "./tahap-produk";
import { TahapAnalisisIde } from "./tahap-analisis-ide";
import { TahapGenerate } from "./tahap-generate";
import { TahapPreview } from "./tahap-preview";

export function AlurBuatPosting({ prefillKode }: { prefillKode?: string } = {}) {
  // Quick Capture (N-8): parameter `prefill` dibaca murni saat render. Nilai
  // yang tidak valid menjadi null, jadi tidak ada isian setengah jadi.
  const prefill = useMemo(() => decodePrefill(prefillKode), [prefillKode]);
  const nilaiAwalProduk = useMemo(
    () => (prefill ? nilaiFormDariPrefill(prefill) : undefined),
    [prefill],
  );

  const alur = useDraftPosting();
  const {
    draft,
    langkah,
    setLangkah,
    busy,
    setBusy,
    error,
    setError,
    errorSesi,
    pesan,
    tersimpanPukul,
    update,
    ringkasan,
    catatanAturan,
    siapkanDraft,
  } = alur;

  // Muat draft tersimpan saat mount (autosave lokal, Supabase belum terhubung).
  useEffect(() => {
    siapkanDraft(prefill);
  }, [prefill, siapkanDraft]);

  /* --------------------------------- Render ---------------------------------- */

  const indexLangkah = LANGKAH_LIST.findIndex(
    (l) => l.id === langkah || (l.id === "analisis" && langkah === "ide"),
  );

  return (
    <div className="space-y-6">
      {/* Indeks langkah */}
      <nav aria-label="Tahap" className="flex flex-wrap gap-2">
        {LANGKAH_LIST.map((l, i) => {
          const aktif = l.id === langkah || (l.id === "analisis" && langkah === "ide");
          const bisaKe =
            i <= indexLangkah || (Boolean(draft.produk) && l.id === "analisis");
          return (
            <button
              key={l.id}
              type="button"
              disabled={!bisaKe}
              onClick={() => bisaKe && setLangkah(l.id)}
              className={cn(
                "border px-3 py-1.5 text-meta font-medium transition-colors sm:text-badan font-mono",
                aktif
                  ? "border-primary bg-primary text-primary-foreground font-semibold"
                  : bisaKe
                    ? "border-surface-border bg-surface hover:bg-muted"
                    : "border-surface-border bg-surface text-muted-foreground opacity-50",
              )}
            >
              {l.label}
            </button>
          );
        })}
      </nav>

      {error ? (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 border border-status-failed/40 bg-status-failed/10 px-4 py-3 text-badan font-mono"
        >
          <span>
            {error}
            {errorSesi ? (
              <>
                {" "}
                <TautanMasuk tujuan="/posting/baru" />
              </>
            ) : null}
          </span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-meta underline-offset-2 hover:underline uppercase"
          >
            [ Tutup ]
          </button>
        </div>
      ) : null}

      {pesan ? (
        <p className="text-badan font-mono text-status-ready" aria-live="polite">
          {pesan}
        </p>
      ) : null}

      {/* ------------------------------ Tahap 1: penawaran --------------------------- */}
      {langkah === "produk" ? (
        <TahapProduk
          prefill={prefill}
          nilaiAwalProduk={nilaiAwalProduk}
          produk={draft.produk}
          analisisManual={draft.analisisManual}
          update={update}
          setPesan={alur.setPesan}
          setLangkah={setLangkah}
        />
      ) : null}

      {/* ----------------------------- Tahap 2-3: analisis & ide -------------------- */}
      {langkah === "analisis" || langkah === "ide" ? (
        <TahapAnalisisIde
          draft={draft}
          busy={busy}
          setBusy={setBusy}
          ringkasan={ringkasan}
          catatanAturan={catatanAturan}
          update={update}
          setLangkah={setLangkah}
          setError={setError}
          setPesan={alur.setPesan}
          jalankanAnalisis={() => alur.jalankanAnalisis()}
          jalankanSemuanya={() => alur.jalankanSemuanya()}
          jalankanIde={() => alur.jalankanIde()}
          toggleIde={alur.toggleIde}
        />
      ) : null}

      {/* ----------------------------- Tahap 3: generate -------------------------- */}
      {langkah === "generate" ? (
        <TahapGenerate
          draft={draft}
          busy={busy}
          catatanAturan={catatanAturan}
          update={update}
          setLangkah={setLangkah}
          jalankanGenerate={() => alur.jalankanGenerate()}
        />
      ) : null}

      {/* ------------------------------ Tahap 4: preview -------------------------- */}
      {langkah === "preview" ? (
        <TahapPreview
          draft={draft}
          kontenAktif={alur.kontenAktif}
          busy={busy}
          tersimpanPukul={tersimpanPukul}
          catatanAturan={catatanAturan}
          batasKarakter={alur.batasKarakter}
          semuaValid={alur.semuaValid}
          semuaChecklist={alur.semuaChecklist}
          update={update}
          setLangkah={() => setLangkah("preview")}
          setKontenAktif={alur.setKontenAktif}
          setKontenAktifCarousel={alur.setKontenAktifCarousel}
          simpanDraft={alur.simpanDraft}
          tandaiSiap={alur.tandaiSiap}
          salinUtas={() => alur.salinUtas()}
        />
      ) : null}
    </div>
  );
}
