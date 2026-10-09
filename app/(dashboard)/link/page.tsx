import { PageHeader } from "@/components/page-header";
import { TabelLink } from "./tabel-link";

export const metadata = { title: "Link affiliate" };

export default function LinkPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Link affiliate"
        description="Daftar link dengan catatan klik dan komisi manual sesuai PRD F5."
      />
      <TabelLink />
    </div>
  );
}
