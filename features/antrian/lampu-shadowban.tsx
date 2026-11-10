"use client";

/**
 * Lampu merah skor shadowban (ide #32): menampilkan hasil
 * `hitungSkorShadowban` untuk satu konten — level, skor 0–100, dan daftar
 * temuan — sebelum tombol salin dipakai. Murni presentasi; tidak mengubah
 * data dan tidak memanggil API.
 */
import type { HasilSkorShadowban, LevelShadowban } from "@/lib/konten/skor-shadowban";
import { cn } from "@/lib/utils";

const LABEL_PER_LEVEL: Record<LevelShadowban, string> = {
  aman: "Aman",
  waspada: "Waspada",
  berbahaya: "Berbahaya",
  kritis: "Kritis",
};

const GAYA_PER_LEVEL: Record<LevelShadowban, string> = {
  aman: "border-surface-border bg-muted text-muted-foreground",
  waspada: "border-warning/40 bg-warning/10 text-warning-foreground",
  berbahaya: "border-warning/60 bg-warning/10 text-warning-foreground",
  kritis: "border-status-failed bg-status-failed/10 text-status-failed",
};

export function LampuShadowban({
  hasil,
  padat = false,
}: {
  hasil: HasilSkorShadowban;
  /** Mode padat untuk kartu kecil: hanya badge level + skor. */
  padat?: boolean;
}) {
  if (hasil.level === "aman" && padat) {
    // Kartu padat: konten aman tidak perlu mengganggu, cukup atribut data.
    return <span className="sr-only">Skor shadowban: aman ({hasil.skor}/100)</span>;
  }

  return (
    <div
      data-testid="lampu-shadowban"
      data-level={hasil.level}
      data-lampu-merah={hasil.lampuMerah ? "true" : "false"}
      role={hasil.lampuMerah ? "alert" : "status"}
      className={cn("border px-3 py-2 text-meta", GAYA_PER_LEVEL[hasil.level])}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={cn(
            "inline-block size-2 shrink-0 rounded-full",
            hasil.level === "aman" ? "bg-status-ready" : hasil.level === "waspada" ? "bg-warning" : "bg-status-failed",
          )}
          aria-hidden
        />
        <span className="font-semibold">
          {LABEL_PER_LEVEL[hasil.level]} · skor {hasil.skor}/100
        </span>
        {hasil.lampuMerah ? (
          <span className="font-mono text-mikro font-bold uppercase tracking-badge">
            Periksa sebelum salin
          </span>
        ) : null}
      </div>
      {!padat && hasil.temuan.length > 0 ? (
        <ul className="mt-1 list-disc space-y-0.5 pl-5 text-muted-foreground">
          {hasil.temuan.map((t, i) => (
            <li key={`${t.jenis}-${i}`}>
              <span className="text-foreground">{t.teks}</span> — {t.alasan}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
