import { TabMenuOtomatis } from "@/components/tab-menu-otomatis";
import { PageHeader } from "@/components/page-header";
import { wajibSesiHalaman } from "@/lib/supabase/server";
import { DetektorLink } from "@/features/link/detektor-link";
import { HalamanBio } from "@/features/link/halaman-bio";
import { TabelLink } from "./tabel-link";


export const metadata = { title: "Link dan Template" };

export default async function LinkPage() {
  await wajibSesiHalaman("/link");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Link & Template"
        description="Daftar link dengan catatan klik dan komisi manual sesuai PRD F5."
      />
      <TabMenuOtomatis />
      <DetektorLink />
      <HalamanBio />
      <TabelLink />
    </div>
  );
}
