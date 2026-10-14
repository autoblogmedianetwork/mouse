import { PageHeader } from "@/components/page-header";
import { AlurBuatPosting } from "@/features/posting/alur-buat-posting";

export const metadata = { title: "Buat posting" };

/**
 * `?prefill=` dari Quick Capture (N-8) diteruskan mentah ke alur; decoding dan
 * validasi Zod dilakukan di klien lewat lib/impor/prefill.ts. Server tidak
 * mengambil halaman marketplace dan tidak menyimpan apa pun dari parameter itu.
 */
export default async function BuatPostingPage({
  searchParams,
}: {
  searchParams: Promise<{ prefill?: string }>;
}) {
  const { prefill } = await searchParams;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="Buat posting"
        description="Alur bertahap: produk → analisis → ide → generate → preview & salin. Berhenti di tiap checkpoint sampai Anda menyetujui hasilnya."
      />
      <AlurBuatPosting prefillKode={prefill} />
    </div>
  );
}
