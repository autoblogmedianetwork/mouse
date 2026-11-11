import { wajibSesiHalaman } from "@/lib/supabase/server";
import { RencanaPerdana } from "@/features/rencana/rencana-perdana";

export const metadata = { title: "Rencana Perdana" };

export default function RencanaPage() {
  return <RencanaPerdana />;
}
