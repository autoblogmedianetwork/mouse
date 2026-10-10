/**
 * Normalisasi nilai mentah laporan affiliate.
 *
 * Angka uang di laporan marketplace campur format: "Rp1.234.567" (Indonesia),
 * "1,234.56" (Inggris), "(12.000)" untuk retur, dan "5%" untuk tingkat komisi.
 * Tanggal bisa ISO, dd/mm/yyyy, atau "1 Okt 2026". Semua diubah ke bentuk
 * internal yang konsisten supaya penghitungan komisi tidak salah.
 */

const BULAN_ID = [
  "januari",
  "februari",
  "maret",
  "april",
  "mei",
  "juni",
  "juli",
  "agustus",
  "september",
  "oktober",
  "november",
  "desember",
];

const BULAN_EN = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
];

/** Hanya digit, tanda minus, titik, dan koma yang dipertahankan. */
function intiAngka(raw: string): string {
  return raw.replace(/[^\d.,\-]/g, "");
}

/**
 * Parse angka apa pun menjadi number, atau null bila tidak ada digit.
 * Angka negatif dikenali dari tanda minus, tanda kurung akuntansi, atau
 * minus di belakang nilai.
 */
export function parseAngka(raw: string | number | null | undefined): number | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : null;

  let teks = raw.trim();
  if (teks === "" || teks === "-" || /^[-–—]+$/.test(teks)) return null;

  let negatif = false;
  if (/^\(.*\)$/.test(teks)) {
    negatif = true;
    teks = teks.slice(1, -1);
  }
  if (/^-/.test(teks)) {
    negatif = true;
    teks = teks.slice(1);
  } else if (/-$/.test(teks)) {
    negatif = true;
    teks = teks.slice(0, -1);
  }

  const inti = intiAngka(teks);
  if (!/\d/.test(inti)) return null;

  const adaTitik = inti.includes(".");
  const adaKoma = inti.includes(",");
  let bersih: string;

  if (adaTitik && adaKoma) {
    // Pemisah yang paling akhir adalah pemisah desimal.
    const desimal = inti.lastIndexOf(".") > inti.lastIndexOf(",") ? "." : ",";
    const ribuan = desimal === "." ? "," : ".";
    bersih = inti.split(ribuan).join("");
    bersih = desimal === "." ? bersih : bersih.replace(",", ".");
  } else if (adaKoma) {
    bersih = tafsirSatuPemisah(inti, ",").replace(",", ".");
  } else {
    bersih = tafsirSatuPemisah(inti, ".");
  }

  const nilai = Number.parseFloat(bersih);
  if (!Number.isFinite(nilai)) return null;
  return negatif ? -nilai : nilai;
}

/**
 * Satu pemisah saja bisa berarti desimal atau ribuan.
 * "1,5" dan "12.75" → desimal; "1.234" dan "1,234" → ribuan.
 */
function tafsirSatuPemisah(inti: string, pemisah: string): string {
  const bagian = inti.split(pemisah);
  if (bagian.length === 2 && bagian[1].length !== 3) {
    return pemisah === "." ? inti : `${bagian[0]}.${bagian[1]}`;
  }
  if (bagian.length === 2 && bagian[1].length === 3 && bagian[0].length === 0) {
    // ",500" — kemungkinan desimal dengan angka di belakang.
    return pemisah === "." ? `0.${bagian[1]}` : `0.${bagian[1]}`;
  }
  return bagian.join("");
}

/** Tingkat komisi selalu dianggap persen. "5%" → 5. */
export function parsePersen(raw: string | number | null | undefined): number | null {
  if (raw === null || raw === undefined) return null;
  const nilai = parseAngka(raw);
  if (nilai === null) return null;
  if (typeof raw === "string" && raw.includes("%")) return nilai;
  // Nilai tanpa tanda persen tapi berkisar 0-1 biasanya adalah pecahan.
  if (Math.abs(nilai) <= 1) return nilai * 100;
  return nilai;
}

function bangunTanggal(tahun: number, bulan: number, hari: number): string | null {
  if (bulan < 1 || bulan > 12 || hari < 1 || hari > 31) return null;
  const uji = new Date(Date.UTC(tahun, bulan - 1, hari));
  if (
    uji.getUTCFullYear() !== tahun ||
    uji.getUTCMonth() !== bulan - 1 ||
    uji.getUTCDate() !== hari
  ) {
    return null;
  }
  const bulanStr = `${bulan}`.padStart(2, "0");
  const hariStr = `${hari}`.padStart(2, "0");
  return `${tahun}-${bulanStr}-${hariStr}`;
}

/**
 * Ubah tanggal laporan menjadi ISO (YYYY-MM-DD), atau null bila gagal dibaca.
 * Urutan dd/mm dipakai lebih dulu untuk tanggal ambigu, karena laporan berasal
 * dari marketplace Indonesia; bila angka pertama > 12 maka bulan yang dipakai.
 */
export function parseTanggal(raw: string | number | null | undefined): string | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === "number") return parseTanggal(serialKeIso(raw));

  const teks = raw.trim();
  if (teks === "") return null;

  // 2026-10-01 atau 2026-10-01 14:30:00
  const iso = teks.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (iso) return bangunTanggal(Number(iso[1]), Number(iso[2]), Number(iso[3]));

  // 01/10/2026, 10-01-2026, 1.10.2026
  const dmy = teks.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})/);
  if (dmy) {
    const a = Number(dmy[1]);
    const b = Number(dmy[2]);
    const tahun = Number(dmy[3]) < 100 ? 2000 + Number(dmy[3]) : Number(dmy[3]);
    if (a > 12) return bangunTanggal(tahun, b, a);
    if (b > 12) return bangunTanggal(tahun, a, b);
    return bangunTanggal(tahun, b, a);
  }

  // 1 Okt 2026 (hari dulu) atau Okt 1, 2026 / October 1 2026 (bulan dulu)
  const rendah = teks.toLowerCase();
  const hariDulu = rendah.match(/^(\d{1,2})\s+([a-z]{3,})\s+(\d{4})/);
  const bulanDulu = rendah.match(/^([a-z]{3,})\s+(\d{1,2}),?\s+(\d{4})/);
  if (hariDulu || bulanDulu) {
    const bulanKata = (hariDulu ? hariDulu[2] : bulanDulu![1]).slice(0, 3);
    const hari = Number(hariDulu ? hariDulu[1] : bulanDulu![2]);
    const tahun = Number(hariDulu ? hariDulu[3] : bulanDulu![3]);
    const idxId = BULAN_ID.findIndex((b) => b.startsWith(bulanKata));
    const idxEn = BULAN_EN.findIndex((b) => b.startsWith(bulanKata));
    const bulan = idxId >= 0 ? idxId + 1 : idxEn >= 0 ? idxEn + 1 : 0;
    if (bulan > 0) return bangunTanggal(tahun, bulan, hari);
  }

  // "2026-10-01T00:00:00.000Z" dan bentuk Date yang bisa dibaca langsung.
  const umum = Date.parse(teks);
  if (!Number.isNaN(umum)) {
    const d = new Date(umum);
    return bangunTanggal(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
  }

  return null;
}

/**
 * XLSX menyimpan tanggal sebagai jumlah hari sejak 1899-12-30.
 * Angka di bawah 2000 diperlakukan sebagai tanggal, di atas itu sebagai nilai
 * biasa (komisi sudah kami kirim sebagai string dari pembaca XLSX).
 */
export function serialKeIso(serial: number): string {
  const epoch = Date.UTC(1899, 11, 30);
  const ms = epoch + Math.round(serial) * 86_400_000;
  const d = new Date(ms);
  return `${d.getUTCFullYear()}-${`${d.getUTCMonth() + 1}`.padStart(2, "0")}-${`${d.getUTCDate()}`.padStart(2, "0")}`;
}

export type StatusPesanan = "selesai" | "menunggu" | "batal" | "lainnya";

const KATA_STATUS: Array<[StatusPesanan, string[]]> = [
  [
    "selesai",
    [
      "selesai",
      "sukses",
      "berhasil",
      "dibayar",
      "diterima",
      "completed",
      "complete",
      "settled",
      "success",
      "paid",
      "delivered",
      "approved",
      "disetujui",
    ],
  ],
  [
    "batal",
    [
      "batal",
      "dibatalkan",
      "cancel",
      "refund",
      "retur",
      "dikembalikan",
      "returned",
      "gagal",
      "failed",
      "expired",
      "kadaluarsa",
      "invalid",
      "tidak valid",
    ],
  ],
  [
    "menunggu",
    [
      "menunggu",
      "pending",
      "proses",
      "diproses",
      "processing",
      "shipped",
      "dikirim",
      "unpaid",
      "belum dibayar",
      "menunggu konfirmasi",
      "on hold",
    ],
  ],
];

/**
 * Kelompokkan status pesanan mentah. Status asli tetap disimpan di baris,
 * pengelompokan ini hanya dipakai untuk memisahkan komisi yang sudah dibayar
 * dari yang masih tertunda.
 */
export function kanonikStatus(raw: string | null | undefined): StatusPesanan {
  if (!raw) return "lainnya";
  const teks = raw.toLowerCase().trim();
  if (teks === "") return "lainnya";
  for (const [kode, kata] of KATA_STATUS) {
    if (kata.some((k) => teks.includes(k))) return kode;
  }
  return "lainnya";
}

/** Rapikan teks sel: buang spasi berlebih dan karakter tidak terlihat. */
export function bersihkanTeks(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) return "";
  return raw.replace(/\s+/g, " ").replace(/[\u200B-\u200D\uFEFF]/g, "").trim();
}

/** Format rupiah tanpa desimal untuk tampilan ringkasan. */
export function formatRupiah(nilai: number): string {
  const bulat = Math.round(nilai);
  const tanda = bulat < 0 ? "-" : "";
  return `${tanda}Rp${Math.abs(bulat).toLocaleString("id-ID")}`;
}

/** Format angka biasa dengan pemisah ribuan Indonesia. */
export function formatAngka(nilai: number, desimal = 0): string {
  return nilai.toLocaleString("id-ID", {
    minimumFractionDigits: desimal,
    maximumFractionDigits: desimal,
  });
}
