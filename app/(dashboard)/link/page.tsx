import { MenuTabs } from "@/components/menu-tabs";
import { MENU_ITEMS } from "@/components/nav-config";
import { PageHeader } from "@/components/page-header";
import { wajibSesiHalaman } from "@/lib/supabase/server";
import { DetektorLink } from "@/features/link/detektor-link";
import { TabelLink } from "./tabel-link";

const TABS = MENU_ITEMS.find((i) => i.href === "/link")?.tabs ?? [];

export const metadata = { title: "Link affiliate" };

export default async function LinkPage() {
  await wajibSesiHalaman("/link");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Link affiliate"
        description="Daftar link dengan catatan klik dan komisi manual sesuai PRD F5."
      />
      <MenuTabs tabs={TABS} />
      <DetektorLink />
      <TabelLink />
    </div>
  );
}
