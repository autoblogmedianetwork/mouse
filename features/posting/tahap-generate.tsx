"use client";

/**
 * Tahap 3: Generate (refactor R3). JSX dipindah utuh dari
 * alur-buat-posting.tsx.
 */
import { Card } from "@/components/card";
import { PengaturanGenerate } from "./pengaturan-generate";
import type { DraftState, Langkah } from "./draft-posting";
import { primaryBtn, ghostBtn } from "./draft-posting";

interface Props {
  draft: DraftState;
  busy: string | null;
  catatanAturan: string | null;
  update: (patch: Partial<DraftState>) => void;
  setLangkah: (l: Langkah) => void;
  jalankanGenerate: () => void;
}

export function TahapGenerate({
  draft,
  busy,
  catatanAturan,
  update,
  setLangkah,
  jalankanGenerate,
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

  return (
    <div className="space-y-6">
      {bannerAturan}
      <PengaturanGenerate
        value={draft.pengaturan}
        onChange={(pengaturan) => update({ pengaturan })}
        disabled={busy !== null}
      />

      <Card>
        <p className="text-badan text-muted-foreground">
          Akan membuat <strong className="text-foreground">{draft.ideDipilih.length}</strong>{" "}
          konten (satu per ide terpilih). Semua hasil berstatus draft.
        </p>
        {draft.pengaturan.mode_output === "naskah_video" ? (
          <p className="mt-2 border border-surface-border p-3 text-meta text-muted-foreground">
            Mode naskah video: tiap konten berisi tiga bagian — hook visual
            (3 detik), fungsi produk, dan CTA — dengan durasi total 30 sampai
            60 detik.
          </p>
        ) : draft.pengaturan.mode_output === "carousel" ? (
          <p className="mt-2 border border-surface-border p-3 text-meta text-muted-foreground">
            Mode Carousel: tiap konten disusun menjadi slide visual (cover, isi, cta) dan caption.
            Hasil slide bisa langsung diunduh sebagai gambar PNG atau disalin teksnya ke Canva.
          </p>
        ) : null}
        <div className="mt-4 flex gap-3">
          <button
            type="button"
            onClick={() => jalankanGenerate()}
            disabled={busy !== null}
            className={primaryBtn}
          >
            {busy === "generate"
              ? "Generate berjalan…"
              : `Generate ${draft.ideDipilih.length} konten`}
          </button>
          <button type="button" onClick={() => setLangkah("ide")} className={ghostBtn}>
            Kembali
          </button>
        </div>
      </Card>
    </div>
  );
}
