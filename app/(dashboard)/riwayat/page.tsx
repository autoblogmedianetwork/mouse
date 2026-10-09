import { PageHeader } from "@/components/page-header";
import { TabelRiwayat } from "./tabel-riwayat";

export const metadata = { title: "Riwayat posting" };

export default function RiwayatPage() {
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
