import { RincianBiaya } from "@/features/biaya/rincian-biaya";
import { wajibSesiHalaman } from "@/lib/supabase/server";

export const metadata = { title: "Biaya AI" };

export default async function BiayaPage() {
  await wajibSesiHalaman("/biaya");

  return <RincianBiaya />;
}
