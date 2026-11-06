import { MenuTabs } from "@/components/menu-tabs";
import { MENU_ITEMS } from "@/components/nav-config";
import { PageHeader } from "@/components/page-header";
import { wajibSesiHalaman } from "@/lib/supabase/server";
import { EditorTemplate } from "./editor-template";

const TABS = MENU_ITEMS.find((i) => i.href === "/link")?.tabs ?? [];

export const metadata = { title: "Template deskripsi" };

export default async function TemplatePage() {
  await wajibSesiHalaman("/template");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Template deskripsi"
        description="Template gaya dan struktur yang bisa dipakai ulang dengan placeholder."
      />
      <MenuTabs tabs={TABS} />
      <EditorTemplate />
    </div>
  );
}
