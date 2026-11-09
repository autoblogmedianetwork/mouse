import { MenuTabs } from "@/components/menu-tabs";
import { PageHeader } from "@/components/page-header";
import { wajibSesiHalaman } from "@/lib/supabase/server";
import { TabelRiwayat } from "./tabel-riwayat";

export const metadata = { title: "Konten — Riwayat" };

const TABS = [
  { label: "Antrian", href: "/antrian" },
  { label: "Riwayat", href: "/riwayat" },
] as const;

export default async function RiwayatPage() {
  await wajibSesiHalaman("/riwayat");

  return (
    <div className="space-y-6">
      <MenuTabs tabs={TABS} />
      <PageHeader
        title="Riwayat posting"
        description="Catatan waktu, mode (manual atau auto), dan status akhir tiap posting."
      />
      <TabelRiwayat />
    </div>
  );
}
