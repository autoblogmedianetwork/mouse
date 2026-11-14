"use client";

/**
 * Halaman Lab (refactor R6): orkestrator saja. Tiap kelompok fitur ada di
 * file sendiri (lab-*.tsx); helper bersama di lab-bersama.tsx.
 */
import { Card } from "@/components/card";
import { NotifikasiProaktif } from "@/features/lab/notifikasi-proaktif";
import { BagianLabUji, BagianIdeMasalah } from "./lab-uji-ide";
import { BagianSerial, BagianHashtag, BagianSerial30 } from "./lab-serial";
import { BagianGhostwriter, BagianBattle, BagianJujur, BagianParalel } from "./lab-kreator";
import { BagianTimeCapsule, BagianNyanyian, BagianGamifikasi, BagianLawanBots, BagianFoto, BagianMirror } from "./lab-alat";

export function LabKlien() {
  return (
    <div className="space-y-6">
      <p className="text-meta text-muted-foreground">
        Semua keluaran AI berstatus draft. Tidak ada yang menjadi siap posting tanpa checklist dan
        tindakan Anda. Panggilan AI memakai kredit server dan dihentikan otomatis saat batas biaya
        bulanan tercapai.
      </p>
      <BagianLabUji />
      <BagianIdeMasalah />
      <BagianSerial />
      <BagianHashtag />
      <BagianSerial30 />
      <BagianGhostwriter />
      <BagianBattle />
      <BagianJujur />
      <BagianParalel />
      <BagianTimeCapsule />
      <BagianNyanyian />
      <BagianGamifikasi />
      <BagianLawanBots />
      <NotifikasiProaktif />
      <BagianFoto />
      <BagianMirror />
    </div>
  );
}
