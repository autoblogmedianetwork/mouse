import { PageHeader } from "@/components/page-header";
import { EditorTemplate } from "./editor-template";

export const metadata = { title: "Template deskripsi" };

export default function TemplatePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Template deskripsi"
        description="Template gaya dan struktur yang bisa dipakai ulang dengan placeholder."
      />
      <EditorTemplate />
    </div>
  );
}
