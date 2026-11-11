/**
 * Sign in with a magic link (K4).
 *
 * The page itself is a server component so the client form can read the
 * `?galat=` query with useSearchParams inside a Suspense boundary (Next.js
 * requires that for statically prerendered routes).
 *
 * The form card owns the page heading (`h1`) instead of a PageHeader: the
 * previous version printed "Masuk" twice above the fold plus once more on the
 * button, which read as a template placeholders rather than a gate.
 */
import { Suspense } from "react";
import { Card } from "@/components/card";
import { FormMasuk } from "./form-masuk";

export const metadata = { title: "Masuk" };

export default function MasukPage() {
  return (
    <div className="space-y-6">
      <Suspense
        fallback={
          <Card className="max-w-xl text-badan text-muted-foreground">Memuat formulir…</Card>
        }
      >
        <FormMasuk />
      </Suspense>

      <p className="max-w-xl text-meta text-muted-foreground">
        Konten, laporan performa, dan peta atribusi tersimpan di akun Anda. Konten yang sudah ada
        di peramban belum ikut pindah; Ekspor JSON tetap aman sebagai cadangan.
      </p>
    </div>
  );
}
