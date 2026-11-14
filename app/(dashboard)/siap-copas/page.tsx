import { SiapCopas } from "@/features/konten/siap-copas";
import { TabMenuOtomatis } from "@/components/tab-menu-otomatis";

export const metadata = { title: "Siap Copas" };

export default function SiapCopasPage() {
  return (
    <div className="space-y-4">
      <TabMenuOtomatis />
      <SiapCopas />
    </div>
  );
}
