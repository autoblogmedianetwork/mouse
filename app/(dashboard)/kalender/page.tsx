import { PageHeader } from "@/components/page-header";

export const metadata = { title: "Kalender" };

export default function KalenderPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Kalender"
        description="Jadwalkan konten siap posting (Fase 6). Hari ini: placeholder navigasi aktif."
      >
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled
            className="pointer-events-none rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium text-muted-foreground"
          >
            <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path d="M12 4v16m8-8H4" />
            </svg>
            Tambah jadwal
          </button>
          <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium">Tanpa akun sosial</span>
        </div>
      </PageHeader>

      <GridJam />

      <div className="rounded-xl border border-surface-border bg-surface p-5">
        <h3 className="text-base font-semibold">Status fitur</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Kalender masih placeholder. Sesuai rencana pengembangan, fitur ini masuk
          Fase 6 dan lebih dulu dari auto-posting.
        </p>
        <ul className="mt-4 space-y-3">
          <PlaceholderItem iconSvg="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z" label="Tampilan bulan/minggu" note="Tanpa data jadwal, tampilan kosong." />
          <PlaceholderItem iconSvg="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" label="Jadwal konten siap posting" note="Butuh akun sosial + mode posting." />
          <PlaceholderItem iconSvg="M20 7l-5-5-5 5m5-5v10l-5 5-5-5" label="Analitik singkat di kalender" note="Dari Fase 6 (opsional) + analitik." />
          <PlaceholderItem iconSvg="M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" label="Status terkirim" note="Butuh Thread API callback." />
          <PlaceholderItem iconSvg="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" label="Gagal terkirim" note="Dihapus dari kalender setelah dipulihkan/dialog." />
        </ul>
      </div>
    </div>
  );
}

function GridJam() {
  return (
    <div className="rounded-xl border border-surface-border bg-surface p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">Jadwal (placeholder)</h3>
        <span className="rounded-full border px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide">Belum ada jadwal</span>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Grid bulan dan minggu akan tampil setelah jadwal tersedia.
      </p>
      <div className="mt-4 flex items-center justify-center min-h-[220px] text-muted-foreground">
        <svg className="h-8 w-8 text-muted-foreground/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547m-6.364 2.872c-.517-.072-1.03-.143-1.543-.214m-1.024.214a5.006 5.006 0 0 1 7.072 0m0 0a5.006 5.006 0 0 1 7.072 0m0 0a5.006 5.006 0 0 1-7.072 0l-.548-.547M3.343 17.657l-.707.707m17.657-7.657l-.707-.707" />
        </svg>
        <span className="ml-3 text-sm">Belum ada jadwal — klik Tambah jadwal nanti.</span>
      </div>
    </div>
  );
}

function PlaceholderItem({
  iconSvg,
  label,
  note,
}: {
  iconSvg: string;
  label: string;
  note: string;
}) {
  return (
    <li className="flex items-center gap-3 rounded-md border border-dashed border-surface-border bg-background px-3 py-3">
      <svg className="h-4 w-4 shrink-0 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path d={iconSvg} />
      </svg>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{note}</p>
      </div>
    </li>
  );
}

