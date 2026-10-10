"use client";

/**
 * Hook performa affiliate: memuat simpanan dari localStorage, mengimpor hasil
 * baca, dan melaporkan kegagalan penyimpanan ke UI. Dipakai halaman Impor,
 * Dashboard, dan Analitik supaya hanya ada satu sumber data.
 */
import { useCallback, useEffect, useState } from "react";
import {
  hapusPerforma,
  muatPerforma,
  simpanPerforma,
  tambahImporKeSimpanan,
  type HasilTambahImpor,
} from "@/lib/impor/store";
import { SIMPANAN_PERFORMA_AWAL, type HasilBaca, type SimpananPerforma } from "@/lib/impor/skema";

export interface PakaiPerforma {
  simpanan: SimpananPerforma;
  /** false selama hidrasi localStorage belum selesai (menghindari kedipan). */
  siap: boolean;
  pesan: string | null;
  impor: (hasil: HasilBaca) => HasilTambahImpor | null;
  hapusSemua: () => void;
  bersihkanPesan: () => void;
}

export function usePerforma(): PakaiPerforma {
  const [simpanan, setSimpanan] = useState<SimpananPerforma>(SIMPANAN_PERFORMA_AWAL);
  const [siap, setSiap] = useState(false);
  const [pesan, setPesan] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hidrasi localStorage harus setelah mount agar sama dengan snapshot SSR
    setSimpanan(muatPerforma());
    setSiap(true);
  }, []);

  const impor = useCallback((hasil: HasilBaca): HasilTambahImpor | null => {
    const gabungan = tambahImporKeSimpanan(simpanan ?? SIMPANAN_PERFORMA_AWAL, hasil);
    const tulis = simpanPerforma(gabungan.simpanan);
    if (!tulis.ok) {
      setPesan(tulis.pesan);
      return null;
    }
    setSimpanan(gabungan.simpanan);
    setPesan(null);
    return gabungan;
  }, [simpanan]);

  const hapusSemua = useCallback(() => {
    hapusPerforma();
    setSimpanan(SIMPANAN_PERFORMA_AWAL);
    setPesan("Data performa dihapus.");
  }, []);

  return {
    simpanan,
    siap,
    pesan,
    impor,
    hapusSemua,
    bersihkanPesan: useCallback(() => setPesan(null), []),
  };
}
