"use client";

import { useState } from "react";
import { Card } from "@/components/card";
import { MAX_STATUS_LENGTH, charLength } from "@/lib/statuses/validator-500";
import { splitIntoStatuses } from "@/lib/statuses/pemisah";
import { salinKeClipboard, teksStatus } from "@/lib/konten/salin";
import { cn } from "@/lib/utils";
import { periksaKataTerlarang } from "@/lib/konten/kata-terlarang";
import { muatSnippet, type SnippetCTA } from "@/lib/konten/snippet-cta";

/**
 * StatusEditor (UI-Spec 4): ordered list of statuses with per-status
 * character counter, inline editing, add/remove, per-status copy (N-4), and
 * automatic splitting when one status exceeds 500 characters.
 */
export function StatusEditor({
  statuses,
  onChange,
  batas = MAX_STATUS_LENGTH,
}: {
  statuses: string[];
  onChange: (next: string[]) => void;
  /** Batas karakter per status; 500 Threads, 280 X (fitur 9). */
  batas?: number;
}) {
  const [hasilSalin, setHasilSalin] = useState<{ index: number; ok: boolean } | null>(null);
  const [daftarSnippet] = useState<SnippetCTA[]>(() => muatSnippet());

  const deteksiGlobal = periksaKataTerlarang(statuses);

  /** Salin satu status; kalau clipboard ditolak, teksnya tetap ada di editor. */
  const salinStatus = async (index: number) => {
    const ok = await salinKeClipboard(teksStatus(statuses[index] ?? ""));
    setHasilSalin({ index, ok });
    setTimeout(() => setHasilSalin(null), 2500);
  };

  const update = (index: number, text: string) => {
    const next = [...statuses];
    next[index] = text;
    onChange(next);
  };

  const remove = (index: number) => onChange(statuses.filter((_, i) => i !== index));

  const add = () => onChange([...statuses, ""]);

  const sisipSnippet = (teksSnippet: string) => {
    if (statuses.length === 0) {
      onChange([teksSnippet]);
      return;
    }
    const indexTerakhir = statuses.length - 1;
    const teksLama = statuses[indexTerakhir] ?? "";
    const teksBaru = teksLama ? `${teksLama}\n\n${teksSnippet}` : teksSnippet;
    const next = [...statuses];
    next[indexTerakhir] = teksBaru;
    onChange(next);
  };

  const split = (index: number) => {
    const parts = splitIntoStatuses(statuses[index], batas);
    if (parts.length <= 1) return;
    const next = [...statuses];
    next.splice(index, 1, ...parts);
    onChange(next);
  };

  return (
    <Card>
      <div className="flex items-center justify-between">
        <h2 className="text-isi font-semibold">Status Threads</h2>
        <button
          type="button"
          onClick={add}
          className="border border-surface-border px-3 py-1.5 text-badan hover:bg-muted"
        >
          Tambah status
        </button>
      </div>

      <p className="mt-1 text-meta text-muted-foreground">
        Maksimal {batas} karakter per status (aturan #7). Teks yang
        kepanjangan bisa dipecah otomatis di batas paragraf/kalimat.
      </p>

      {/* Snippet CTA Cepat (ADR 0020) */}
      {daftarSnippet.length > 0 ? (
        <div className="mt-3 border border-surface-border/80 bg-muted/30 p-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-meta font-medium text-muted-foreground">
              + Sisip CTA:
            </span>
            {daftarSnippet.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => sisipSnippet(s.teks)}
                title={s.teks}
                className="border border-surface-border bg-background px-2 py-0.5 text-meta hover:bg-muted"
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {/* Peringatan Kamus Kata Terlarang (ADR 0020) */}
      {deteksiGlobal.ditemukan ? (
        <div className="mt-3 border border-warning/50 bg-warning/10 p-3 text-meta">
          <p className="font-semibold text-warning-foreground">
            ⚠️ Terdeteksi kata berisiko / klaim berlebihan ({deteksiGlobal.temuan.length}):
          </p>
          <ul className="mt-1.5 list-disc space-y-1 pl-4 text-badan">
            {deteksiGlobal.temuan.map((t, idx) => (
              <li key={idx}>
                <span className="font-mono font-semibold text-status-failed">&ldquo;{t.rule.kata}&rdquo;</span>
                {" \u2014 "}
                <span>{t.rule.alasan}</span>
                {t.rule.saran ? (
                  <span className="text-muted-foreground"> (Saran: {t.rule.saran})</span>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <ol className="mt-4 space-y-4">
        {statuses.map((status, index) => {
          const length = charLength(status);
          const over = length > batas;
          return (
            <li key={index} className="border border-surface-border p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-meta font-medium text-muted-foreground">
                  Status {index + 1}
                </span>
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "text-meta tabular-nums",
                      over ? "font-semibold text-status-failed" : "text-muted-foreground",
                    )}
                    aria-live="polite"
                  >
                    {length} / {batas}
                  </span>
                  <button
                    type="button"
                    onClick={() => void salinStatus(index)}
                    disabled={teksStatus(status).length === 0}
                    aria-label={`Salin status ${index + 1}`}
                    className="border border-surface-border px-2 py-0.5 text-meta hover:bg-muted disabled:opacity-40"
                  >
                    Salin
                  </button>
                  {over ? (
                    <button
                      type="button"
                      onClick={() => split(index)}
                      className="border border-surface-border px-2 py-0.5 text-meta hover:bg-muted"
                    >
                      Pecah otomatis
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    aria-label={`Hapus status ${index + 1}`}
                    className="text-meta text-muted-foreground hover:text-status-failed"
                  >
                    Hapus
                  </button>
                </div>
              </div>
              {hasilSalin?.index === index ? (
                <p className="mb-2 text-meta text-muted-foreground" aria-live="polite">
                  {hasilSalin.ok
                    ? "Status disalin."
                    : "Gagal menyalin. Salin manual dari kotak teks."}
                </p>
              ) : null}
              <textarea
                value={status}
                onChange={(e) => update(index, e.target.value)}
                rows={Math.min(8, Math.max(2, Math.ceil(length / 60)))}
                aria-label={`Teks status ${index + 1}`}
                className={cn(
                  "w-full resize-y border border-surface-border bg-background px-3 py-2 text-badan leading-6 outline-none focus:border-primary",
                  over && "border-status-failed",
                )}
              />
            </li>
          );
        })}
      </ol>

      {statuses.length === 0 ? (
        <p className="mt-4 text-badan text-muted-foreground">
          Belum ada status. Generate dari ide atau tambah manual.
        </p>
      ) : null}
    </Card>
  );
}
