import { PageHeader } from "@/components/page-header";
import { PustakaKonten } from "./pustaka-konten";

export const metadata = { title: "Pustaka konten" };

export default function KontenPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Pustaka konten"
        description="Semua konten yang pernah dibuat, lengkap dengan status, filter, dan ekspor cadangan."
      />
      <PustakaKonten />
    </div>
  );
}
