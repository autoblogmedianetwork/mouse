import { TabMenuOtomatis } from "@/components/tab-menu-otomatis";
import { PageHeader } from "@/components/page-header";
import { wajibSesiHalaman } from "@/lib/supabase/server";
import { EditorTemplate } from "./editor-template";

export const metadata = { title: "Template Deskripsi" };

export default async function TemplatePage() {
  await wajibSesiHalaman("/template");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Template Deskripsi"
        description="Template gaya dan struktur yang bisa dipakai ulang dengan placeholder."
      />
      <TabMenuOtomatis />
      <EditorTemplate />
    </div>
  );
}
