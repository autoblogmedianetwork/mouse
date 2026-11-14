import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { BilahAlur } from "@/components/bilah-alur";
import { wajibSesiHalaman } from "@/lib/supabase/server";
import { TurAwal } from "@/features/onboarding/tur-awal";
import { RingkasanDashboard } from "./ringkasan-dashboard";
import { KalkulatorKomisi } from "@/features/affiliate/kalkulator-komisi";
import { PengingatCadangan } from "@/features/konten/pengingat-cadangan";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  await wajibSesiHalaman("/");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hari Ini"
        description="Alur kerja dari nol sampai komisi pertama: Riset → Bikin Konten → Terbit."
      >
        <Link
          href="/posting/baru"
          className="inline-flex h-9 items-center bg-primary px-4 text-badan font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
        >
          Buat posting baru
        </Link>
      </PageHeader>

      <BilahAlur />

      <RingkasanDashboard />

      <PengingatCadangan />

      <KalkulatorKomisi />

      <TurAwal />
    </div>
  );
}
