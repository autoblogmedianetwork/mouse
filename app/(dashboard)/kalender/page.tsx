"use client";

/**
 * Kalender (Fase 6, UI-Spec 3.4): week view + month table of scheduled content.
 * Data is the real content bank ("terjadwal" status with jadwal_at), not mock
 * days. Scheduling itself happens in Antrian review; this page only displays
 * and links there. No auto-posting: Mode manual stays the main path (PRD).
 */
import Link from "next/link";
import { useMemo } from "react";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { hariMinggu, jadwalBulanIni, kelompokkanPerHari, kontenTerjadwal } from "@/lib/konten/kalender";
import { useLocalState } from "@/lib/konten/use-local-state";
import { kontenSkema, type Konten } from "@/lib/konten/skema";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Partial<Record<Konten["status"], string>> = {
  terjadwal: "Terjadwal",
};

function formatJadwal(jadwalAt: string): string {
  const d = new Date(jadwalAt);
  return d.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
}

export default function KalenderPage() {
  const [raw, dimuat] = useLocalState<Konten[]>("autothreads-konten", []);
  const konten = useMemo(() => {
    if (!dimuat || !Array.isArray(raw)) return [];
    return raw.flatMap((k) => {
      const hasil = kontenSkema.safeParse(k);
      return hasil.success ? [hasil.data] : [];
    });
  }, [raw, dimuat]);

  const terjadwal = useMemo(() => kontenTerjadwal(konten), [konten]);
  const hari = useMemo(() => hariMinggu(), []);
  const perHari = useMemo(() => kelompokkanPerHari(konten, hari), [konten, hari]);
  const bulan = useMemo(() => jadwalBulanIni(konten), [konten]);

  // Render must be pure: derive the "now" boundary once inside the same
  // hook ordering as the rest of the component, then pass it down.
  const sekarang = useMemo(() => Date.now(), []);

  if (!dimuat) {
    return (
      <div className="rounded-xl border border-surface-border bg-surface p-6 text-sm text-muted-foreground">
        Memuat kalender…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kalender"
        description="Jadwal konten siap posting. Jadwalkan dari Antrian review (tab Disetujui, tombol Jadwalkan) dan muncul di sini. Mode manual tetap jalur utama sampai Fase 7."
      >
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/antrian"
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-surface-border bg-background px-3 text-sm font-medium transition-colors hover:bg-muted"
          >
            Jadwalkan dari Antrian
          </Link>
          <span className="text-muted-foreground rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium">
            {terjadwal.length} terjadwal
          </span>
        </div>
      </PageHeader>

      {terjadwal.length === 0 ? (
        <EmptyState
          title="Belum ada jadwal"
          description="Tandai konten sebagai siap posting, lalu buka Antrian review dan klik Jadwalkan untuk memilih tanggal dan jam."
          actionLabel="Buka Antrian review"
          actionHref="/antrian"
        />
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {hari.map((h) => {
              const isi = perHari.get(h.kunci) ?? [];
              const terlambat = isi.some((k) => new Date(k.jadwal_at ?? "").getTime() < sekarang);
              return (
                <div
                  key={h.kunci}
                  className={cn(
                    "rounded-xl border bg-background p-4 transition-colors",
                    terlambat && isi.length > 0
                      ? "border-status-failed"
                      : isi.length > 0
                        ? "border-status-scheduled bg-muted/20"
                        : "border-border",
                    h.hariIni && "ring-1 ring-primary/40",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                      {h.label}
                      {h.hariIni ? " · hari ini" : ""}
                    </p>
                    <span
                      className={cn(
                        "text-muted-foreground text-[11px] font-medium",
                        isi.length > 0 && "text-foreground",
                      )}
                    >
                      {isi.length > 0 ? `${isi.length} konten` : "—"}
                    </span>
                  </div>

                  {isi.length === 0 ? (
                    <p className="mt-2 text-xs text-muted-foreground">Tidak ada jadwal.</p>
                  ) : (
                    <ul className="mt-2 space-y-2">
                      {isi.map((k) => (
                        <li key={k.id} className="rounded-lg border border-surface-border bg-surface p-2.5">
                          <p className="truncate text-sm font-medium">{k.judul}</p>
                          <p className="tabular-nums text-xs text-muted-foreground">
                            {formatJadwal(k.jadwal_at ?? "")}
                            {k.produk_nama ? ` · ${k.produk_nama}` : ""}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </section>

          <section className="rounded-xl border border-surface-border bg-surface p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold">Jadwal bulan ini</h2>
              <span className="text-muted-foreground text-xs">{bulan.length} konten</span>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[48rem] text-sm">
                <caption className="sr-only">Jadwal konten bulan ini</caption>
                <thead>
                  <tr className="border-surface-border text-muted-foreground border-b text-left text-xs uppercase tracking-wide">
                    <th className="py-2 pr-3 font-medium">Konten</th>
                    <th className="py-2 pr-3 font-medium">Jadwal</th>
                    <th className="py-2 pr-3 font-medium">Ide</th>
                    <th className="py-2 pr-3 font-medium">Status</th>
                    <th className="py-2 pr-3 font-medium">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {bulan.map((k) => {
                    const lewat = new Date(k.jadwal_at ?? "").getTime() < sekarang;
                    return (
                      <tr key={k.id} className="border-surface-border/60 border-b transition-colors">
                        <td className="py-2 pr-3 font-medium">{k.judul}</td>
                        <td className="py-2 pr-3 tabular-nums">{formatJadwal(k.jadwal_at ?? "")}</td>
                        <td className="text-muted-foreground py-2 pr-3">{k.ide_judul || "—"}</td>
                        <td className="py-2 pr-3">
                          <span
                            className={cn(
                              "inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide",
                              lewat
                                ? "border-status-failed bg-muted"
                                : "border-status-scheduled bg-muted",
                            )}
                          >
                            {STATUS_LABEL[k.status] ?? k.status}
                            {lewat ? " · lewat" : ""}
                          </span>
                        </td>
                        <td className="py-2 pr-3 text-right">
                          <Link
                            href="/antrian"
                            className="text-primary text-xs underline-offset-2 hover:underline"
                          >
                            Batalkan di Antrian
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href="/posting/baru"
                className="bg-primary text-primary-foreground hover:bg-primary-hover inline-flex h-9 items-center rounded-lg px-4 text-sm font-medium transition-colors"
              >
                Buat konten baru
              </Link>
              <Link
                href="/antrian"
                className="hover:bg-muted inline-flex h-9 items-center rounded-lg border border-surface-border px-4 text-sm font-medium transition-colors"
              >
                Lihat Antrian review
              </Link>
            </div>
          </section>
        </>
      )}

      <section className="rounded-xl border border-surface-border bg-surface p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold">Status fitur</h2>
          <span className="text-muted-foreground text-xs">Fase 6</span>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {[
            { label: "Tampilan kalender mingguan", desc: "Kartu Senin-Minggu dengan konten terjadwal." },
            { label: "Jadwal dari Antrian", desc: "Tombol Jadwalkan aktif hanya untuk konten siap posting." },
            { label: "Analitik singkat", desc: "Klik, komisi, dan konversi per konten ada di halaman Analitik." },
            { label: "Status terkirim / retry", desc: "Butuh Threads API (Fase 7). Belum dilengkapi." },
          ].map((item) => (
            <div key={item.label} className="border-surface-border bg-background rounded-xl border p-4">
              <p className="text-sm font-semibold">{item.label}</p>
              <p className="text-muted-foreground mt-1 text-xs">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
