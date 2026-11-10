/**
 * Skor gabungan risiko shadowban tanpa API (ide #32).
 *
 * Empat faktor, masing-masing berbobot, dikumpulkan jadi skor 0-100 dan level.
 * Dipakai sebagai linting lokal sebelum konten disalin/dikirim: konten yang
 * menjejaki kata terlarang, hashtag agresif, klaim medis, atau caption terlalu
 * panjang bisa ditandai dengan lampu merah.
 */

import { MAX_STATUS_LENGTH } from "@/lib/statuses/validator-500";
import { periksaKataTerlarang } from "./kata-terlarang";

/** Ketentuan ambang per faktor; boleh diganti lewat ADR baru bila perlu. */
export const KONFIGURASI_SKOR = {
  /** Batas karakter per status (PRD Rule 10). */
  batasPanjangCaption: MAX_STATUS_LENGTH,

  /** Bobot per faktor (jumlah = 100), selaras dengan tingkat bahayanya. */
  bobot: {
    kataTerlarang: 35,
    klaimMedis: 30,
    hashtagAgresif: 20,
    panjangCaption: 15,
  },
} as const;

export type LevelShadowban = "aman" | "waspada" | "berbahaya" | "kritis";

/** Satu temuan yang ditampilkan ke user sebelum salin. */
export type TemuanShadowban = {
  jenis: "kata_terlarang" | "klaim_medis" | "hashtag_agresif" | "panjang_caption";
  /** Teks/frasa yang memicu temuan (atau jumlah karakter untuk caption). */
  teks: string;
  /** Alasan singkat berbahasa Indonesia untuk UI. */
  alasan: string;
};

export type HasilSkorShadowban = {
  skor: number;
  level: LevelShadowban;
  /** Menyala saat ada temuan apa pun; dipakai UI sebagai lampu merah. */
  lampuMerah: boolean;
  temuan: TemuanShadowban[];
};

/** Frasa klaim medis sengaja tidak beririsan dengan daftar kata terlarang. */
const FRASA_KLAIM_MEDIS = [
  "menyembuhkan",
  "mengobati",
  "sembuh total",
  "penyembuhan total",
  "ampuh sembuhkan",
  "menghilangkan penyakit",
] as const;

/** Tagar hard-sell/pemicu spam; dihitung per tagar unik. */
const TAGAR_AGRESIF = [
  "#stok_habis",
  "#segera",
  "#terbatas_waktu",
  "#hanya_hari_ini",
  "#jangan_sampai_kehabisan",
  "#borong_sekarang",
  "#diskon_besar",
] as const;

function temuanKataTerlarang(statuses: string[]): TemuanShadowban | null {
  const pertama = periksaKataTerlarang(statuses).temuan[0];
  if (!pertama) return null;
  return {
    jenis: "kata_terlarang",
    teks: pertama.rule.kata,
    alasan: pertama.rule.alasan,
  };
}

function temuanKlaimMedis(statuses: string[]): TemuanShadowban | null {
  for (const status of statuses) {
    const kecil = status.toLowerCase();
    for (const frasa of FRASA_KLAIM_MEDIS) {
      if (kecil.includes(frasa)) {
        return {
          jenis: "klaim_medis",
          teks: frasa,
          alasan: "Klaim khasiat medis perlu bukti dan rawan ditandai platform",
        };
      }
    }
  }
  return null;
}

function temuanHashtagAgresif(statuses: string[]): TemuanShadowban[] {
  const unik = new Set<string>();
  for (const status of statuses) {
    const kecil = status.toLowerCase();
    for (const tagar of TAGAR_AGRESIF) {
      if (kecil.includes(tagar)) unik.add(tagar);
    }
  }
  return [...unik].map((tagar) => ({
    jenis: "hashtag_agresif" as const,
    teks: tagar,
    alasan: "Tagar hard-sell mudah terbaca sebagai spam",
  }));
}

function temuanPanjangCaption(statuses: string[]): TemuanShadowban | null {
  for (const status of statuses) {
    if (status.length > KONFIGURASI_SKOR.batasPanjangCaption) {
      return {
        jenis: "panjang_caption",
        teks: `${status.length} karakter`,
        alasan: `Melebihi batas ${KONFIGURASI_SKOR.batasPanjangCaption} karakter per status`,
      };
    }
  }
  return null;
}

/** Semua temuan dari satu himpunan status, tanpa skor. */
export function temuanDariStatus(statuses: string[]): TemuanShadowban[] {
  const temuan: TemuanShadowban[] = [];
  const kata = temuanKataTerlarang(statuses);
  if (kata) temuan.push(kata);
  const medis = temuanKlaimMedis(statuses);
  if (medis) temuan.push(medis);
  temuan.push(...temuanHashtagAgresif(statuses));
  const panjang = temuanPanjangCaption(statuses);
  if (panjang) temuan.push(panjang);
  return temuan;
}

/** Skor 0-100, level, lampu merah, dan rincian temuan untuk satu konten. */
export function hitungSkorShadowban(statuses: string[]): HasilSkorShadowban {
  const temuan = temuanDariStatus(statuses);
  const { bobot } = KONFIGURASI_SKOR;

  const BOBOT_PER_JENIS: Record<TemuanShadowban["jenis"], number> = {
    kata_terlarang: bobot.kataTerlarang,
    klaim_medis: bobot.klaimMedis,
    hashtag_agresif: bobot.hashtagAgresif,
    panjang_caption: bobot.panjangCaption,
  };

  let skor = 0;
  for (const t of temuan) skor += BOBOT_PER_JENIS[t.jenis];
  skor = Math.min(100, skor);

  // Caption di atas batas platform sudah pelanggaran keras: level kritis.
  const adaPanjang = temuan.some((t) => t.jenis === "panjang_caption");
  const level: LevelShadowban = adaPanjang
    ? "kritis"
    : skor >= 70
      ? "kritis"
      : skor >= 40
        ? "berbahaya"
        : skor >= 1
          ? "waspada"
          : "aman";

  return { skor, level, lampuMerah: skor > 0, temuan };
}
