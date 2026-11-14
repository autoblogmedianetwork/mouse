import { PageHeader } from "@/components/page-header";
import { wajibSesiHalaman } from "@/lib/supabase/server";
import { CadangkanData } from "@/features/pengaturan/cadangkan-data";
import { HapusData } from "@/features/pengaturan/hapus-data";
import { FormPengaturan } from "./form-pengaturan";
import { TabMenuOtomatis } from "@/components/tab-menu-otomatis";

export const metadata = { title: "Pengaturan" };

export default async function PengaturanPage() {
  await wajibSesiHalaman("/pengaturan");

  return (
    <div className="space-y-6">
      <TabMenuOtomatis />
      <PageHeader
        title="Pengaturan"
        description="Profil, AI, scraping, aturan konten, dan data."
      />
      <FormPengaturan />
      <CadangkanData />
      <HapusData />
    </div>
  );
}
