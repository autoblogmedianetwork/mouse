import { PageHeader } from "@/components/page-header";

export const metadata = { title: "Akun sosial" };

export default function AkunPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Akun sosial"
        description="Hubungkan Threads (dan platform lain nanti) supaya konten bisa terkirim dari AutoThreads."
      >
        <button
          type="button"
          disabled
          className="pointer-events-none rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium text-muted-foreground"
        >
          + Tambah akun
        </button>
      </PageHeader>

      <div className="rounded-xl border border-surface-border bg-surface p-5">
        <h3 className="text-base font-semibold">Status integrasi</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Platform yang didukung, status koneksi, dan apa yang akan bisa setelah
          dikoneksikan.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-surface-border bg-background p-4">
            <div className="flex items-start gap-3">
              <svg className="h-5 w-5 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M13.828 10.172a4 4 0 0 0-5.656 0l-4 4a4 4 0 1 0 5.656 5.656l1.102-1.101m-.758-4.899a4 4 0 0 0 5.656 0l4-4a4 4 0 0 0-5.656-5.656l-1.1 1.1" />
              </svg>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold">Threads</h4>
                  <span className="rounded-full border px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide">Belum dikoneksi</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Satu akun dulu (MVP). Pengaturan: App ID, App Secret, OAuth.
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-surface-border bg-background p-4">
            <div className="flex items-start gap-3">
              <svg className="h-5 w-5 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold">Auto-posting</h4>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium">Nanti</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Mode manual atau otomatis setelah akun terhubung.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-surface-border bg-surface p-5">
        <h3 className="text-base font-semibold">Yang tersedia hari ini</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Halaman ini sudah bisa dibuka (navigasi aktif). Konten placeholder sampai
          Thread API di Fase 7.
        </p>
        <ul className="mt-4 space-y-3">
          <PlaceholderItem iconSvg="M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM12 14a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" label="Tambah akun Threads" note="Form koneksi muncul setelah Fase 7." />
          <PlaceholderItem iconSvg="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" label="Daftar akun yang terhubung" note="Tanpa akun, daftar kosong." />
          <PlaceholderItem iconSvg="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" label="Jadwal posting" note="Dipisah ke Kalender; tampil setelah Fase 6." />
          <PlaceholderItem iconSvg="M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" label="Status terkirim" note="Butuh Thread API callback." />
          <PlaceholderItem iconSvg="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" label="Gagal terkirim / retry" note="Butuh status dari platform." />
        </ul>
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
      <svg className="h-4 w-4 shrink-0 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d={iconSvg} />
      </svg>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{note}</p>
      </div>
    </li>
  );
}

