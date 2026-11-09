import { MenuTabs } from "@/components/menu-tabs";
import { AntrianReview } from "./antrian-review";
import { wajibSesiHalaman } from "@/lib/supabase/server";

export const metadata = { title: "Konten — Antrian" };

const TABS = [
  { label: "Antrian", href: "/antrian" },
  { label: "Riwayat", href: "/riwayat" },
] as const;

export default async function AntrianPage() {
  await wajibSesiHalaman("/antrian");

  return (
    <div className="space-y-4">
      <MenuTabs tabs={TABS} />
      <AntrianReview />
    </div>
  );
}
