import { PageHeader } from "@/components/page-header";
import { PanelRiset } from "@/features/riset/panel-riset";
import { TempelCepat } from "@/features/riset/tempel-cepat";
import { wajibSesiHalaman } from "@/lib/supabase/server";

export const metadata = { title: "Riset audiens" };

export default async function RisetPage() {
  await wajibSesiHalaman("/riset");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Riset audiens"
        description="Tahap pertama content machine: temukan masalah audiens, lalu susun kategori produk yang layak dipromosikan. Hasilnya tersimpan dan menjadi bahan tahap berikutnya, bukan percakapan terpisah."
      />
      <TempelCepat />
      <PanelRiset />
    </div>
  );
}
