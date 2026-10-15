import { PageHeader } from "@/components/page-header";
import { DaftarProdukBelumDiposting } from "@/features/analitik/daftar-produk-belum-diposting";
import { AnalitikPerforma } from "./analitik-performa";

export const metadata = { title: "Analitik" };

export default function AnalitikPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Analitik"
        description="Ringkasan komisi, GMV, produk terlaris, dan tren bulanan dari laporan affiliate yang Anda impor."
      />
      <AnalitikPerforma />
      {/* Sumbernya pustaka konten, bukan laporan impor, jadi tidak dipandu ini. */}
      <DaftarProdukBelumDiposting />
    </div>
  );
}
