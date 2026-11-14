import { RencanaPerdana } from "@/features/rencana/rencana-perdana";
import { TabMenuOtomatis } from "@/components/tab-menu-otomatis";

export const metadata = { title: "Rencana Perdana" };

export default function RencanaPage() {
  return (
    <div className="space-y-4">
      <TabMenuOtomatis />
      <RencanaPerdana />
    </div>
  );
}
