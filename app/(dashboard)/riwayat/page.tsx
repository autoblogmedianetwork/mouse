import { PageHeader } from "@/components/page-header";
import { wajibSesiHalaman } from "@/lib/supabase/server";
import { TabelRiwayat } from "./tabel-riwayat";

export const metadata = { title: "Riwayat posting" };

export default async function RiwayatPage() {
  await wajibSesiHalaman("/riwayat");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Riwayat posting"
        description="Catatan waktu, mode (manual atau auto), dan status akhir tiap posting."
      />
      <TabelRiwayat />
    </div>
  );
}
