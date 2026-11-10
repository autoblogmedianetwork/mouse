import { wajibSesiHalaman } from "@/lib/supabase/server";
import { BatchProdukPanel } from "@/features/konten/batch-produk-panel";

export const metadata = { title: "Batch produk" };

export default async function BatchPage() {
  await wajibSesiHalaman("/batch");
  return <BatchProdukPanel />;
}
