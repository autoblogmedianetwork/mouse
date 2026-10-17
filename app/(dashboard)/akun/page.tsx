import { PageHeader } from "@/components/page-header";
import Link from "next/link";
import { DaftarAkun } from "@/features/akun/daftar-akun";

export const metadata = { title: "Akun sosial" };

export default function AkunPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Akun sosial"
        description="Hubungkan Threads (dan platform lain nanti) supaya konten bisa terkirim dari Heaviliate."
      />

      <DaftarAkun />

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
            {
              label: "Buat posting",
              href: "/posting/baru",
              desc: "Isi penawaran/produk, pilih ide, generate utas, tandai siap posting.",
            },
            {
              label: "Antrian review",
              href: "/antrian",
              desc: "Tinjau draft, checklist, lalu siap posting.",
            },
            {
              label: "Analitik",
              href: "/analitik",
              desc: "Klik, komisi, dan konversi per konten (Fase 6).",
            },
            {
              label: "Impor performa",
              href: "/impor",
              desc: "Rekap laporan Shopee, TikTok Shop, Tokopedia.",
            },
          ].map((item) => (
            <Link key={item.href} href={item.href} className="block">
              <div className="rounded-xl border border-surface-border bg-background p-4 transition-colors hover:border-primary/40">
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
