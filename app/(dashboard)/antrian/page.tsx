import { AntrianReview } from "./antrian-review";
import { wajibSesiHalaman } from "@/lib/supabase/server";

export const metadata = { title: "Antrian review" };

export default async function AntrianPage() {
  await wajibSesiHalaman("/antrian");

  return <AntrianReview />;
}
