/**
 * Jembatan Tempel Cepat -> Buat Posting (Opsi B/C, Gelombang 5).
 *
 * Sebelumnya user harus menyalin data produk dua kali: sekali di Tempel Cepat
 * (Riset), lalu sekali lagi di form produk (Buat Posting). Fungsi ini
 * mengubah hasil tempelan langsung menjadi isi form produk, sehingga setelah
 * "Jadikan produk" user dibawa ke Buat Posting dengan form yang sudah terisi.
 *
 * Bentuk keluaran sengaja mengikuti `productFormSchema` (lib/produk/skema.ts)
 * supaya lolos validasi tanpa diolah lagi.
 */
import type { HasilTempelCepat, ProdukTempelan } from "./tempel-cepat";

export interface DraftProduk {
  nama_internal: string;
  nama: string;
  varian: string;
  harga: string;
  deskripsi: string;
  url_referensi: string;
}

/** Deskripsi minimum agar lolos productFormSchema (min 10 karakter). */
const PANJANG_MIN_DESKRIPSI = 10;

/**
 * Susun deskripsi dari data yang benar-benar ditempel. Bukti sosial (terjual,
 * rating) ikut ditulis karena AI memakainya untuk menilai permintaan; angka
 * yang tidak ada tidak dikarang.
 */
function susunDeskripsi(produk: ProdukTempelan, hasil?: HasilTempelCepat): string {
  const bagian: string[] = [];

  if (produk.marketplace) bagian.push(`Sumber: ${produk.marketplace}.`);
  if (produk.terjual !== null && produk.terjual > 0) {
    bagian.push(`Terjual ${produk.terjual.toLocaleString("id-ID")} unit.`);
  }
  if (produk.rating !== null && produk.rating > 0) {
    bagian.push(`Rating ${produk.rating} dari pembeli.`);
  }
  if (produk.harga !== null && produk.harga > 0) {
    bagian.push(`Harga ${produk.harga.toLocaleString("id-ID")} rupiah.`);
  }
  if (hasil) {
    bagian.push(
      hasil.layak
        ? "Hasil skor otomatis: layak dikerjakan."
        : "Hasil skor otomatis: belum layak, perlu dicek ulang.",
    );
  }
  bagian.push("Lengkapi kekurangan produk di sini sebelum generate.");

  const teks = bagian.join(" ");
  // Jaga agar selalu lolos validasi walau semua data kosong.
  return teks.length >= PANJANG_MIN_DESKRIPSI
    ? teks
    : "Produk dari tempelan marketplace. Lengkapi deskripsi di sini.";
}

/** Ubah hasil Tempel Cepat menjadi isi form produk Buat Posting. */
export function produkKeDraft(produk: ProdukTempelan, hasil?: HasilTempelCepat): DraftProduk {
  const nama = (produk.nama ?? "").trim();
  const namaAman = nama === "" ? "Produk dari marketplace" : nama;

  return {
    nama_internal: namaAman.slice(0, 120),
    nama: namaAman.slice(0, 300),
    varian: "",
    harga: produk.harga !== null && produk.harga > 0 ? String(produk.harga) : "",
    deskripsi: susunDeskripsi(produk, hasil),
    url_referensi: (produk.link ?? "").trim(),
  };
}
