import { TabMenuOtomatis } from "@/components/tab-menu-otomatis";
import { PageHeader } from "@/components/page-header";
import { DaftarProdukBelumDiposting } from "@/features/analitik/daftar-produk-belum-diposting";
import { InsightAtribusi } from "@/features/analitik/insight-atribusi";
import { wajibSesiHalaman } from "@/lib/supabase/server";
import { AnalitikPerforma } from "./analitik-performa";


export const metadata = { title: "Analitik" };

export default async function AnalitikPage() {
  await wajibSesiHalaman("/analitik");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analitik"
        description="Ringkasan komisi, GMV, produk terlaris, dan tren bulanan dari laporan affiliate yang Anda impor."
      />
      <TabMenuOtomatis />
      <AnalitikPerforma />
      <InsightAtribusi />
      {/* Sumbernya pustaka konten, bukan laporan impor, jadi tidak dipandu ini. */}
      <DaftarProdukBelumDiposting />
    </div>
  );
}
