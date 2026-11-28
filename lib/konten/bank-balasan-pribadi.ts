/**
 * Balasan pribadi (pengembangan Bank Balasan) — template milik user sendiri,
 * tersimpan di localStorage, tampil di samping BANK_BALASAN bawaan.
 *
 * Aturan yang sama dengan bawaan: teks balasan = draft, user menyesuaikan
 * dengan konteks sebelum dipakai. Tidak ada pengiriman otomatis (Fase 4).
 */

export type BalasanPribadi = {
  id: string;
  judul: string;
  teks: string;
};

export const KUNCI_BALASAN_PRIBADI = "autothreads-balasan-pribadi";

export type HasilValidasi<T> = { ok: true; data: T } | { ok: false; galat: string };

export function buatBalasanPribadi(judul: string, teks: string): HasilValidasi<BalasanPribadi> {
  const j = judul.trim();
  const t = teks.trim();
  if (j.length < 2) return { ok: false, galat: "Judul minimal 2 karakter." };
  if (j.length > 60) return { ok: false, galat: "Judul maksimal 60 karakter." };
  if (t.length < 5) return { ok: false, galat: "Teks balasan minimal 5 karakter." };
  if (t.length > 500) return { ok: false, galat: "Teks balasan maksimal 500 karakter (batas Threads)." };
  return {
    ok: true,
    data: { id: `bp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, judul: j, teks: t },
  };
}

export function muatBalasanPribadi(): BalasanPribadi[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KUNCI_BALASAN_PRIBADI);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (b): b is BalasanPribadi =>
        typeof b === "object" &&
        b !== null &&
        typeof (b as BalasanPribadi).id === "string" &&
        typeof (b as BalasanPribadi).judul === "string" &&
        typeof (b as BalasanPribadi).teks === "string",
    );
  } catch {
    return [];
  }
}

export function simpanBalasanPribadi(daftar: BalasanPribadi[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KUNCI_BALASAN_PRIBADI, JSON.stringify(daftar));
}

export function tambahBalasanPribadi(
  daftar: BalasanPribadi[],
  judul: string,
  teks: string,
): HasilValidasi<BalasanPribadi[]> {
  const baru = buatBalasanPribadi(judul, teks);
  if (!baru.ok) return baru;
  if (daftar.length >= 30) {
    return { ok: false, galat: "Maksimal 30 balasan pribadi — hapus yang tidak terpakai dulu." };
  }
  return { ok: true, data: [...daftar, baru.data] };
}

export function hapusBalasanPribadi(daftar: BalasanPribadi[], id: string): BalasanPribadi[] {
  return daftar.filter((b) => b.id !== id);
}
