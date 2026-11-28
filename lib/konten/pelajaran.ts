/**
 * Kumpulan pelajaran (pengembangan Bedah Postingan) — hasil bedah
 * postingan orang lain yang user simpan, untuk dirujuk saat menulis.
 *
 * Tersimpan di localStorage per perangkat. Maks 20 supaya daftar tetap
 * bisa dibaca manusia — kalau penuh, hapus yang sudah dipelajari.
 */

export type Pelajaran = {
  id: string;
  /** Konteks bebas, mis. nama produk atau topik postingan yang dibedah. */
  sumber: string;
  hookJenis: string;
  hookPenjelasan: string;
  ctaJenis: string;
  ctaAda: boolean;
  pelajaran: string[];
  disimpanPada: string;
};

export const KUNCI_PELAJARAN = "autothreads-pelajaran";
export const MAKS_PELAJARAN = 20;

export type HasilValidasi<T> = { ok: true; data: T } | { ok: false; galat: string };

export function muatPelajaran(): Pelajaran[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KUNCI_PELAJARAN);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (p): p is Pelajaran =>
        typeof p === "object" &&
        p !== null &&
        typeof (p as Pelajaran).id === "string" &&
        Array.isArray((p as Pelajaran).pelajaran),
    );
  } catch {
    return [];
  }
}

export function simpanPelajaran(daftar: Pelajaran[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KUNCI_PELAJARAN, JSON.stringify(daftar));
}

export function tambahPelajaran(
  daftar: Pelajaran[],
  baru: Omit<Pelajaran, "id" | "disimpanPada">,
): HasilValidasi<Pelajaran[]> {
  if (daftar.length >= MAKS_PELAJARAN) {
    return { ok: false, galat: `Kumpulan penuh (${MAKS_PELAJARAN}) — hapus yang sudah dipelajari dulu.` };
  }
  const entri: Pelajaran = {
    ...baru,
    sumber: baru.sumber.trim() || "Tanpa nama",
    id: `plj-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    disimpanPada: new Date().toISOString(),
  };
  return { ok: true, data: [entri, ...daftar] };
}

export function hapusPelajaran(daftar: Pelajaran[], id: string): Pelajaran[] {
  return daftar.filter((p) => p.id !== id);
}

/** Ringkasan satu baris untuk ditampilkan saat menulis konten. */
export function ringkasPelajaran(p: Pelajaran): string {
  return `${p.hookJenis} · ${p.pelajaran.join(" ")}`;
}
