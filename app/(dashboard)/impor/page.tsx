import { PageHeader } from "@/components/page-header";
import { PanelImpor } from "@/features/impor/panel-impor";

export const metadata = { title: "Impor performa" };

export default function ImporPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Impor performa affiliate"
        description="Baca laporan komisi dari Shopee, TikTok Shop, atau Tokopedia Affiliate. Deteksi format berjalan otomatis, dan pemetaan kolom bisa Anda koreksi sendiri."
      />
      <PanelImpor />
    </div>
  );
}
