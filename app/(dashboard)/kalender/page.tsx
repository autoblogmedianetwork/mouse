import { PageHeader } from "@/components/page-header";
import Link from "next/link";
import { cn } from "@/lib/utils";

export const metadata = { title: "Kalender" };

type DayStatus = "done" | "pending" | "failed";

const STATUS_CONFIG: Record<DayStatus, { label: string; className: string }> = {
  done: {
    label: "Selesai",
    className: "bg-muted text-status-ready border-status-ready",
  },
  pending: {
    label: "Jadwal",
    className: "bg-muted text-status-scheduled border-status-scheduled",
  },
  failed: {
    label: "Gagal",
    className: "bg-muted text-status-failed border-status-failed",
  },
};

/** Contoh harian di Kalender (Fase 6). Data akan diambil dari antrian / jadwal*/
const DAYS = [
  { date: "Sen", label: "Sen, 13 Okt", status: "done" as DayStatus },
  { date: "Sel", label: "Sel, 14 Okt", status: "pending" as DayStatus },
  { date: "Rab", label: "Rab, 15 Okt", status: "pending" as DayStatus },
  { date: "Kam", label: "Kam, 16 Okt", status: "pending" as DayStatus },
  { date: "Jum", label: "Jum, 17 Okt", status: "failed" as DayStatus },
  { date: "Sab", label: "Sab, 18 Okt", status: "pending" as DayStatus },
  { date: "Min", label: "Min, 19 Okt", status: "pending" as DayStatus },
];

export default function KalenderPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Kalender"
        description="Jadwalkan konten siap posting (Fase 6). Hari ini: layout preview, data akan diisi saat jadwal tersedia."
      >
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-input bg-background px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z" />
            </svg>
            Lihat minggu
          </button>
          <button
            type="button"
            disabled
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-input bg-background px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M12 4v16m8-8H4" />
            </svg>
            Tambah jadwal
          </button>
          <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
            Tanpa akun sosial
          </span>
        </div>
      </PageHeader>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {DAYS.map((day) => (
          <div
            key={day.date}
            className={cn(
              "rounded-xl border p-4 transition-colors",
              day.status === "done"
                ? "border-status-ready bg-background"
                : day.status === "pending"
                  ? "border-border bg-background"
                  : "border-status-failed bg-background",
            )}
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {day.date}
              </p>
              <span
                className={cn(
                  "inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide",
                  STATUS_CONFIG[day.status].className,
                )}
              >
                {STATUS_CONFIG[day.status].label}
              </span>
            </div>
            <p className="mt-2 text-base font-semibold">{day.label}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {day.status === "done"
                ? "Konten terkirim · lihat Riwayat"
                : day.status === "pending"
                  ? "Dijadwalkan · akan pada jam aktif"
                  : "Gagal terkirim · coba lagi"}
            </p>
          </div>
        ))}
      </section>

      <section className="rounded-xl border border-surface-border bg-surface p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold">Jadwal konten</h2>
          <span className="text-xs text-muted-foreground">
            {DAYS.filter((d) => d.status === "pending").length} belum jadwal
          </span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Jadwal dipakai saat konten berstatus siap posting. Mode manual tetap jadi jalur utama sampai
          Fase 6.
        </p>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[48rem] text-sm">
            <caption className="sr-only">Jadwal konten bulan ini</caption>
            <thead>
              <tr className="border-b border-surface-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="py-2 pr-3 font-medium">Konten</th>
                <th className="py-2 pr-3 font-medium">Tanggal</th>
                <th className="py-2 pr-3 font-medium">Ide</th>
                <th className="py-2 pr-3 font-medium">Status</th>
                <th className="py-2 pr-3 font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {DAYS.map((day) => (
                <tr
                  key={day.date}
                  className={cn(
                    "border-b border-surface-border/60 transition-colors",
                    day.status === "done" && "bg-muted/30",
                  )}
                >
                  <td className="py-2 pr-3 font-medium">{day.date}</td>
                  <td className="py-2 pr-3 tabular-nums">{day.label}</td>
                  <td className="py-2 pr-3 text-muted-foreground">—</td>
                  <td className="py-2 pr-3">
                    <span
                      className={cn(
                        "inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide",
                        STATUS_CONFIG[day.status].className,
                      )}
                    >
                      {STATUS_CONFIG[day.status].label}
                    </span>
                  </td>
                  <td className="py-2 pr-3 text-right">
                    <button
                      type="button"
                      disabled
                      className="rounded-md border border-input px-2 py-1 text-xs text-muted-foreground"
                    >
                      Jadwalkan
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/posting/baru"
            className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
          >
            Buat konten baru
          </Link>
          <Link
            href="/antrian"
            className="inline-flex h-9 items-center rounded-lg border border-surface-border px-4 text-sm font-medium transition-colors hover:bg-muted"
          >
            Lihat Antrian review
          </Link>
        </div>
      </section>

      <section className="rounded-xl border border-surface-border bg-surface p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold">Status fitur</h2>
          <span className="text-xs text-muted-foreground">Fase 6, belum data jadwal</span>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {[
            { label: "Tampilan kalender", desc: "Bulan, minggu, dan detail harian. Sampai ini sudah tampil." },
            { label: "Jadwal konten siap posting", desc: "Filter dari Antrian review. Data diisi ketika jadwal tersedia." },
            { label: "Analitik singkat", desc: "Klik, komisi, dan konversi per konten. Opsional di kalender." },
            { label: "Status terkirim / retry", desc: "Butuh Thread API callback. Dipisah ke halaman yang lebih tepat." },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border border-surface-border bg-background p-4">
              <p className="text-sm font-semibold">{item.label}</p>
              <p className="mt-1 text-xs text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
