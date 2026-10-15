import { PageHeader } from "@/components/page-header";
import Link from "next/link";
import { cn } from "@/lib/utils";

export const metadata = { title: "Akun sosial" };

const MOCK_ACCOUNTS = [
  {
    id: "acct-1",
    platform: "Threads",
    name: "@siti_affiliate",
    connected: true,
    lastConnected: "12 Okt 2026, 14.22",
    status: "siap",
  },
  {
    id: "acct-2",
    platform: "Threads",
    name: "@bayu_affiliate",
    connected: false,
    lastConnected: null,
    status: "pending",
  },
];

type AccountStatus = "siap" | "pending" | "gagal";

const STATUS_CONFIG: Record<AccountStatus, { label: string; className: string }> = {
  siap: {
    label: "Siap",
    className: "bg-muted text-status-ready border-status-ready",
  },
  pending: {
    label: "Menunggu",
    className: "bg-muted text-status-scheduled border-status-scheduled",
  },
  gagal: {
    label: "Gagal",
    className: "bg-muted text-status-failed border-status-failed",
  },
};

export default function AkunPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Akun sosial"
        description="Hubungkan Threads (dan platform lain nanti) supaya konten bisa terkirim dari Heaviliate."
      >
        <button
          type="button"
          disabled
          className="inline-flex h-9 items-center gap-2 rounded-lg border border-input bg-background px-4 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path d="M12 4v16m8-8H4" />
          </svg>
          Tambah akun sosial
        </button>
      </PageHeader>

      <section className="rounded-xl border border-surface-border bg-surface p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold">Status akun</h2>
          <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
            MVP: 1 akun Threads
          </span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Satu akun pertama yang lolos review Meta. Pengaturan App ID, App Secret, dan OAuth ada di
          Pengaturan.
        </p>

        <div className="mt-4 divide-y divide-surface-border">
          {MOCK_ACCOUNTS.map((account) => (
            <div
              key={account.id}
              className="flex flex-wrap items-center justify-between gap-3 py-3"
            >
              <div className="flex flex-wrap items-center gap-3 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path d="M12 2a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3V5a3 3 0 0 0-3-3Zm0 0c0 2.5-1.8 4.3-3 5.3A3.5 3.5 0 0 0 7 16a3.5 3.5 0 0 0 2.5 3.3c1.2.8 3 2.8 3 5.3a3.5 3.5 0 0 0 3.3-1.7 3.5 3.5 0 0 0-1.7-3.3 3.5 3.5 0 0 0-3.3 1.7c0 2.2-1.8 4-3 5.3a3.5 3.5 0 0 0-2.5-3.3 3.5 3.5 0 0 0 1.1-2.6Z" />
                    <path d="M6 12h12" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{account.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {account.platform} · {account.connected ? "Dikoneksi" : "Belum dikoneksi"}
                  </p>
                </div>
              </div>
              <span
                className={cn(
                  "inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide",
                  (STATUS_CONFIG as Record<string, { className: string }>)[account.status]?.className,
                )}
              >
                {account.status === 'gagal' ? 'Gagal' : (STATUS_CONFIG as Record<string, { label: string }>)[account.status]?.label ?? 'Menunggu'}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-lg border border-surface-border bg-background p-4">
          <div className="flex items-start gap-3">
            <svg className="h-5 w-5 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M13.828 10.172a4 4 0 0 0-5.656 0l-4 4a4 4 0 1 0 5.656 5.656l1.102-1.101m-.758-4.899a4 4 0 0 0 5.656 0l4-4a4 4 0 0 0-5.656-5.656l-1.1 1.1" />
            </svg>
            <div className="min-w-0">
              <p className="text-sm font-medium">Satu akun dulu (MVP)</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Setelah Fase 7, tampilan ini akan punya form App ID, App Secret, OAuth, dan switch
                manual/auto. Mode manual selalu tersedia.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-surface-border bg-surface p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold">Ribuan konten, satu akun</h2>
          <Link href="/posting/baru" className="text-sm text-primary underline-offset-2 hover:underline">
            Buat posting
          </Link>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Dari akun yang terhubung, pilih ide konten, generate utas, lalu salin atau kirim via provider
          posting. Status per konten terlihat di Antrian review.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {[
            { label: "Buat posting", href: "/posting/baru", desc: "Isi produk, pilih ide, generate utas, tandai siap posting." },
            { label: "Antrian review", href: "/antrian", desc: "Tinjau draft, checklist, lalu siap posting." },
            { label: "Analitik", href: "/analitik", desc: "Klik, komisi, dan konversi per konten (Fase 6)." },
            { label: "Impor performa", href: "/impor", desc: "Anggap laporan Shopee, TikTok Shop, Tokopedia." },
          ].map((item) => (
            <Link key={item.href} href={item.href} className="block">
              <div className="rounded-xl border border-surface-border bg-background p-4">
                <p className="text-sm font-semibold">{item.label}</p>
                <p className="mt-1 text-xs text-muted-foreground">{item.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
