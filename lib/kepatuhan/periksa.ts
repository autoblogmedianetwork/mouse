/**
 * Pemeriksa kepatuhan konten afiliasi (adaptasi kerangka "compliance-checker").
 *
 * Aturannya bukan karangan: semuanya diambil dari Syarat dan Ketentuan Program
 * Afiliasi Shopee untuk Individu (artikel 71217, dibaca 28 Nov 2026) dan
 * kebiasaan iklan Indonesia:
 *
 *   2.7   media yang disetujui tidak boleh memuat merek/nama/logo Shopee
 *   3.4   pesanan dari sumber tak terlacak menggugurkan komisi
 *   6.3(h) dilarang memakai kata kunci merek di iklan pencarian
 *   6.3(n) dilarang iklan berbayar yang bersifat clickbait
 *   6.3(o) dilarang masking / custom link / pemendek tautan
 *   6.3(q) dilarang meniru identitas Shopee
 *   7.1   dilarang iklan yang menyesatkan
 *
 * Semua pemeriksaan murni teks: tanpa AI, tanpa jaringan, jalan offline.
 */
import { PANDUAN_SUB_ID } from "@/lib/performa/panduan-sub-id";

export type TingkatTemuan = "blokir" | "peringatan";

export interface Temuan {
  id: string;
  label: string;
  tingkat: TingkatTemuan;
  /** Apa yang salah dan apa yang harus dilakukan. */
  pesan: string;
  /** Cuplikan teks yang memicu, untuk memudahkan mencari. */
  cuplikan: string;
}

export interface HasilKepatuhan {
  /** True hanya kalau tidak ada temuan tingkat "blokir". */
  lulus: boolean;
  skor: number;
  temuan: Temuan[];
  /** Pengingat tetap yang berlaku walau teksnya bersih. */
  catatan: string[];
}

export type KonteksKonten = "organik" | "iklan";

interface Aturan {
  id: string;
  label: string;
  tingkat: TingkatTemuan;
  pola: RegExp;
  pesan: string;
  /** Aturan ini hanya berlaku pada konteks tertentu. */
  hanya?: KonteksKonten;
}

const ATURAN: readonly Aturan[] = [
  {
    id: "merek-marketplace",
    label: "Menyebut merek marketplace",
    tingkat: "blokir",
    pola: /\b(shopee|shopeePay|tokopedia|lazada|blibli|tiktok\s?shop|bukalapak)\b/i,
    pesan:
      "Hapus nama marketplace dari teks. Media yang disetujui tidak boleh memuat merek Shopee (pasal 2.7), dan iklan yang menyerupai identitasnya dilarang (6.3q). Cukup bilang “link di bio”.",
  },
  {
    id: "tautan-dipendekkan",
    label: "Tautan dibungkus atau dipendekkan",
    tingkat: "blokir",
    pola: /\b(bit\.ly|s\.id|tinyurl|rebrand\.ly|shorturl|linktr\.ee|t\.co|cutt\.ly)\b/i,
    pesan: PANDUAN_SUB_ID.larangan,
  },
  {
    id: "meniru-identitas",
    label: "Mengaku sebagai pihak resmi",
    tingkat: "blokir",
    pola: /(official\s?(store|shop|resmi))|(akun\s+resmi)|(garansi\s+resmi\s+shopee)|(dari\s+shopee\s+langsung)/i,
    pesan:
      "Kamu bukan toko atau kanal resmi. Pasal 6.3(q) melarang promosi yang meniru identitas Shopee, dan klaim resmi palsu melanggar 7.1.",
  },
  {
    id: "klaim-kesehatan",
    label: "Klaim menyembuhkan",
    tingkat: "blokir",
    pola: /(sembuh|menyembuhkan|obat\s+\w+|detoks|menghilangkan\s+(penyakit|jerawat|noda)|mengecilkan\s+perut|ampuh\s+banget)/i,
    pesan:
      "Klaim kesehatan tidak boleh ditulis tanpa izin edar dan dasar medis. Ganti dengan pengalaman pribadi yang tidak menjanjikan hasil, atau hapus.",
  },
  {
    id: "klaim-absolut",
    label: "Klaim mutlak",
    tingkat: "peringatan",
    pola: /(100\s?%|pasti\s+(sembuh|berhasil|bagus)|terbaik\s+di\s+dunia|no\.?\s?1\b|nomor\s+satu|garansi\s+seumur\s+hidup)/i,
    pesan:
      "Klaim mutlak tidak bisa kamu buktikan dan mudah dianggap menyesatkan (pasal 7.1). Ganti dengan hal yang bisa dicek: angka, bahan, atau durasi.",
  },
  {
    id: "clickbait",
    label: "Clickbait",
    tingkat: "peringatan",
    pola: /(klik\s+sekarang|klik\s+link|wajib\s+punya|buruan\s+klik|klik\s+cepat|!!!)/i,
    pesan:
      "Pasal 6.3(n) melarang iklan berbayar yang bersifat clickbait. Tulis manfaatnya, biarkan pembaca memutuskan sendiri.",
  },
  {
    id: "stok-karangan",
    label: "Jumlah stok dikarang",
    tingkat: "peringatan",
    pola: /(sisa\s+\d+)|(tinggal\s+\d+\s+(lagi|pcs|buah))|(stok\s+(terbatas|tipis|habis))|(kuota\s+habis)/i,
    pesan:
      "Sebut jumlah stok hanya kalau itu benar. Klaim stok karangan termasuk clickbait (6.3n) dan membuat pembaca kehilangan kepercayaan.",
  },
  {
    id: "urgensi-karangan",
    label: "Desakan waktu tanpa dasar",
    tingkat: "peringatan",
    pola: /(cuma\s+hari\s+ini|hanya\s+hari\s+ini|hari\s+ini\s+doang|detik\s+ini|sebelum\s+kehabisan)/i,
    pesan:
      "Pastikan memang ada batas waktu resmi (tanggal promo berakhir). Kalau tidak ada, ganti dengan alasan jujur kenapa sekarang layak dibeli.",
  },
  {
    id: "otoritas-tanpa-dasar",
    label: "Mengaku-ngaku ahli",
    tingkat: "peringatan",
    pola: /(kata\s+(dokter|ahli|pakar|profesor))|(menurut\s+(dokter|ahli|pakar))|(sudah\s+diteliti)|(terbukti\s+secara\s+ilmiah)/i,
    pesan:
      "Sebutkan sumber yang bisa dicek, atau hapus klaimnya. Tanpa sumber, ini klaim menyesatkan (pasal 7.1).",
  },
  {
    id: "tanpa-disclosure",
    label: "Tidak ada tanda materi promosi",
    tingkat: "peringatan",
    pola: /(#publi|#ad\b|#ads|#affiliate|#afiliasi|kerja\s?sama|sponsor|endorse)/i,
    pesan:
      "Tambahkan tanda materi promosi (#publi). Ini kewajiban etika iklan Indonesia dan membuat audiens tahu kamu dapat komisi.",
    // Kalau polanya TIDAK ketemu, temuan dibuat (lihat periksaKepatuhan).
    hanya: undefined,
  },
  {
    id: "kata-kunci-merek",
    label: "Kata kunci merek untuk iklan",
    tingkat: "peringatan",
    pola: /\b(shopee|shopeePay|tokopedia|lazada)\b/i,
    pesan:
      "Pasal 6.3(h): merek Shopee wajib dijadikan kata kunci negatif di iklan pencarian. Jangan pernah memasang iklan pada kata kunci merek.",
    hanya: "iklan",
  },
];

function cuplik(teks: string, pola: RegExp): string {
  const cocok = teks.match(pola);
  if (!cocok) return "";
  const posisi = cocok.index ?? 0;
  const mulai = Math.max(0, posisi - 24);
  const akhir = Math.min(teks.length, posisi + cocok[0].length + 24);
  return `${mulai > 0 ? "…" : ""}${teks.slice(mulai, akhir).trim()}${akhir < teks.length ? "…" : ""}`;
}

/** Pengingat yang berlaku untuk semua konten, tidak tergantung teksnya. */
const CATATAN_TETAP = [
  "Tempel tautan affiliate apa adanya. Jangan dipendekkan, dibungkus, atau di-redirect (pasal 2.6 dan 6.3o).",
  "Materi berbayar wajib bertanda #publi — aturan etika iklan, sekaligus menjaga kepercayaan pembaca.",
  "Kode pelacak (sub_id) dipasang di pembuat link Shopee, bukan diubah di teks postingan.",
];

/**
 * Periksa satu blok teks. `konteks` menentukan aturan tambahan: teks untuk
 * iklan berbayar kena aturan kata kunci merek, teks organik tidak.
 */
export function periksaKepatuhan(
  teks: string,
  opsi: { konteks?: KonteksKonten } = {},
): HasilKepatuhan {
  const bahan = (teks ?? "").trim();
  const konteks = opsi.konteks ?? "organik";

  if (bahan === "") {
    return {
      lulus: false,
      skor: 0,
      temuan: [
        {
          id: "kosong",
          label: "Belum ada teks",
          tingkat: "peringatan",
          pesan: "Tulis dulu kontennya, lalu periksa.",
          cuplikan: "",
        },
      ],
      catatan: [...CATATAN_TETAP],
    };
  }

  const temuan: Temuan[] = [];

  for (const aturan of ATURAN) {
    if (aturan.hanya && aturan.hanya !== konteks) continue;

    if (aturan.id === "tanpa-disclosure") {
      // Aturan terbalik: temuan muncul justru kalau penandanya TIDAK ada.
      if (!aturan.pola.test(bahan)) {
        temuan.push({
          id: aturan.id,
          label: aturan.label,
          tingkat: aturan.tingkat,
          pesan: aturan.pesan,
          cuplikan: "",
        });
      }
      continue;
    }

    if (aturan.pola.test(bahan)) {
      temuan.push({
        id: aturan.id,
        label: aturan.label,
        tingkat: aturan.tingkat,
        pesan: aturan.pesan,
        cuplikan: cuplik(bahan, aturan.pola),
      });
    }
  }

  // Urutkan: yang memblokir dulu supaya tidak terlewat.
  temuan.sort((a, b) => (a.tingkat === b.tingkat ? 0 : a.tingkat === "blokir" ? -1 : 1));

  const blokir = temuan.filter((t) => t.tingkat === "blokir").length;
  const peringatan = temuan.length - blokir;
  const skor = Math.max(0, 100 - blokir * 30 - peringatan * 10);

  return { lulus: blokir === 0, skor, temuan, catatan: [...CATATAN_TETAP] };
}
