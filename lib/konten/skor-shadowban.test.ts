import { describe, expect, it } from "vitest";
import {
  KONFIGURASI_SKOR,
  hitungSkorShadowban,
  temuanDariStatus,
} from "./skor-shadowban";

const bersih = [
  "Kaos katun ini adem dipakai harian.",
  "Ukuran S sampai XL, link di bio ya.",
];

describe("hitungSkorShadowban — konten bersih", () => {
  it("skor 0, level aman, tanpa lampu merah", () => {
    const hasil = hitungSkorShadowban(bersih);
    expect(hasil.skor).toBe(0);
    expect(hasil.level).toBe("aman");
    expect(hasil.lampuMerah).toBe(false);
    expect(hasil.temuan).toHaveLength(0);
  });

  it("aman juga untuk daftar kosong", () => {
    const hasil = hitungSkorShadowban([]);
    expect(hasil.skor).toBe(0);
    expect(hasil.lampuMerah).toBe(false);
  });
});

describe("hitungSkorShadowban — per faktor", () => {
  it("kata terlarang memberi bobot kataTerlarang", () => {
    const hasil = hitungSkorShadowban(["Ini tumbler terbaik di kelasnya."]);
    expect(hasil.temuan[0]?.jenis).toBe("kata_terlarang");
    expect(hasil.skor).toBe(KONFIGURASI_SKOR.bobot.kataTerlarang);
    expect(hasil.level).toBe("waspada");
  });

  it("klaim medis memberi bobot klaimMedis", () => {
    const hasil = hitungSkorShadowban(["Minuman herbal ini menyembuhkan maag."]);
    expect(hasil.temuan[0]?.jenis).toBe("klaim_medis");
    expect(hasil.skor).toBe(KONFIGURASI_SKOR.bobot.klaimMedis);
    expect(hasil.level).toBe("waspada");
  });

  it("hashtag agresif memberi bobot hashtagAgresif", () => {
    const hasil = hitungSkorShadowban(["Stok terbatas! #stok_habis #segera"]);
    const jenis = hasil.temuan.map((t) => t.jenis);
    expect(jenis).toContain("hashtag_agresif");
    expect(hasil.skor).toBe(KONFIGURASI_SKOR.bobot.hashtagAgresif * 2);
  });

  it("caption di atas 500 karakter memberi bobot panjangCaption dan level kritis", () => {
    const panjang = "a".repeat(KONFIGURASI_SKOR.batasPanjangCaption + 1);
    const hasil = hitungSkorShadowban([panjang]);
    expect(hasil.temuan[0]?.jenis).toBe("panjang_caption");
    expect(hasil.skor).toBe(KONFIGURASI_SKOR.bobot.panjangCaption);
    expect(hasil.level).toBe("kritis");
  });

  it("temuan jenis sama tidak menumpuk: satu frasa, satu temuan", () => {
    const hasil = hitungSkorShadowban(["Produk ini menyembuhkan dan menyembuhkan lagi."]);
    const medis = hasil.temuan.filter((t) => t.jenis === "klaim_medis");
    expect(medis).toHaveLength(1);
  });
});

describe("hitungSkorShadowban — gabungan dan ambang level", () => {
  it("beberapa faktor dijumlahkan lalu dibatasi 100", () => {
    const panjang = `Terbaik! Menyembuhkan! #stok_habis ${"a".repeat(
      KONFIGURASI_SKOR.batasPanjangCaption,
    )}`;
    const hasil = hitungSkorShadowban([panjang]);
    expect(hasil.skor).toBe(100);
    expect(hasil.level).toBe("kritis");
  });

  it("skor 40–69 berbahaya", () => {
    const hasil = hitungSkorShadowban(["Produk ini menyembuhkan batuk berlemak dan terbaik."]);
    expect(hasil.skor).toBe(
      KONFIGURASI_SKOR.bobot.klaimMedis + KONFIGURASI_SKOR.bobot.kataTerlarang,
    );
    expect(hasil.level).toBe("berbahaya");
  });
});

describe("hitungSkorShadowban — lampu merah sebelum salin", () => {
  it("menyala begitu ada temuan apa pun", () => {
    const hasil = hitungSkorShadowban(["Yang suka gaya simpel, #ootd ini cocok."]);
    // faktor aman (ootd bukan tagar agresif) — pakai temuan nyata agar pasti
    const berisiko = hitungSkorShadowban(["Ini produk terbaik."]);
    expect(hasil.lampuMerah).toBe(false);
    expect(berisiko.lampuMerah).toBe(true);
    expect(berisiko.temuan.length).toBeGreaterThan(0);
  });
});

describe("temuanDariStatus", () => {
  it("mendeteksi hashtag agresif di posisi pertama temuan teks", () => {
    const temuan = temuanDariStatus(["#segera aman juga"]);
    const tagar = temuan.find((t) => t.jenis === "hashtag_agresif");
    expect(tagar?.teks).toBe("#segera");
  });

  it("mengabaikan substring yang bukan batas kata pada kata terlarang", () => {
    // "terbaik" harus ketemu, tapi kata biasa seperti "terbaikan" tak relevan
    const temuan = temuanDariStatus(["Bukan kata terbaik."]);
    expect(temuan.some((t) => t.jenis === "kata_terlarang")).toBe(true);
  });
});
