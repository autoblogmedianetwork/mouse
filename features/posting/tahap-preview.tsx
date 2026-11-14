"use client";

/**
 * Tahap 4: Preview & salin (refactor R3). JSX dipindah utuh dari
 * alur-buat-posting.tsx — termasuk editor carousel, checklist gate,
 * dan ActionBar.
 */
import { EmptyState } from "@/components/empty-state";
import { cn } from "@/lib/utils";
import { StatusEditor } from "./status-editor";
import { ThreadsPreview } from "./threads-preview";
import { CarouselSlideEditor } from "./carousel-slide-editor";
import type { CarouselResponse } from "@/lib/ai/schemas";
import { ChecklistGate, type ChecklistId } from "./checklist-gate";
import { ActionBar } from "./action-bar";
import { charLength } from "@/lib/statuses/validator-500";
import { TombolSuaraNarasi } from "./tombol-suara-narasi";
import { TombolRenderVideo } from "./tombol-render-video";
import { PanduanFotoCandid } from "./panduan-foto-candid";
import { LanjutLangkah } from "@/components/lanjut-langkah";
import type { PenawaranSaved } from "./form-penawaran";
import type { DraftState, KontenKerja } from "./draft-posting";
import { primaryBtn } from "./draft-posting";

interface Props {
  draft: DraftState;
  kontenAktif: KontenKerja | null;
  busy: string | null;
  tersimpanPukul: string | null;
  catatanAturan: string | null;
  batasKarakter: number;
  semuaValid: boolean;
  semuaChecklist: boolean;
  update: (patch: Partial<DraftState>) => void;
  setLangkah: (l: "preview") => void;
  setKontenAktif: (statuses: string[]) => void;
  setKontenAktifCarousel: (statuses: string[], carousel: CarouselResponse) => void;
  simpanDraft: () => void;
  tandaiSiap: () => void;
  salinUtas: () => void;
}

export function TahapPreview({
  draft,
  kontenAktif,
  busy,
  tersimpanPukul,
  catatanAturan,
  batasKarakter,
  semuaValid,
  semuaChecklist,
  update,
  setLangkah,
  setKontenAktif,
  setKontenAktifCarousel,
  simpanDraft,
  tandaiSiap,
  salinUtas,
}: Props) {
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

  if (draft.konten.length === 0) {
    return (
      <div className="space-y-4">
        <EmptyState
          title="Belum ada konten"
          description="Generate konten di tahap 4. Untuk menulis manual, gunakan tombol di bawah."
        />
        <div className="text-center">
          <button
            type="button"
            onClick={() => {
              if (draft.konten.length === 0 && draft.ideList.length > 0) {
                update({
                  konten: draft.ideList
                    .filter((i) => draft.ideDipilih.includes(i.judul))
                    .map((ide) => ({ ide, statuses: [""] })),
                  kontenAktif: 0,
                });
              }
              setLangkah("preview");
            }}
            className={primaryBtn}
          >
            Tulis status manual
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {bannerAturan}
      {/* Tab konten bila ada lebih dari satu */}
      {draft.konten.length > 1 ? (
        <div className="flex flex-wrap gap-2">
          {draft.konten.map((k, i) => (
            <button
              key={k.ide.judul}
              type="button"
              onClick={() => update({ kontenAktif: i })}
              className={cn(
                "border px-3 py-1.5 text-meta transition-colors",
                i === draft.kontenAktif
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-surface-border bg-surface hover:bg-muted",
              )}
            >
              {i + 1}. {k.ide.judul}
            </button>
          ))}
        </div>
      ) : null}

      {draft.pengaturan.mode_output === "carousel" ? (
        <CarouselSlideEditor
          slides={
            kontenAktif?.carousel?.slides ?? [
              {
                urutan: 1,
                peran: "cover",
                kicker: "PILIHAN TERBAIK",
                headline: kontenAktif?.ide.judul ?? "Review Produk",
                isi: "",
              },
              {
                urutan: 2,
                peran: "isi",
                kicker: null,
                headline: "Keunggulan Utama",
                isi: kontenAktif?.statuses[1] ?? "Penjelasan detail produk...",
              },
              {
                urutan: 3,
                peran: "cta",
                kicker: null,
                headline: "Cek Link Produk",
                isi: "Tautan pembelian tersedia di bio atau komentar.",
              },
            ]
          }
          caption={kontenAktif?.carousel?.caption ?? kontenAktif?.statuses[0] ?? ""}
          hashtag={kontenAktif?.carousel?.hashtag ?? []}
          produkNama={draft.produk?.nama || draft.produk?.nama_internal || "Produk Pilihan"}
          fotoUrl={(draft.produk as PenawaranSaved)?.gambar_url || ""}
          handleAkun={draft.produk?.nama_internal || ""}
          onChangeSlides={(newSlides) => {
            const nextCarousel: CarouselResponse = {
              slides: newSlides,
              caption: kontenAktif?.carousel?.caption ?? kontenAktif?.statuses[0] ?? "",
              hashtag: kontenAktif?.carousel?.hashtag ?? [],
              klaim_perlu_cek: kontenAktif?.carousel?.klaim_perlu_cek ?? [],
            };
            const newStatuses = [
              nextCarousel.caption,
              ...newSlides.map((s) => {
                const head = s.headline || s.judul || "";
                const bodyText = s.isi || "";
                return s.kicker
                  ? `[${s.kicker}] ${head}\n${bodyText}`.trim()
                  : `${head}\n${bodyText}`.trim();
              }),
            ];
            setKontenAktifCarousel(newStatuses, nextCarousel);
          }}
          onChangeCaption={(newCaption) => {
            if (!kontenAktif) return;
            const currentCarousel = kontenAktif.carousel ?? {
              slides: [],
              caption: "",
              hashtag: [],
              klaim_perlu_cek: [],
            };
            const nextCarousel: CarouselResponse = {
              ...currentCarousel,
              caption: newCaption,
            };
            const newStatuses = [newCaption, ...kontenAktif.statuses.slice(1)];
            setKontenAktifCarousel(newStatuses, nextCarousel);
          }}
          onChangeHashtag={(newHashtag) => {
            if (!kontenAktif) return;
            const currentCarousel = kontenAktif.carousel ?? {
              slides: [],
              caption: "",
              hashtag: [],
              klaim_perlu_cek: [],
            };
            const nextCarousel: CarouselResponse = {
              ...currentCarousel,
              hashtag: newHashtag,
            };
            setKontenAktifCarousel(kontenAktif.statuses, nextCarousel);
          }}
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-3">
            <StatusEditor
              statuses={kontenAktif?.statuses ?? []}
              onChange={setKontenAktif}
              batas={batasKarakter}
            />
            <ChecklistGate
              nilai={draft.checklist}
              onChange={(id: ChecklistId, checked: boolean) =>
                update({ checklist: { ...draft.checklist, [id]: checked } })
              }
              aturanKepercayaanAktif={draft.pengaturan.aturan_kepercayaan}
            />
          </div>
          <div className="lg:col-span-2">
            <ThreadsPreview
              statuses={kontenAktif?.statuses ?? []}
              linkProduk={draft.produk?.url_referensi || undefined}
              letakLink={draft.pengaturan.letak_link}
              batas={batasKarakter}
            />
            <p className="mt-3 text-meta text-muted-foreground">
              Total{" "}
              {kontenAktif?.statuses.reduce((sum, s) => sum + charLength(s), 0) ?? 0} karakter
              di {kontenAktif?.statuses.length ?? 0} status.
            </p>
            <TombolSuaraNarasi statuses={kontenAktif?.statuses ?? []} />
            <TombolRenderVideo
              statuses={kontenAktif?.statuses ?? []}
              produkNama={draft.produk?.nama || draft.produk?.nama_internal || "Produk Pilihan"}
            />
            <PanduanFotoCandid
              produk={{
                nama_internal: draft.produk?.nama_internal,
                nama: draft.produk?.nama ?? null,
                varian: draft.produk?.varian ?? null,
                fitur: draft.analisis?.fitur ?? null,
                target_audiens: draft.analisis?.target_audiens ?? null,
              }}
            />
          </div>
        </div>
      )}

      <ActionBar
        status={draft.status}
        semuaChecklist={semuaChecklist}
        semuaValid={semuaValid}
        tersimpanPukul={tersimpanPukul}
        busy={busy !== null}
        onSimpanDraft={simpanDraft}
        onTandaiSiap={tandaiSiap}
        onSalin={() => salinUtas()}
      />

      {/* Langkah 3 selesai saat draft sudah tersimpan di bank konten. */}
      {draft.status !== "draft" || semuaValid ? <LanjutLangkah dari={3} /> : null}
    </div>
  );
}
