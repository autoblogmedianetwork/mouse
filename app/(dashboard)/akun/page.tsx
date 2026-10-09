import { PageHeader } from "@/components/page-header";

export const metadata = { title: "Akun sosial" };

export default function AkunPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Akun sosial" description="Menu ini tersedia setelah M6." />
      <div className="rounded-xl border border-surface-border bg-surface p-6 text-sm text-muted-foreground">
        Penyambungan akun Threads lewat OAuth masuk di Fase 7 (auto-posting, PRD F8).
        Sampai itu, posting dilakukan manual dengan Salin Utas Lengkap.
      </div>
    </div>
  );
}
