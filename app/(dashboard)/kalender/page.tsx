import { PageHeader } from "@/components/page-header";

export const metadata = { title: "Kalender" };

export default function KalenderPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Kalender" description="Menu ini tersedia di Level 2." />
      <div className="rounded-xl border border-surface-border bg-surface p-6 text-sm text-muted-foreground">
        Kalender bulan/minggu untuk konten siap posting masuk di Fase 6 (tanpa
        auto-posting).
      </div>
    </div>
  );
}
