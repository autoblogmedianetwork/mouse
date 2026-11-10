/**
 * Pencarian global lokal (tanpa API): satu kata kunci dicari ke pustaka konten,
 * produk tersimpan, dan bank masalah audiens. Fungsi murni supaya bisa diuji
 * tanpa DOM; halaman `/cari` yang membaca localStorage.
 */
import type { Konten } from "@/lib/konten/skema";
import type { ItemBank } from "@/lib/riset/bank-masalah";

export type JenisHasilCari = "konten" | "produk" | "masalah";

export interface HasilCari {
  jenis: JenisHasilCari;
  id: string;
  judul: string;
  keterangan: string;
  href: string;
}

export interface SumberCari {
  konten: Konten[];
  produk: {
    id: string;
    nama_internal?: string;
    nama?: string;
    varian?: string;
    tag?: string[];
  }[];
  bank: ItemBank[];
}

export const LABEL_JENIS_CARI: Record<JenisHasilCari, string> = {
  konten: "Konten",
  produk: "Produk",
  masalah: "Bank masalah",
};

function cocok(nilai: Array<string | undefined>, q: string): boolean {
  return nilai.some((v) => (v ?? "").toLowerCase().includes(q));
}

/**
 * Cari di tiga sumber sekaligus. `maksPerJenis` membatasi tiap kelompok supaya
 * hasil tetap bisa dipindai; 0 atau kata kunci kosong menghasilkan daftar kosong.
 */
export function cariGlobal(query: string, sumber: SumberCari, maksPerJenis = 5): HasilCari[] {
  const q = query.trim().toLowerCase();
  if (q === "" || maksPerJenis <= 0) return [];

  const konten = sumber.konten
    .filter((k) => cocok([k.judul, k.produk_nama, ...k.statuses], q))
    .slice(0, maksPerJenis)
    .map<HasilCari>((k) => ({
      jenis: "konten",
      id: k.id,
      judul: k.judul,
      keterangan: `${k.status} · ${k.produk_nama || "tanpa produk"} · ${k.statuses.length} status`,
      href: `/antrian?q=${encodeURIComponent(k.judul)}`,
    }));

  const produk = sumber.produk
    .filter((p) => cocok([p.nama_internal, p.nama, p.varian, ...(p.tag ?? [])], q))
    .slice(0, maksPerJenis)
    .map<HasilCari>((p) => ({
      jenis: "produk",
      id: p.id,
      judul: p.nama_internal || p.nama || "Produk tanpa nama",
      keterangan: [p.nama, p.varian, ...(p.tag ?? []).map((t) => `#${t}`)]
        .filter(Boolean)
        .join(" · "),
      href: "/posting/baru",
    }));

  const bank = sumber.bank
    .filter((b) => cocok([b.teks, b.kategori], q))
    .slice(0, maksPerJenis)
    .map<HasilCari>((b) => ({
      jenis: "masalah",
      id: `${b.teks}-${b.ditambahkan}`,
      judul: b.teks,
      keterangan: `${b.kategori || "tanpa kategori"} · sumber ${b.sumber}`,
      href: "/lab",
    }));

  return [...konten, ...produk, ...bank];
}
