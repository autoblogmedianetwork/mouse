"use client";

/**
 * Uji psikologi konten (adaptasi kerangka "marketing-psychology").
 *
 * Panel kecil di tahap preview: menunjukkan prinsip persuasi yang sudah
 * dipakai, yang belum, dan peringatan kalau ada trik yang menipu pembaca.
 * Murni dihitung di browser (lib/psikologi/skor-hook.ts) — tidak memanggil AI,
 * jadi tidak memakai kredit dan tetap jalan offline.
 */
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { LABEL_PRINSIP } from "@/lib/psikologi/prinsip";
import { nilaiPsikologi } from "@/lib/psikologi/skor-hook";

const WARNA_LABEL: Record<string, string> = {
  kuat: "text-status-ready",
  cukup: "text-foreground",
  lemah: "text-status-failed",
};

export function UjiPsikologi({ statuses }: { statuses: readonly string[] }) {
  const [buka, setBuka] = useState(false);
  const teks = statuses.join("\n\n");
  const hasil = useMemo(() => nilaiPsikologi(teks), [teks]);

  if (teks.trim() === "") return null;

  return (
    <div className="border border-surface-border bg-surface">
      <button
        type="button"
        onClick={() => setBuka((b) => !b)}
        aria-expanded={buka}
        className="flex w-full items-center justify-between gap-3 px-3.5 py-3 text-left"
      >
        <span className="text-meta font-medium">
          Uji psikologi konten
          <span className="ml-2 font-normal text-muted-foreground">
            {hasil.terpakai.length} dari 6 prinsip terpakai
          </span>
        </span>
        <span className="flex items-center gap-2">
          <span className={cn("text-badan font-semibold tabular-nums", WARNA_LABEL[hasil.label])}>
            {hasil.skor}
          </span>
          {hasil.peringatan.length > 0 ? (
            <span className="border border-warning/50 px-1.5 py-0.5 text-meta font-medium text-warning">
              {hasil.peringatan.length} peringatan
            </span>
          ) : null}
          <span className="text-meta text-muted-foreground">{buka ? "Tutup" : "Buka"}</span>
        </span>
      </button>

      {buka ? (
        <div className="space-y-3 border-t border-surface-border px-3.5 py-3">
          <p className="text-meta text-muted-foreground">
            Skor {hasil.skor}/100 — {hasil.label}. Ini bukan penilaian selera, cuma penanda prinsip
            mana yang sudah dipakai di teksmu.
          </p>

          <div>
            <p className="text-meta font-medium">Sudah dipakai</p>
            {hasil.terpakai.length === 0 ? (
              <p className="mt-1 text-meta text-muted-foreground">
                Belum ada. Konten masih terlalu umum untuk menahan orang berhenti.
              </p>
            ) : (
              <ul className="mt-1 space-y-1 text-meta">
                {hasil.terpakai.map((id) => (
                  <li key={id}>
                    <span className="font-medium">{LABEL_PRINSIP[id]}</span>
                    {hasil.bukti[id] ? (
                      <span className="text-muted-foreground"> — “{hasil.bukti[id]}”</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {hasil.peringatan.length > 0 ? (
            <div className="border border-warning/40 bg-warning/10 p-2.5">
              <p className="text-meta font-semibold text-warning">Perlu diperbaiki</p>
              <ul className="mt-1 space-y-1.5 text-meta">
                {hasil.peringatan.map((p) => (
                  <li key={p.id}>{p.pesan}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <div>
            <p className="text-meta font-medium">Yang belum dipakai</p>
            <ul className="mt-1 space-y-1 text-meta text-muted-foreground">
              {hasil.saran.map((s) => (
                <li key={s}>• {s}</li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </div>
  );
}
