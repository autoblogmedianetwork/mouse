"use client";

/**
 * Hook atribusi: konten (localStorage) + baris performa hasil impor + peta
 * sub_id, dijadikan satu ringkasan per konten dan per angle.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePerforma } from "@/features/impor/use-performa";
import type { Konten } from "@/lib/konten/skema";
import { useLocalState } from "@/lib/konten/use-local-state";
import { hitungAtribusi, type HasilAtribusi } from "@/lib/performa/atribusi";
import { muatPetaAtribusi, setPemetaan, simpanPetaAtribusi } from "@/lib/performa/store";
import { PETA_ATRIBUSI_AWAL, type PetaAtribusi } from "@/lib/performa/skema";

export interface PakaiAtribusi {
  hasil: HasilAtribusi;
  konten: Konten[];
  /** false selama hidrasi localStorage belum selesai. */
  siap: boolean;
  pesan: string | null;
  /** Tautkan sub_id ke konten; null untuk melepas pemetaan. */
  ubah: (subId: string, kontenId: string | null) => void;
  /** Simpan perubahan yang dikumpulkan di UI (checkpoint eksplisit). */
  simpanBanyak: (perubahan: Array<{ subId: string; kontenId: string | null }>) => void;
}

export function useAtribusi(): PakaiAtribusi {
  const { simpanan, siap: performaSiap } = usePerforma();
  const [konten] = useLocalState<Konten[]>("autothreads-konten", []);
  const [peta, setPeta] = useState<PetaAtribusi>(PETA_ATRIBUSI_AWAL);
  const [siapPeta, setSiapPeta] = useState(false);
  const [pesan, setPesan] = useState<string | null>(null);
  const petaRef = useRef(peta);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hidrasi localStorage harus setelah mount agar sama dengan snapshot SSR
    setPeta(muatPetaAtribusi());
    setSiapPeta(true);
  }, []);

  useEffect(() => {
    petaRef.current = peta;
  }, [peta]);

  const ubah = useCallback((subId: string, kontenId: string | null) => {
    const next = setPemetaan(petaRef.current, subId, kontenId);
    const tulis = simpanPetaAtribusi(next);
    if (!tulis.ok) {
      setPesan(tulis.pesan);
      return;
    }
    setPesan(null);
    setPeta(next);
  }, []);

  const simpanBanyak = useCallback(
    (perubahan: Array<{ subId: string; kontenId: string | null }>) => {
      let next = petaRef.current;
      for (const p of perubahan) next = setPemetaan(next, p.subId, p.kontenId);
      const tulis = simpanPetaAtribusi(next);
      if (!tulis.ok) {
        setPesan(tulis.pesan);
        return;
      }
      setPesan(null);
      setPeta(next);
    },
    [],
  );

  const hasil = useMemo(
    () => hitungAtribusi(simpanan.baris, konten, peta.peta),
    [simpanan.baris, konten, peta],
  );

  return { hasil, konten, siap: performaSiap && siapPeta, pesan, ubah, simpanBanyak };
}
