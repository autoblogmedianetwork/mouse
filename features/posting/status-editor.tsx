"use client";

import { useState } from "react";
import { MAX_STATUS_LENGTH, charLength } from "@/lib/statuses/validator-500";
import { splitIntoStatuses } from "@/lib/statuses/pemisah";
import { salinKeClipboard, teksStatus } from "@/lib/konten/salin";
import { cn } from "@/lib/utils";

/**
 * StatusEditor (UI-Spec 4): ordered list of statuses with per-status
 * character counter, inline editing, add/remove, per-status copy (N-4), and
 * automatic splitting when one status exceeds 500 characters.
 */
export function StatusEditor({
  statuses,
  onChange,
}: {
  statuses: string[];
  onChange: (next: string[]) => void;
}) {
  const [hasilSalin, setHasilSalin] = useState<{ index: number; ok: boolean } | null>(null);

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

  const split = (index: number) => {
    const parts = splitIntoStatuses(statuses[index]);
    if (parts.length <= 1) return;
    const next = [...statuses];
    next.splice(index, 1, ...parts);
    onChange(next);
  };

  return (
    <section className="rounded-xl border border-surface-border bg-surface p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Status Threads</h2>
        <button
          type="button"
          onClick={add}
          className="rounded-lg border border-surface-border px-3 py-1.5 text-sm hover:bg-muted"
        >
          Tambah status
        </button>
      </div>

      <p className="mt-1 text-xs text-muted-foreground">
        Maksimal {MAX_STATUS_LENGTH} karakter per status (aturan #7). Teks yang
        kepanjangan bisa dipecah otomatis di batas paragraf/kalimat.
      </p>

      <ol className="mt-4 space-y-4">
        {statuses.map((status, index) => {
          const length = charLength(status);
          const over = length > MAX_STATUS_LENGTH;
          return (
            <li key={index} className="rounded-lg border border-surface-border p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  Status {index + 1}
                </span>
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "text-xs tabular-nums",
                      over ? "font-semibold text-status-failed" : "text-muted-foreground",
                    )}
                    aria-live="polite"
                  >
                    {length} / {MAX_STATUS_LENGTH}
                  </span>
                  <button
                    type="button"
                    onClick={() => void salinStatus(index)}
                    disabled={teksStatus(status).length === 0}
                    aria-label={`Salin status ${index + 1}`}
                    className="rounded border border-surface-border px-2 py-0.5 text-xs hover:bg-muted disabled:opacity-40"
                  >
                    Salin
                  </button>
                  {over ? (
                    <button
                      type="button"
                      onClick={() => split(index)}
                      className="rounded border border-surface-border px-2 py-0.5 text-xs hover:bg-muted"
                    >
                      Pecah otomatis
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    aria-label={`Hapus status ${index + 1}`}
                    className="text-xs text-muted-foreground hover:text-status-failed"
                  >
                    Hapus
                  </button>
                </div>
              </div>
              {hasilSalin?.index === index ? (
                <p className="mb-2 text-xs text-muted-foreground" aria-live="polite">
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
                  "w-full resize-y rounded-lg border border-surface-border bg-background px-3 py-2 text-sm leading-6 outline-none focus:border-primary",
                  over && "border-status-failed",
                )}
              />
            </li>
          );
        })}
      </ol>

      {statuses.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">
          Belum ada status. Generate dari ide atau tambah manual.
        </p>
      ) : null}
    </section>
  );
}
