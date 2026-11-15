/**
 * Personal Branding Kit — 7 postingan pembuka untuk akun affiliate baru.
 *
 * Filosofi (sesuai Rencana Perdana & masukan review eksternal):
 * - Hari 1-7 TANPA link dan TANPA jualan; tujuannya membangun kepercayaan.
 * - Dua jalan per hari: template manual (isi kosong otomatis dari form) atau
 *   dibuatkan AI lewat /api/generate yang sudah ada (persona bernama +
 *   kerangka "cerita" + tanpa link) — tidak ada prompt versi baru.
 * - Hanya Hari 1 yang memperkenalkan nama. Hari 2-7 langsung ke cerita:
 *   mengulang perkenalan setiap posting terasa seperti bot.
 */

export interface DataBranding {
  /** Nama persona, mis. "Pak Slem". */
  nama: string;
  /** Satu keseharian nyata, mis. "kandang ayam di belakang rumah". */
  detailHidup: string;
  /** Topik pagar akun, mis. "barang praktis rumah tangga". */
  niche: string;
}

export const DATA_BRANDING_AWAL: DataBranding = {
  nama: "Pak Slem",
  detailHidup: "",
  niche: "",
};

export const KUNCI_BRANDING = "autothreads-branding-kit";
export const KUNCI_BRANDING_HASIL = "autothreads-branding-hasil";

/** Gaya bicara yang dipakai opsi AI (≤300 karakter, batas skema persona_gaya). */
export const GAYA_PERSONA =
  "Bapak-bapak gaul usia 35+, sopan dan friendly, suka bercerita. Bicara seperti ngobrol santai dengan tetangga: ramah, rendah hati, selalu pakai 'saya'. Mulai dari cerita kecil sehari-hari, jujur soal kekurangan, tidak pernah mendesak. Cerita kecil lebih kuat dari klaim besar.";

export interface HariKit {
  id: number;
  judul: string;
  /** Penjelasan tugas hari itu (ditampilkan di kartu). */
  tugas: string;
  /** True bila hari ini TIDAK posting (mis. hari balas thread). */
  hariIstirahat?: boolean;
  /** Template manual dengan placeholder [nama] / [detail_hidup] / [niche]. */
  template: string;
  /** Brief untuk opsi AI (juga memakai placeholder yang sama). */
  instruksi: string;
  /**
   * True bila hari ini BERCERITA TENTANG PENGALAMAN PRIBADI.
   * Untuk hari seperti ini AI hanya boleh menyusun kerangka dengan kolom kosong
   * ([...]) — tidak boleh mengarang kejadian — dan tombol Salin baru aktif
   * setelah user mencentang bahwa kejadiannya benar-benar dialami sendiri.
   */
  butuhPengalaman?: boolean;
}

export const HARI_KIT: HariKit[] = [
  {
    id: 1,
    judul: "Perkenalan (Manifesto)",
    tugas:
      "Satu-satunya posting yang menyebut nama. Posting lalu sematkan (pin) di profil — ini KTP akun untuk 21 hari ke depan.",
    template: `Perkenalkan, saya [nama]. Bapak dua anak, kesehariannya sibuk kerja dan urus [detail_hidup].

Akun ini saya buat karena muas sama review yang bagusnya cuma di iklan. Barang datang, beda cerita.

Janji saya:
— Yang saya tulis pengalaman nyata, bukan karangan.
— Yang bagus saya bilang bagus. Yang bikin kesel, saya bilang juga.
— Tidak ada paksaan beli. Saya cuma cerita.

Yang capek sama iklan berlebihan, silakan duduk manis. Ceritanya panjang, tapi jujur.`,
    instruksi: `Postingan perkenalan akun (manifesto). Sebut nama [nama] di awal. Ceritakan siapa [nama]: bapak dua anak yang kesehariannya [detail_hidup]. Alasan akun dibuat: muas sama review yang bagusnya cuma di iklan, barang datang beda cerita. Akhiri dengan tiga janji singkat: yang ditulis pengalaman nyata bukan karangan; yang bagus bilang bagus yang bikin kesel bilang juga; tidak ada paksaan beli. Tutup dengan ajakan santai untuk ikut menyimak. Tanpa hashtag, tanpa emoji berlebihan, tanpa link.`,
  },
  {
    id: 2,
    judul: "Cerita keseharian",
    tugas:
      "Cerita masalah harian, TANPA produk. Tujuannya pancing komentar — orang suka diminta trik.",
    template: `[detail_hidup] itu ujian harian saya. Bukan barangnya yang bikin capek, tapi ngejar waktunya.

Sudah coba macam-macam sistem. Yang paling jalan ternyata yang paling malesnya. Klasik.

Kalau kamu juga punya rutinitas yang kelihatan sepele tapi tiap hari, share dong di komentar. Siapa tahu ada cara yang lebih waras.`,
    butuhPengalaman: true,
    instruksi: `JANGAN memperkenalkan diri dengan nama. JANGAN mengarang kejadian, nama barang, angka, atau nama orang. Tugasmu HANYA menyusun kerangka cerita keseharian seputar [detail_hidup] dengan tiga bagian: (1) satu kalimat pembuka yang mengakui rutinitas ini melelahkan, (2) baris berisi [tulis sendiri: satu kejadian nyata yang kamu alami soal ini], (3) pertanyaan ringan meminta trik pembaca. Sisakan kurung siku itu APA ADANYA supaya user mengisinya sendiri. Tanpa produk, tanpa link, tanpa hashtag, maksimal satu emoji.`
  },
  {
    id: 3,
    judul: "Cerita gagal belanja",
    tugas:
      "Pengakuan pernah tertipu iklan. Relate = follow. Jangan sebut merek, cukup jenis barangnya.",
    template: `Pernah beli barang karena videonya keren banget, pas datang ternyata cuma bagus di video?

Saya pernah. Alat "serbaguna" yang sembilan fungsinya cuma numpang nama. Yang kepake satu: gunting kuku. Sekarang jadi tempat pensil.

Sejak itu saya alergi kata "serbaguna". Kamu pernah kena yang sama? Cerita, biar saya tidak merasa sendirian.`,
    butuhPengalaman: true,
    instruksi: `JANGAN memperkenalkan diri dengan nama. JANGAN mengarang kejadian, merek, harga, atau angka apa pun. Tugasmu HANYA menyusun kerangka pengakuan gagal belanja seputar [niche] dengan tiga bagian: (1) pembuka berupa pertanyaan "pernah beli karena videonya keren, datangnya mengecewakan?", (2) baris berisi [tulis sendiri: barang apa yang kamu beli dan apa yang mengecewakan], (3) ajakan berbagi cerita. Sisakan kurung siku itu APA ADANYA supaya user mengisinya sendiri dengan kejadian asli. Tanpa produk, tanpa merek, tanpa link, tanpa hashtag, maksimal satu emoji.`,
  },
  {
    id: 4,
    judul: "Tips kecil dari pengalaman",
    tugas:
      "Tiga kebiasaan kecil yang terbukti. Isi poinnya dari pengalamanmu sendiri — jangan dari internet.",
    template: `Setahun coba-coba, ketemu juga: soal [niche], yang ngaruh itu kebiasaan kecil, bukan barang mahal.

Tiga yang paling terasa:
— (kebiasaan pertamamu)
— (kebiasaan keduamu)
— (kebiasaan ketigamu)

Sederhana, tapi hasilnya kelihatan. Kalau punya versi kamu, saya tunggu di komentar.`,
    instruksi: `JANGAN memperkenalkan diri dengan nama. Bagikan tiga kebiasaan kecil yang terbukti membantu soal [niche]. Format: satu kalimat pengantar, tiga poin singkat dengan tanda -, satu kalimat penutup mengajak pembaca berbagi kebiasaan versi mereka. Bahasa tetap cerita, bukan dosen. Tanpa produk, tanpa link, tanpa hashtag.`,
  },
  {
    id: 5,
    judul: "Hari balas thread",
    hariIstirahat: true,
    tugas:
      "Hari ini TIDAK posting. Cari 3 thread yang bahas [niche], balas dengan pengalaman nyata. Nama baik dibangun di kolom komentar orang lain. Opsi AI di bawah membuat CONTOH balasan untuk diadaptasi.",
    template: `Hari ini saya tidak posting.

Tugasnya: cari tiga thread yang bahas [niche], balas dengan pengalaman nyata. Bantu, jangan jualan. Tidak perlu menyebut produk apa pun.

Aturannya satu: kalau tidak punya pengalaman soal topiknya, diam saja dan cari yang lain.`,
    instruksi: `Tulis satu CONTOH balasan ramah untuk thread orang yang curhat soal [niche]. Bantu dengan pengalaman umum yang terasa nyata, jangan sebut produk, jangan jualan, maksimal tiga kalimat, tanpa hashtag. Ini contoh untuk diadaptasi, bukan postingan utama.`,
  },
  {
    id: 6,
    judul: "Belajar kecil yang baru",
    tugas:
      "Satu hal yang baru kamu sadar salah terus, dan cara barunya. Rendah hati = trustworthy.",
    template: `Ternyata selama ini saya salah terus soal [niche].

(ceritakan kebiasaan lamamu yang ternyata keliru, lalu cara barunya yang lebih baik)

Iya, semundur-mundurnya bapak-bapak ini belajar dari kesalahan sehari-hari. Kalau kamu punya trik yang lebih waras, saya tunggu di komentar.`,
    butuhPengalaman: true,
    instruksi: `JANGAN memperkenalkan diri dengan nama. JANGAN mengarang kejadian, angka, atau pelajaran yang tidak nyata. Tugasmu HANYA menyusun kerangka cerita belajar dengan tiga bagian: (1) pengakuan bahwa selama ini ada hal soal [niche] yang dikerjakan keliru, (2) baris berisi [tulis sendiri: kebiasaan lamamu yang keliru, lalu cara barunya], (3) penutup rendah hati yang mengajak pembaca berbagi trik. Sisakan kurung siku itu APA ADANYA supaya user mengisinya sendiri. Tanpa produk, tanpa link, tanpa hashtag, maksimal satu emoji.`,
  },
  {
    id: 7,
    judul: "Evaluasi minggu pertama",
    tugas:
      "Posting singkat + cek menu Performa: postingan mana yang paling banyak komentar? Pola itu yang diulang minggu depan.",
    template: `Seminggu berjalan. Waktunya jujur sama diri sendiri.

Yang paling banyak komentar ternyata bukan yang paling rapi — tapi yang paling jujur.

Minggu depan mulai bahas produk. Tetap aturan yang sama: pengalaman nyata, kekurangan disebut, tidak ada paksaan. Terima kasih yang sudah mampir.`,
    instruksi: `Tulis catatan evaluasi hari ketujuh: apresiasi perjalanan seminggu, pengakuan bahwa postingan yang paling jujur adalah yang paling banyak respons, dan kabar bahwa minggu depan mulai membahas produk dengan aturan yang sama (jujur, sebut kekurangan, tanpa paksaan). Ringkas, hangat, tanpa link, tanpa hashtag.`,
  },
];

/**
 * Ganti placeholder [nama] / [detail_hidup] / [niche] dengan data form.
 * Placeholder tanpa data dibiarkan terlihat supaya user tahu harus mengisi apa.
 */
export function isiTemplate(teks: string, data: DataBranding): string {
  let hasil = teks;
  for (const [kunci, nilai] of [
    ["nama", data.nama],
    ["detail_hidup", data.detailHidup],
    ["niche", data.niche],
  ] as const) {
    const bersih = nilai.trim();
    if (bersih) hasil = hasil.split(`[${kunci}]`).join(bersih);
  }
  return hasil;
}

/**
 * Label yang WAJIB tampil di setiap hasil AI Branding Kit (semua hari).
 * Alasannya: AI tidak pernah mengalami kejadian apa pun, jadi hasilnya hanya
 * ilustrasi gaya — bukan pengalaman, bukan testimoni.
 */
export const LABEL_ILUSTRASI =
  "Ilustrasi gaya dari AI — bukan pengalaman nyata. Ganti dengan kejadianmu sendiri sebelum diposting.";

/** Label khusus hari yang bercerita pengalaman (2, 3, 6). */
export const LABEL_BUTUH_PENGALAMAN =
  "Hari ini bercerita pengalaman pribadi. AI hanya menyusun kerangkanya; kolom [...] harus kamu isi dengan kejadian asli.";

/** Tanda kolom kosong yang harus diisi user sebelum boleh posting. */
const POLA_KOLOM_KOSONG = /\[[^\]]*tulis sendiri[^\]]*\]|\[[^\]]*\]|\(kebiasaan (pertama|kedua|ketiga)mu\)|\(ceritakan kebiasaan lamamu[^)]*\)/i;

/**
out = true bila teks masih menyisakan kolom kosong yang harus diisi user.
 */
export function masihAdaKolomKosong(teks: string): boolean {
  return POLA_KOLOM_KOSONG.test(teks);
}

/**
 * Gerbang salin: hari yang bercerita pengalaman baru boleh disalin bila
 * (1) user menyatakan kejadiannya dialami sendiri, dan
 * (2) tidak ada kolom kosong tersisa.
 */
export function bolehSalin(
  hari: HariKit,
  teks: string,
  sudahDikonfirmasi: boolean,
): { boleh: boolean; alasan?: string } {
  if (masihAdaKolomKosong(teks)) {
    return { boleh: false, alasan: "Masih ada kolom [...] yang harus kamu isi dengan kejadian nyata." };
  }
  if (hari.butuhPengalaman && !sudahDikonfirmasi) {
    return {
      boleh: false,
      alasan: "Centang dulu: kejadian ini benar-benar kamu alami sendiri.",
    };
  }
  return { boleh: true };
}

/** Body request untuk /api/generate (prompt v8) — satu posting, tanpa link. */
export function bodyAI(data: DataBranding, hari: HariKit): Record<string, unknown> {
  const instruksi = isiTemplate(hari.instruksi, data);
  return {
    namaProduk: data.niche.trim() || "Personal branding akun baru",
    ringkasan: `Postingan personal branding hari ke-${hari.id} (${hari.judul}). ${data.nama.trim() || "Akun"} adalah bapak dua anak yang kesehariannya ${data.detailHidup.trim() || "belum diisi"}. Topik akun: ${data.niche.trim() || "belum ditentukan"}.`,
    fitur: [],
    ide: {
      judul: `Branding Hari ${hari.id} — ${hari.judul}`,
      deskripsi: isiTemplate(hari.tugas, data),
      jembatan: "Bangun kepercayaan, bukan jualan. Tidak ada link.",
      format_label: "Storytelling",
    },
    pengaturan: {
      mode_output: "threads",
      jumlah_status: "satu",
      panjang_status: "sedang",
      instruksi,
      anti_ai_slop: true,
      persona: "bernama",
      persona_nama: data.nama.trim(),
      persona_gaya: GAYA_PERSONA,
      kerangka: hari.id === 1 ? "bebas" : "cerita",
      gaya_hook: hari.id === 1 ? "bawaan" : "pengalaman_nyata",
      aturan_kepercayaan: false,
      letak_link: "tanpa_link",
      sertakan_disclosure: false,
    },
    kategori: "personal branding",
  };
}
