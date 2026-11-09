import { PageHeader } from "@/components/page-header";
import { AlurVideo } from "@/features/video/alur-video";
import { wajibSesiHalaman } from "@/lib/supabase/server";

export const metadata = { title: "Buat video" };

export default async function VideoPage() {
  await wajibSesiHalaman("/video");

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="Buat video"
        description="Storyboard dibuat ChatGPT, video dibuat di Google Flow. Aplikasi hanya menyusun prompt dan memeriksa JSON — tanpa panggilan AI dan tanpa upload."
      />
      <AlurVideo />
    </div>
  );
}
