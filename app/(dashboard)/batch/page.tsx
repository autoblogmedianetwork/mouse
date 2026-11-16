import { TabMenuOtomatis } from "@/components/tab-menu-otomatis";
import { wajibSesiHalaman } from "@/lib/supabase/server";
import { BatchProdukPanel } from "@/features/konten/batch-produk-panel";

export const metadata = { title: "Produksi Konten" };

export default async function BatchPage() {
  await wajibSesiHalaman("/batch");

  return (
    <div className="space-y-4">
      <TabMenuOtomatis />
      <BatchProdukPanel />
    </div>
  );
}
