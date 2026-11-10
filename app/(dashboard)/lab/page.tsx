import { PageHeader } from "@/components/page-header";
import { LabKlien } from "@/features/lab/lab-klien";
import { wajibSesiHalaman } from "@/lib/supabase/server";

export const metadata = { title: "Lab konten" };

/**
 * Gelombang 3: tiga alat berbasis AI yang tetap berhenti di bahan tinjauan —
 * lab uji (simulasi pembeli), mesin ide dari bank masalah, dan serial 7 hari.
 * Tidak ada yang otomatis menjadi siap posting (PRD F0).
 */
export default async function LabPage() {
  await wajibSesiHalaman("/lab");

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="Lab konten"
        description="Uji konten dari mata pembeli, ubah satu masalah jadi tiga hook, atau susun serial 7 hari. Semua hasil berstatus bahan tinjauan — Anda tetap yang memutuskan."
      />
      <LabKlien />
    </div>
  );
}
