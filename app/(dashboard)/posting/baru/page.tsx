import { PageHeader } from "@/components/page-header";
import { AlurBuatPosting } from "@/features/posting/alur-buat-posting";

export const metadata = { title: "Buat posting" };

export default function BuatPostingPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="Buat posting"
        description="Alur bertahap: produk → analisis → ide → generate → preview & salin. Berhenti di tiap checkpoint sampai Anda menyetujui hasilnya."
      />
      <AlurBuatPosting />
    </div>
  );
}
