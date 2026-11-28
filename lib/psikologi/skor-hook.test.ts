import { describe, expect, it } from "vitest";
import { nilaiPsikologi, skorPsikologi } from "./skor-hook";
import { PRINSIP, PRINSIP_DILARANG } from "./prinsip";

describe("nilaiPsikologi", () => {
  it("teks kosong dapat 0 dan menyuruh menulis dulu", () => {
    const hasil = nilaiPsikologi("   ");
    expect(hasil.skor).toBe(0);
    expect(hasil.label).toBe("lemah");
    expect(hasil.belum).toHaveLength(PRINSIP.length);
    expect(hasil.saran[0]).toContain("Tulis dulu");
  });

  it("mendeteksi angka dan detail", () => {
    const hasil = nilaiPsikologi("Tumbler 750 ml ini tahan panas 12 jam.");
    expect(hasil.terpakai).toContain("spesifik");
    expect(hasil.bukti.spesifik).toBeTruthy();
  });

  it("mendeteksi nominal rupiah sebagai detail", () => {
    expect(nilaiPsikologi("Harganya cuma Rp89 ribu.").terpakai).toContain("spesifik");
  });

  it("mendeteksi kesesuaian audiens", () => {
    const hasil = nilaiPsikologi("Cocok buat yang kerja shift malam.");
    expect(hasil.terpakai).toContain("kesesuaian");
  });

  it("mendeteksi rasa kehilangan", () => {
    expect(nilaiPsikologi("Sayang kalau dilewat, nanti nyesel.").terpakai).toContain("loss_aversion");
  });

  it("mendeteksi bukti orang lain", () => {
    expect(nilaiPsikologi("Aku sendiri pakai dua bulan, aman.").terpakai).toContain("social_proof");
  });

  it("konten dengan banyak prinsip dapat skor lebih tinggi dari konten datar", () => {
    const kaya = nilaiPsikologi(
      "Aku sendiri pakai tumbler 750 ml ini tiap hari. Dulu botolku bocor di tas, sekarang aman. Cocok buat yang kerja shift.",
    );
    const datar = nilaiPsikologi("Ini produk bagus untuk semua orang.");
    expect(kaya.skor).toBeGreaterThan(datar.skor);
    expect(kaya.label).not.toBe("lemah");
  });

  it("memberi peringatan untuk scarcity karangan dan menurunkan skor", () => {
    const dasar = "Tumbler 750 ml, cocok buat yang kerja lapangan.";
    const ditambah = `${dasar} Sisa 3 lagi, buruan!`;
    const a = nilaiPsikologi(dasar);
    const b = nilaiPsikologi(ditambah);
    expect(b.peringatan.map((p) => p.id)).toContain("scarcity_palsu");
    expect(b.peringatan.map((p) => p.id)).toContain("urgensi_karangan");
    expect(b.skor).toBeLessThan(a.skor);
    expect(b.saran[0]).toContain("Perbaiki peringatan");
  });

  it("memberi peringatan untuk klaim otoritas tanpa sumber", () => {
    const hasil = nilaiPsikologi("Kata dokter, produk ini bagus untuk kulit.");
    expect(hasil.peringatan.map((p) => p.id)).toContain("otoritas_tanpa_dasar");
  });

  it("skor tidak pernah keluar dari 0-100", () => {
    const penuh = nilaiPsikologi(
      "Aku sendiri pakai 750 ml tahan 12 jam. Dulu bocor, sekarang aman. Cocok buat yang kerja shift. Kenapa? Karena tutupnya kunci. Sayang kalau dilewat.",
    );
    expect(penuh.skor).toBeLessThanOrEqual(100);
    const buruk = nilaiPsikologi("Sisa 2 lagi! Kata ahli terbukti secara ilmiah. Buruan detik ini!");
    expect(buruk.skor).toBeGreaterThanOrEqual(0);
  });

  it("saran menyebut prinsip yang belum dipakai", () => {
    const hasil = nilaiPsikologi("Tumbler 750 ml.");
    expect(hasil.belum.length).toBeGreaterThan(0);
    expect(hasil.saran.join(" ")).toMatch(/Angka dan detail|Bukti orang lain|Rasa kehilangan/);
  });

  it("skorPsikologi sama dengan nilai lengkap", () => {
    const teks = "Botol 1 liter, tahan 12 jam.";
    expect(skorPsikologi(teks)).toBe(nilaiPsikologi(teks).skor);
  });

  it("daftar prinsip dilarang selalu punya alasan", () => {
    for (const p of PRINSIP_DILARANG) {
      expect(p.akibat.length).toBeGreaterThan(20);
    }
  });
});
