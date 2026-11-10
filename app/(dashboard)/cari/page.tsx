import { PageHeader } from "@/components/page-header";
import { PencarianGlobal } from "@/features/cari/pencarian-global";
import { wajibSesiHalaman } from "@/lib/supabase/server";

export const metadata = { title: "Pencarian" };

/**
 * Pencarian global (Level 2): satu kotak untuk konten, produk tersimpan, dan
 * bank masalah. Semua sumber ada di localStorage, jadi tidak ada API.
 */
export default async function CariPage() {
  await wajibSesiHalaman("/cari");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Pencarian"
        description="Cari di seluruh konten, produk tersimpan, dan bank masalah audiens sekaligus. Dijalankan di browser, tanpa server."
      />
      <PencarianGlobal />
    </div>
  );
}
