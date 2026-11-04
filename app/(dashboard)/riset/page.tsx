import { PageHeader } from "@/components/page-header";
import { PanelRiset } from "@/features/riset/panel-riset";

export const metadata = { title: "Riset audiens" };

export default function RisetPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Riset audiens"
        description="Tahap pertama content machine: temukan masalah audiens, lalu susun kategori produk yang layak dipromosikan. Hasilnya tersimpan dan menjadi bahan tahap berikutnya, bukan percakapan terpisah."
      />
      <PanelRiset />
    </div>
  );
}
