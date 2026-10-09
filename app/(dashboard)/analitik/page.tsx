import { PageHeader } from "@/components/page-header";

export const metadata = { title: "Analitik" };

export default function AnalitikPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Analitik" description="Menu ini tersedia setelah M5." />
      <div className="rounded-xl border border-surface-border bg-surface p-6 text-sm text-muted-foreground">
        Analitik performa konten (per angle, per hook, per letak link) dibangun dari
        data klik dan komisi manual di Fase 6.
      </div>
    </div>
  );
}
