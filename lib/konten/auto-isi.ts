/**
 * Auto-isi kalender (power-up Kalender, Gelombang 4).
 *
 * Ambil konten berstatus siap_posting yang belum punya jadwal, lalu pasangkan
 * ke hari-hari kosong ke depan (satu konten per hari). Fungsi murni: tidak
 * menyimpan apa pun — pemanggil yang memutuskan simpan atau tidak, sesuai
 * prinsip checkpoint eksplisit.
 */

import type { Konten } from "./skema";

export interface HasilAutoIsi {
  /** Pasangan id konten -> ISO jadwal yang diusulkan. */
  usulan: Array<{ id: string; jadwalAt: string }>;
  /** Konten siap posting yang tidak terpasang karena hari kosong habis. */
  sisa: number;
  pesan: string;
}

/** Jam 19:00 lokal pada tanggal tertentu (waktu posting yang umum aktif). */
const JAM_POSTING = 19;

function kunciHari(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const t = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${t}`;
}

/**
 * Susun usulan auto-isi. `hariMulai` = hari ini (dipakai test untuk determinisme).
 * Hari yang sudah punya konten terjadwal dianggap terisi.
 */
export function usulkanAutoIsi(
  list: Konten[],
  hariMulai: Date = new Date(),
  maksHari = 14,
): HasilAutoIsi {
  const siap = list.filter((k) => k.status === "siap_posting" && !k.jadwal_at);
  if (siap.length === 0) {
    return { usulan: [], sisa: 0, pesan: "Tidak ada konten siap posting yang belum dijadwalkan." };
  }

  const hariTerisi = new Set(
    list
      .filter((k) => k.status === "terjadwal" && k.jadwal_at)
      .map((k) => kunciHari(new Date(k.jadwal_at as string))),
  );

  const usulan: Array<{ id: string; jadwalAt: string }> = [];
  const terpakai = new Set<string>();
  for (let offset = 0; offset < maksHari && usulan.length < siap.length; offset += 1) {
    const hari = new Date(hariMulai);
    hari.setDate(hari.getDate() + offset);
    const kunci = kunciHari(hari);
    if (hariTerisi.has(kunci) || terpakai.has(kunci)) continue;
    hari.setHours(JAM_POSTING, 0, 0, 0);
    usulan.push({ id: siap[usulan.length].id, jadwalAt: hari.toISOString() });
    terpakai.add(kunci);
  }

  const sisa = siap.length - usulan.length;
  return {
    usulan,
    sisa,
    pesan:
      usulan.length === 0
        ? "Semua hari ke depan sudah terisi."
        : `${usulan.length} konten diusulkan ke hari kosong (satu per hari, pukul ${JAM_POSTING}:00).`,
  };
}
