import { TabMenuOtomatis } from "@/components/tab-menu-otomatis";
import { PageHeader } from "@/components/page-header";
import { wajibSesiHalaman } from "@/lib/supabase/server";
import { TabelRiwayat } from "./tabel-riwayat";

export const metadata = { title: "Arsip Terbit" };

export default async function RiwayatPage() {
  await wajibSesiHalaman("/riwayat");

  return (
    <div className="space-y-6">
      <TabMenuOtomatis />
      <PageHeader
        title="Arsip Terbit"
        description="Catatan waktu, mode (manual atau auto), dan status akhir tiap posting."
      />
      <TabelRiwayat />
    </div>
  );
}
