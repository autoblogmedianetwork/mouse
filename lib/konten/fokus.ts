/**
 * Mode fokus harian + streak (Level 3, tanpa API). Fungsi murni: memilih
 * konten yang layak dikerjakan hari ini dan menghitung rentetan hari kerja.
 * Komponen `/fokus` yang membaca localStorage.
 */
import type { Konten } from "./skema";

export const KEY_FOKUS_SELESAI = "autothreads-fokus-selesai";
export const MAKS_FOKUS = 3;
/** Riwayat hari disimpan maksimal 120 hari supaya localStorage tidak menumpuk. */
export const MAKS_HARI_SELESAI = 120;

/** YYYY-MM-DD menurut waktu lokal (bukan UTC), sama seperti kalender. */
export function kunciHariLokal(tgl: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${tgl.getFullYear()}-${pad(tgl.getMonth() + 1)}-${pad(tgl.getDate())}`;
}

function hariLalu(hari: string, n: number): string | null {
  const cocok = /^(\d{4})-(\d{2})-(\d{2})$/.exec(hari);
  if (!cocok) return null;
  const d = new Date(Number(cocok[1]), Number(cocok[2]) - 1, Number(cocok[3]));
  d.setDate(d.getDate() - n);
  return kunciHariLokal(d);
}

export type AlasanFokus = "jadwal_hari_ini" | "siap_posting";

export interface ItemFokus {
  konten: Konten;
  alasan: AlasanFokus;
}

/**
 * Urutan prioritas: konten terjadwal hari ini (paling mendesak), lalu konten
 * siap posting terbaru. Arsip dan status lain tidak masuk daftar — mode fokus
 * hanya menampilkan yang memang bisa dikerjakan sekarang.
 */
export function pilihFokus(
  konten: readonly Konten[],
  sekarang = new Date(),
  maks = MAKS_FOKUS,
): ItemFokus[] {
  const hari = kunciHariLokal(sekarang);

  const terjadwal = konten
    .filter(
      (k) =>
        !k.arsip &&
        k.status === "terjadwal" &&
        k.jadwal_at !== null &&
        Number.isFinite(Date.parse(k.jadwal_at)) &&
        kunciHariLokal(new Date(k.jadwal_at)) === hari,
    )
    .sort((a, b) => Date.parse(a.jadwal_at ?? "") - Date.parse(b.jadwal_at ?? ""))
    .map<ItemFokus>((k) => ({ konten: k, alasan: "jadwal_hari_ini" }));

  const siap = konten
    .filter((k) => !k.arsip && k.status === "siap_posting")
    .sort((a, b) => Date.parse(b.updated_at) - Date.parse(a.updated_at))
    .map<ItemFokus>((k) => ({ konten: k, alasan: "siap_posting" }));

  return [...terjadwal, ...siap].slice(0, maks);
}

/** Tandai satu hari selesai; tanggal duplikat dipindah ke depan, bukan digandakan. */
export function catatHariSelesai(
  hari: readonly string[],
  hariIni: string,
  maks = MAKS_HARI_SELESAI,
): string[] {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(hariIni)) return [...hari];
  return [hariIni, ...hari.filter((h) => h !== hariIni)].slice(0, maks);
}

/**
 * Rentetan hari berturut-turut yang punya minimal satu konten selesai. Hari ini
 * belum selesai tidak memutus streak — rentetan dihitung dari kemarin supaya
 * angka tidak jatuh ke 0 hanya karena hari belum berjalan.
 */
export function hitungStreak(hariSelesai: readonly string[], hariIni: string): number {
  const set = new Set(hariSelesai);
  let kursor = set.has(hariIni) ? hariIni : hariLalu(hariIni, 1);
  let streak = 0;
  while (kursor !== null && set.has(kursor)) {
    streak += 1;
    kursor = hariLalu(kursor, 1);
  }
  return streak;
}

/** Tujuh hari terakhir (termasuk hari ini) untuk titik-titik progres. */
export function tujuhHariTerakhir(
  hariSelesai: readonly string[],
  hariIni: string,
): { hari: string; selesai: boolean }[] {
  const set = new Set(hariSelesai);
  const hasil: { hari: string; selesai: boolean }[] = [];
  for (let i = 6; i >= 0; i -= 1) {
    const hari = hariLalu(hariIni, i);
    if (hari !== null) hasil.push({ hari, selesai: set.has(hari) });
  }
  return hasil;
}

/**
 * Rekomendasi produk (power-up Fokus harian): produk yang belum punya konten
 * sama sekali, atau konten terakhirnya sudah lebih lama dari `batasHari`.
 * Murni fungsi; UI yang menampilkan hasilnya.
 */
export interface ProdukTertelantar {
  nama: string;
  /** Berapa konten yang pernah dibuat untuk produk ini (0 = belum pernah). */
  jumlahKonten: number;
  /** Hari sejak konten terakhir untuk produk ini; null kalau belum pernah. */
  hariSejakTerakhir: number | null;
  alasan: string;
}

export function produkButuhKonten(
  produkList: Array<{ nama_internal?: string; nama?: string }>,
  kontenList: Konten[],
  hariIni: Date = new Date(),
  batasHari = 7,
): ProdukTertelantar[] {
  const keluar: ProdukTertelantar[] = [];
  for (const p of produkList) {
    const nama = (p.nama_internal ?? p.nama ?? "").trim();
    if (nama === "") continue;
    const milik = kontenList.filter(
      (k) => (k.produk_nama ?? "").trim().toLowerCase() === nama.toLowerCase(),
    );
    if (milik.length === 0) {
      keluar.push({
        nama,
        jumlahKonten: 0,
        hariSejakTerakhir: null,
        alasan: "belum pernah dibuatkan konten",
      });
      continue;
    }
    const terakhir = milik
      .map((k) => Date.parse(k.updated_at ?? ""))
      .filter((t) => Number.isFinite(t))
      .sort((a, b) => b - a)[0];
    if (!terakhir) continue;
    const hari = Math.floor((hariIni.getTime() - terakhir) / 86_400_000);
    if (hari > batasHari) {
      keluar.push({
        nama,
        jumlahKonten: milik.length,
        hariSejakTerakhir: hari,
        alasan: `konten terakhirnya ${hari} hari lalu`,
      });
    }
  }
  return keluar;
}
