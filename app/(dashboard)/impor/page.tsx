import { TabMenuOtomatis } from "@/components/tab-menu-otomatis";
import { PageHeader } from "@/components/page-header";
import { PanelImpor } from "@/features/impor/panel-impor";
import { wajibSesiHalaman } from "@/lib/supabase/server";


export const metadata = { title: "Impor performa" };

export default async function ImporPage() {
  await wajibSesiHalaman("/impor");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Impor performa affiliate"
        description="Baca laporan komisi dari Shopee, TikTok Shop, atau Tokopedia Affiliate. Deteksi format berjalan otomatis, dan pemetaan kolom bisa Anda koreksi sendiri."
      />
      <TabMenuOtomatis />
      <PanelImpor />
    </div>
  );
}
