import { RincianBiaya } from "@/features/biaya/rincian-biaya";
import { wajibSesiHalaman } from "@/lib/supabase/server";
import { TabMenuOtomatis } from "@/components/tab-menu-otomatis";

export const metadata = { title: "Biaya AI" };

export default async function BiayaPage() {
  await wajibSesiHalaman("/biaya");

  return (
    <div className="space-y-4">
      <TabMenuOtomatis />
      <RincianBiaya />
    </div>
  );
}
