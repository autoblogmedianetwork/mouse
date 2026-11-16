import { TabMenuOtomatis } from "@/components/tab-menu-otomatis";
import { AntrianReview } from "./antrian-review";
import { wajibSesiHalaman } from "@/lib/supabase/server";

export const metadata = { title: "Antrian Posting" };

export default async function AntrianPage() {
  await wajibSesiHalaman("/antrian");

  return (
    <div className="space-y-4">
      <TabMenuOtomatis />
      <AntrianReview />
    </div>
  );
}
