import { PageHeader } from "@/components/page-header";
import { FokusHarian } from "@/features/fokus/fokus-harian";
import { wajibSesiHalaman } from "@/lib/supabase/server";

export const metadata = { title: "Fokus harian" };

/**
 * Mode fokus harian (Level 3): satu layar "hari ini posting apa" berisi konten
 * terjadwal hari ini dan konten siap posting, plus streak hari kerja.
 */
export default async function FokusPage() {
  await wajibSesiHalaman("/fokus");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Fokus hari ini"
        description="Satu hal per hari: salin konten yang sudah siap, tandai selesai, jaga rentetan. Tidak ada yang berubah status tanpa tindakan Anda."
      />
      <FokusHarian />
    </div>
  );
}
