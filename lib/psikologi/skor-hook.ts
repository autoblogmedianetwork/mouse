/**
 * Skor persuasi untuk satu status/konten — murni, tanpa AI, tanpa storage.
 *
 * Dipakai di tahap preview posting dan di Lab. Tujuannya bukan menilai "bagus
 * atau tidak", tapi menunjukkan prinsip mana yang sudah dipakai dan mana yang
 * belum, supaya penulis tahu harus menambah apa.
 *
 * Peringatan etis ikut dihitung: kalau teks memakai scarcity palsu atau
 * mengaku-ngaku otoritas, skornya diturunkan dan alasannya disebut, bukan
 * dibiarkan lolos karena "efektif".
 */
import { LABEL_PRINSIP, PRINSIP, type IdPrinsip, type IdPrinsipDilarang } from "./prinsip";

export interface HasilPsikologi {
  skor: number;
  label: "kuat" | "cukup" | "lemah";
  terpakai: IdPrinsip[];
  belum: IdPrinsip[];
  /** Cuplikan teks yang memicu tiap prinsip, untuk ditunjukkan ke penulis. */
  bukti: Partial<Record<IdPrinsip, string>>;
  peringatan: Array<{ id: IdPrinsipDilarang; pesan: string }>;
  saran: string[];
}

/** Pola penanda per prinsip. Semua dicocokkan tanpa membedakan huruf besar. */
const PENANDA: Record<IdPrinsip, RegExp> = {
  // Angka plus satuan nyata, atau nominal rupiah.
  spesifik: /(\d+\s?(ml|liter|l|gram|gr|kg|cm|mm|jam|hari|bulan|tahun|watt|mah|rb|ribu|juta))|(rp\s?\d)/i,
  loss_aversion: /(sayang|nyesel|rugi|keburu|kehabisan|jangan sampai|kemaleman|ketinggalan|buang duit)/i,
  social_proof: /(aku sendiri|saya sendiri|banyak yang|kebanyakan orang|banyak orang|udah nyoba|sudah nyoba|yang lain juga|rame|temenku|temanku)/i,
  curiosity: /(\?|kenapa|gimana|ternyata|padahal|nyangka|gak kepikiran|bukan yang kamu kira)/i,
  kesesuaian: /(buat (yang|kamu yang|anak|ibu|bapak|mahasiswa|yang kerja|yang kos|yang sering))|(cocok buat)|(kalau kamu (kerja|sering|tinggal|punya))/i,
  kontras: /(dulu|sebelumnya|awalnya|sekarang|sejak|beda|berubah)/i,
};

/** Pola pelanggaran. Sengaja longgar: lebih baik memberi peringatan salah daripada lolos. */
const PELANGGARAN: Array<{ id: IdPrinsipDilarang; pola: RegExp; pesan: string }> = [
  {
    id: "scarcity_palsu",
    pola: /(sisa\s+\d+)|(tinggal\s+\d+\s+(lagi|pcs|buah))|(stok\s+(terbatas|habis|tipis))|(kuota\s+habis)/i,
    pesan:
      "Kamu menyebut jumlah stok. Tulis hanya kalau itu benar dan bisa kamu buktikan; kalau tidak, hapus — klaim stok karangan termasuk clickbait yang dilarang.",
  },
  {
    id: "otoritas_tanpa_dasar",
    pola: /(kata\s+(dokter|ahli|pakar|profesor))|(menurut\s+(dokter|ahli|pakar))|(sudah\s+diteliti)|(terbukti\s+secara\s+ilmiah)|(direkomendasikan\s+dokter)/i,
    pesan:
      "Ada klaim otoritas. Sebut sumbernya yang bisa dicek, atau hapus. Untuk klaim kesehatan, jangan tulis sama sekali.",
  },
  {
    id: "urgensi_karangan",
    pola: /(buruan|detik ini|hari ini doang|hanya hari ini|cuma hari ini|jangan sampai kehabisan|sebelum kehabisan)/i,
    pesan:
      "Ada desakan waktu. Pastikan memang ada batas waktu nyata (promo resmi, tanggal berakhir). Kalau tidak ada, ganti dengan alasan yang jujur.",
  },
];

/** Potong cuplikan supaya UI tetap ringkas. */
function cuplik(teks: string, pola: RegExp): string {
  const cocok = teks.match(pola);
  if (!cocok) return "";
  const mulai = Math.max(0, (cocok.index ?? 0) - 24);
  const akhir = Math.min(teks.length, (cocok.index ?? 0) + cocok[0].length + 24);
  return `${mulai > 0 ? "…" : ""}${teks.slice(mulai, akhir).trim()}${akhir < teks.length ? "…" : ""}`;
}

function labelDariSkor(skor: number): HasilPsikologi["label"] {
  if (skor >= 70) return "kuat";
  if (skor >= 45) return "cukup";
  return "lemah";
}

/**
 * Nilai satu teks. Skor dasar 20, tiap prinsip yang terpakai menambah 12
 * (maksimal 72), bonus 8 kalau ada dua prinsip angka/detail sekaligus,
 * lalu dipotong 15 per pelanggaran. Dijepit 0–100.
 */
export function nilaiPsikologi(teks: string): HasilPsikologi {
  const bahan = (teks ?? "").trim();

  if (bahan === "") {
    return {
      skor: 0,
      label: "lemah",
      terpakai: [],
      belum: PRINSIP.map((p) => p.id),
      bukti: {},
      peringatan: [],
      saran: ["Tulis dulu kontennya, baru diuji."],
    };
  }

  const terpakai: IdPrinsip[] = [];
  const bukti: Partial<Record<IdPrinsip, string>> = {};

  for (const p of PRINSIP) {
    const pola = PENANDA[p.id];
    if (pola.test(bahan)) {
      terpakai.push(p.id);
      bukti[p.id] = cuplik(bahan, pola);
    }
  }

  const peringatan: HasilPsikologi["peringatan"] = [];
  for (const l of PELANGGARAN) {
    if (l.pola.test(bahan)) peringatan.push({ id: l.id, pesan: l.pesan });
  }

  const belum = PRINSIP.map((p) => p.id).filter((id) => !terpakai.includes(id));

  let skor = 20 + terpakai.length * 12;
  if (terpakai.includes("spesifik") && terpakai.includes("kesesuaian")) skor += 8;
  skor -= peringatan.length * 15;
  skor = Math.max(0, Math.min(100, Math.round(skor)));

  const saran: string[] = [];
  for (const id of belum) {
    const p = PRINSIP.find((x) => x.id === id);
    if (p) saran.push(`${LABEL_PRINSIP[id]}: ${p.cara}`);
  }
  if (saran.length === 0) saran.push("Semua prinsip dasar sudah dipakai. Cek ulang apakah klaimnya masih jujur.");
  if (peringatan.length > 0) {
    saran.unshift("Perbaiki peringatan di bawah dulu — skornya turun karena itu.");
  }

  return { skor, label: labelDariSkor(skor), terpakai, belum, bukti, peringatan, saran };
}

/** Skor saja, untuk tempat yang tidak butuh rincian (mis. ringkasan daftar). */
export function skorPsikologi(teks: string): number {
  return nilaiPsikologi(teks).skor;
}
