/**
 * Simpanan peta atribusi di localStorage, mengikuti pola lib/impor/store.ts:
 * penulisan melaporkan kegagalan supaya UI bisa memberi pesan, bukan diam.
 */
import {
  KUNCI_ATRIBUSI,
  PETA_ATRIBUSI_AWAL,
  VERSI_ATRIBUSI,
  normalkanSubId,
  petaAtribusiSkema,
  type PetaAtribusi,
} from "./skema";

export type HasilSimpan = { ok: true } | { ok: false; pesan: string };

export function muatPetaAtribusi(): PetaAtribusi {
  if (typeof window === "undefined") return PETA_ATRIBUSI_AWAL;
  try {
    const mentah = window.localStorage.getItem(KUNCI_ATRIBUSI);
    if (!mentah) return PETA_ATRIBUSI_AWAL;
    const hasil = petaAtribusiSkema.safeParse(JSON.parse(mentah));
    return hasil.success ? hasil.data : PETA_ATRIBUSI_AWAL;
  } catch {
    return PETA_ATRIBUSI_AWAL;
  }
}

export function simpanPetaAtribusi(peta: PetaAtribusi): HasilSimpan {
  if (typeof window === "undefined") {
    return { ok: false, pesan: "Penyimpanan hanya tersedia di peramban." };
  }
  try {
    window.localStorage.setItem(KUNCI_ATRIBUSI, JSON.stringify(peta));
    return { ok: true };
  } catch {
    return { ok: false, pesan: "Penyimpanan peramban penuh, peta atribusi gagal disimpan." };
  }
}

export function hapusPetaAtribusi(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KUNCI_ATRIBUSI);
}

/**
 * Tambah atau ubah satu pemetaan. `kontenId` null berarti hapus pemetaan,
 * sehingga sub_id itu kembali muncul di daftar "belum dipetakan".
 */
export function setPemetaan(
  peta: PetaAtribusi,
  subId: string,
  kontenId: string | null,
): PetaAtribusi {
  const kunci = normalkanSubId(subId);
  if (kunci === "") return peta;
  const next = { ...peta.peta };
  if (kontenId === null) delete next[kunci];
  else next[kunci] = kontenId;
  return { versi: VERSI_ATRIBUSI, peta: next };
}
