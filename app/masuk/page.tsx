/**
 * Sign in with a magic link (K4).
 *
 * The page itself is a server component so the client form can read the
 * `?galat=` query with useSearchParams inside a Suspense boundary (Next.js
 * requires that for statically prerendered routes).
 */
import { Suspense } from "react";
import { PageHeader } from "@/components/page-header";
import { FormMasuk } from "./form-masuk";

export const metadata = { title: "Masuk" };

export default function MasukPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Masuk"
        description="Login dipakai supaya Bank Konten, laporan performa, dan peta atribusi tersimpan di akun Anda, bukan hanya di peramban ini."
      />

      <Suspense
        fallback={
          <div className="max-w-xl rounded-xl border border-surface-border bg-surface p-6 text-sm text-muted-foreground">
            Memuat formulir…
          </div>
        }
      >
        <FormMasuk />
      </Suspense>

      <p className="text-xs text-muted-foreground">
        Sampai semua halaman bicara ke Supabase, data yang sudah ada di peramban ini belum ikut
        terpindah. Menyalin isi Pustaka lewat Ekspor JSON tetap aman sebagai cadangan.
      </p>
    </div>
  );
}
