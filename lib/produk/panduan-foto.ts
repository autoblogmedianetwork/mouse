/**
 * Panduan foto candid (N-7): teks statis yang disusun dari data produk.
 *
 * Tidak memanggil AI, tidak memuat link dan harga hardcode. Bagian yang
 * spesifik produk hanya diambil dari data yang sudah ada (nama, varian, fitur,
 * dan target audiens hasil analisis). Fitur yang mengandung link atau harga
 * dibuang supaya panduan tidak ikut mengulang klaim atau harga.
 */

export interface ProdukUntukPanduan {
  nama_internal?: string | null;
  nama?: string | null;
  varian?: string | null;
  fitur?: string[] | null;
  target_audiens?: string[] | null;
}

export interface PanduanFoto {
  judul: string;
  ringkas: string;
  langkah: string[];
}

/** Buang fitur yang memuat link atau nominal harga, rapikan, maksimal 3. */
export function fiturLayakTampil(fitur: string[] | null | undefined): string[] {
  return (fitur ?? [])
    .map((f) => f.trim())
    .filter((f) => f.length > 0)
    .filter((f) => !/https?:\/\//i.test(f))
    .filter((f) => !/\brp\s?\d/i.test(f))
    .slice(0, 3);
}

/** Nama produk untuk teks panduan: nama listing lebih dulu, lalu nama internal. */
export function namaUntukPanduan(produk: ProdukUntukPanduan): string {
  return produk.nama?.trim() || produk.nama_internal?.trim() || "produk ini";
}

export function panduanFotoCandid(produk: ProdukUntukPanduan): PanduanFoto {
  const nama = namaUntukPanduan(produk);
  const fitur = fiturLayakTampil(produk.fitur);
  const audiens = (produk.target_audiens ?? [])
    .map((a) => a.trim())
    .filter((a) => a.length > 0)
    .slice(0, 2);
  const varian = produk.varian?.trim();

  const langkah: string[] = [
    `Foto pembuka: ${nama} sedang dipakai di tempat yang wajar bagi pemakainya${
      audiens.length > 0 ? ` (${audiens.join(", ")})` : ""
    }. Cahaya alami dari samping, latar bersih tanpa merek lain.`,
    fitur.length > 0
      ? `Foto fungsi: satu foto per bagian yang paling sering dipakai — ${fitur.join("; ")} — tangkap buktinya secara visual, bukan lewat tulisan di gambar.`
      : "Foto fungsi: potret dua bagian produk yang paling sering dipakai dari dua sudut berbeda.",
    varian
      ? `Sertakan varian yang dipakai (${varian}) pada salah satu foto, misalnya di tangan saat produk sedang digunakan.`
      : "Sertakan bentuk produk apa adanya pada salah satu foto, termasuk saat sedang digunakan.",
    "Foto bukti pakai: tangkap momen candid saat aktivitas berlangsung, tanpa pose kaku, tangan pemakai terlihat.",
    "Hindari: harga, teks promosi di dalam gambar, klaim berlebihan, dan foto hasil salinan dari listing.",
  ];

  return {
    judul: "Panduan foto candid",
    ringkas: `Konsep foto untuk ${nama}${
      audiens.length > 0 ? `, ditujukan untuk ${audiens.join(" dan ")}` : ""
    }. Susun dari data produk yang sudah Anda isi, bukan dari klaim baru.`,
    langkah,
  };
}
