import { PageHeader } from "@/components/page-header";
import { wajibSesiHalaman } from "@/lib/supabase/server";
import { CadangkanData } from "@/features/pengaturan/cadangkan-data";
import { FormPengaturan } from "./form-pengaturan";

export const metadata = { title: "Pengaturan" };

export default async function PengaturanPage() {
  await wajibSesiHalaman("/pengaturan");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pengaturan"
        description="Profil, AI, scraping, aturan konten, dan data."
      />
      <FormPengaturan />
      <CadangkanData />
    </div>
  );
}
