import { MenuTabs } from "@/components/menu-tabs";
import { MENU_ITEMS } from "@/components/nav-config";
import { PageHeader } from "@/components/page-header";
import { DaftarProdukBelumDiposting } from "@/features/analitik/daftar-produk-belum-diposting";
import { InsightAtribusi } from "@/features/analitik/insight-atribusi";
import { wajibSesiHalaman } from "@/lib/supabase/server";
import { AnalitikPerforma } from "./analitik-performa";

const TABS = MENU_ITEMS.find((i) => i.href === "/analitik")?.tabs ?? [];

export const metadata = { title: "Analitik" };

export default async function AnalitikPage() {
  await wajibSesiHalaman("/analitik");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analitik"
        description="Ringkasan komisi, GMV, produk terlaris, dan tren bulanan dari laporan affiliate yang Anda impor."
      />
      <MenuTabs tabs={TABS} />
      <AnalitikPerforma />
      <InsightAtribusi />
      {/* Sumbernya pustaka konten, bukan laporan impor, jadi tidak dipandu ini. */}
      <DaftarProdukBelumDiposting />
    </div>
  );
}
