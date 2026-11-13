/**
 * Siap Copas — menyiapkan konten hari ini agar tinggal salin-tempel ke
 * platform. Tanpa AI call, tanpa otomasi posting (Fase 4: nol risiko ban);
 * publikasi tetap sentuhan tangan user, persiapan yang dipercepat.
 */

export interface KontenSiapCopas {
  id: string;
  judul: string;
  /** Isi status, satu string per status (skema Konten: statuses). */
  statuses: readonly string[];
  produk_nama?: string;
  jadwal_at?: string | null;
  status: string;
  /** Link afiliasi produk (skema Konten: link_produk). */
  link_produk?: string | null;
  /** Di mana link diletakkan (status_terakhir | balasan | tanpa_link). */
  letak_link?: string;
}

export interface TeksSiapCopas {
  /** Teks utama untuk ditempel sebagai postingan. */
  utama: string;
  /** Blok balasan berisi link + keterangan afiliasi, atau null. */
  balasan: string | null;
}

/** YYYY-MM-DD menurut waktu lokal. */
export function kunciTanggalLokal(tgl: Date): string {
  const y = tgl.getFullYear();
  const m = String(tgl.getMonth() + 1).padStart(2, "0");
  const d = String(tgl.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function tanggalDariJadwal(jadwal: string | null | undefined): string | null {
  if (!jadwal) return null;
  const iso = jadwal.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso : null;
}

/**
 * Konten yang dijadwalkan pada tanggal tersebut (urut jam), ditambah
 * cadangan: konten siap_posting yang belum punya jadwal. Cadangan tetap
 * ditampilkan supaya user punya kopian siap tempel bila slot hari kosong.
 */
export function kontenSiapCopas(
  semua: readonly KontenSiapCopas[],
  tanggal: string,
): { terjadwal: KontenSiapCopas[]; cadangan: KontenSiapCopas[] } {
  const terjadwal = semua
    .filter((k) => k.status !== "terkirim" && tanggalDariJadwal(k.jadwal_at) === tanggal)
    .sort((a, b) => (a.jadwal_at ?? "").localeCompare(b.jadwal_at ?? ""));
  const cadangan = semua
    .filter((k) => k.status === "siap_posting" && !tanggalDariJadwal(k.jadwal_at))
    .slice(0, 10);
  return { terjadwal, cadangan };
}

/** Urutan jam jadwal sebagai label pendek ("19:00"), atau "" bila tanpa jadwal. */
export function jamJadwal(jadwal: string | null | undefined): string {
  if (!jadwal) return "";
  const m = jadwal.match(/T(\d{2}:\d{2})/);
  return m ? m[1] : "";
}

const KETERANGAN_AFILIASI =
  "Catatan: tautan ini tautan afiliasi — jika kamu beli lewat sini, aku dapat komisi kecil tanpa menambah harga untukmu.";

/**
 * Siapkan teks untuk clipboard: postingan utama dan blok balasan berisi link
 * + keterangan afiliasi. Bila link sudah ada di dalam status terakhir atau
 * konten memang tanpa link, blok balasan tidak dibuat.
 */
export function teksSiapCopas(konten: KontenSiapCopas): TeksSiapCopas {
  const utama = konten.statuses
    .map((s) => s.trim())
    .filter((s) => s !== "")
    .join("\n\n");
  const tautan = (konten.link_produk ?? "").trim();
  if (!tautan || konten.letak_link === "status_terakhir" || konten.letak_link === "tanpa_link") {
    return { utama, balasan: null };
  }
  const balasan = [tautan, "", KETERANGAN_AFILIASI].join("\n");
  return { utama, balasan };
}

/** Ringkasan satu baris untuk header. */
export function ringkasanSiapCopas(
  terjadwal: readonly KontenSiapCopas[],
  cadangan: readonly KontenSiapCopas[],
): string {
  const bagian: string[] = [];
  bagian.push(
    terjadwal.length === 0
      ? "Belum ada konten terjadwal hari ini"
      : `${terjadwal.length} konten terjadwal hari ini`,
  );
  if (cadangan.length > 0) bagian.push(`${cadangan.length} cadangan tanpa jadwal`);
  return bagian.join(" · ");
}
