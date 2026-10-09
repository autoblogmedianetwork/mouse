import { PageHeader } from "@/components/page-header";
import { FormPengaturan } from "./form-pengaturan";

export const metadata = { title: "Pengaturan" };

export default function PengaturanPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Pengaturan"
        description="Profil, AI, scraping, aturan konten, dan data."
      />
      <FormPengaturan />
    </div>
  );
}
