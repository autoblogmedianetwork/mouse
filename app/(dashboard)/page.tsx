import { PageHeader } from "@/components/page-header";
import { BilahAlur } from "@/components/bilah-alur";
import { wajibSesiHalaman } from "@/lib/supabase/server";
import { TurAwal } from "@/features/onboarding/tur-awal";
import { RingkasanDashboard } from "./ringkasan-dashboard";
import { PengingatCadangan } from "@/features/konten/pengingat-cadangan";
import { PintasanIklan } from "@/features/lab/pintasan-iklan";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  await wajibSesiHalaman("/");

  return (
    <div className="space-y-6">
      {/* Tanpa CTA di header: BilahAlur, empty state, dan kartu Lanjutkan sudah
          mengarahkan ke aksi yang sama. Dua CTA primer bersaing membuat pemula
          ragu (temuan critique P1). */}
      <PageHeader
        title="Dashboard"
        description="Alur kerja dari nol sampai komisi pertama: Riset → Buat Posting → Siap Salin."
      />

      <BilahAlur />

      <RingkasanDashboard />

      <PintasanIklan />

      <PengingatCadangan />

      <TurAwal />
    </div>
  );
}
