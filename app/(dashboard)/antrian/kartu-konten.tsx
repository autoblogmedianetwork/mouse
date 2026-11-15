"use client";

/**
 * Satu kartu konten di antrian (dipecah dari antrian-review.tsx, R6d —
 * komponen presentasional; logika ada di use-antrian.ts).
 */
import { Card } from "@/components/card";
import { StatusBadge } from "@/components/status-badge";
import { LampuShadowban } from "@/features/antrian/lampu-shadowban";
import { hitungSkorShadowban } from "@/lib/konten/skor-shadowban";
import { subIdDefault } from "@/lib/performa/atribusi";
import { cn } from "@/lib/utils";
import type { Konten } from "@/lib/konten/skema";
import { btnGhost, type AksiKartu } from "./antrian-bersama";

interface Props {
  k: Konten;
  dipilih: boolean;
  onToggle: (id: string, centang: boolean) => void;
  aksi: AksiKartu[];
  skor: ReturnType<typeof hitungSkorShadowban> | undefined;
  onSalinKemasan: (k: Konten) => void;
  onSalinSubId: (id: string) => void;
}

export function KartuKonten({
  k,
  dipilih,
  onToggle,
  aksi,
  skor,
  onSalinKemasan,
  onSalinSubId,
}: Props) {
  return (
    <Card padat className="flex flex-col gap-3 p-4 sm:flex-row">
      <input
        type="checkbox"
        checked={dipilih}
        onChange={(e) => onToggle(k.id, e.target.checked)}
        aria-label={`Pilih ${k.judul}`}
        className="mt-1 h-4 w-4 shrink-0 accent-[var(--primary)]"
      />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-badan font-semibold">{k.judul}</h3>
          <StatusBadge status={k.status} />
          {k.otomatis ? (
            <span className="border border-surface-border px-2 py-0.5 font-mono text-mikro font-semibold uppercase tracking-badge text-status-scheduled">
              Otomatis
            </span>
          ) : null}
        </div>

        <p className="mt-1 text-meta text-muted-foreground">
          {k.produk_nama || "Tanpa produk"} ·{" "}
          {new Date(k.updated_at).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
          {" · "}
          {k.statuses.length} status
          {k.skor !== null ? ` · skor ide ${k.skor}` : ""}
          {k.letak_link !== "tanpa_link" ? " · link aktif" : ""}
        </p>

        <p className="mt-2 line-clamp-2 text-meta text-muted-foreground">
          {k.statuses[0]}
        </p>

        <div className="mt-2 max-w-xl">
          <LampuShadowban hasil={skor ?? hitungSkorShadowban([])} padat />
        </div>

        <p className="mt-2 flex flex-wrap items-center gap-2 text-meta text-muted-foreground">
          <span>Kode pelacak</span>
          <span className="font-mono text-foreground">{subIdDefault(k.id)}</span>
          <button
            type="button"
            onClick={() => onSalinSubId(k.id)}
            className="underline-offset-2 hover:text-foreground hover:underline"
            aria-label={`Salin kode pelacak ${k.judul}`}
          >
            Salin
          </button>
        </p>
      </div>

      <div className="flex flex-wrap gap-2 sm:flex-col sm:items-end">
        {aksi.map((a) => (
          <button
            key={a.label}
            type="button"
            onClick={() => a.jalankan(k)}
            className={cn(btnGhost, a.destructive && "text-status-failed")}
          >
            {a.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onSalinKemasan(k)}
          className={btnGhost}
          title="Salin utas Threads + caption TikTok + status WhatsApp"
        >
          Kemasan 3 platform
        </button>
      </div>
    </Card>
  );
}
