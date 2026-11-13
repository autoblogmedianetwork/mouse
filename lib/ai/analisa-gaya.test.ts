import { describe, expect, it } from "vitest";
import { MAKS_GAYA_BICARA, periksaTempelan, pisahPost, rapikanGayaBicara, ringkasAnalisa } from "./analisa-gaya";

const post = (n: number) =>
  Array.from({ length: n }, () => "jujur ya, aku dulu beli yang murah dan nyesel banget, sekarang beda").join("\n\n");

describe("analisa gaya (fungsi murni)", () => {
  it("pisahPost memisahkan berdasarkan baris kosong dan membuang yang kosong", () => {
    expect(pisahPost("satu\n\ndua\n\n\n\ntiga")).toEqual(["satu", "dua", "tiga"]);
    expect(pisahPost("")).toEqual([]);
  });

  it("periksaTempelan menolak kurang dari 3 post", () => {
    const r = periksaTempelan(post(2));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.alasan).toContain("minimal 3");
  });

  it("periksaTempelan menolak teks terlalu pendek walau 3 post", () => {
    const r = periksaTempelan("a\n\nb\n\nc");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.alasan).toContain("terlalu pendek");
  });

  it("periksaTempelan menerima 3 post yang cukup panjang", () => {
    const r = periksaTempelan(post(3));
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.jumlah).toBe(3);
  });

  it("rapikanGayaBicara memotong ke batas tanpa memotong kata", () => {
    const panjang = "kata ".repeat(120); // 600 karakter
    const hasil = rapikanGayaBicara(panjang);
    expect(hasil.length).toBeLessThanOrEqual(MAKS_GAYA_BICARA);
    expect(hasil.endsWith("kata")).toBe(true);
    expect(rapikanGayaBicara("  pendek   sekali  ")).toBe("pendek sekali");
  });

  it("ringkasAnalisa menyebut keyakinan dan nada", () => {
    const s = ringkasAnalisa({
      pola_kalimat: "pendek",
      pembuka: ["jujur ya"],
      nada: ["santai", "skeptis"],
      ciri_khas: ["sebut kekurangan duluan"],
      struktur: "masalah → cerita",
      catchphrase: ["everything is okay"],
      gaya_bicara: "santai",
      keyakinan: "tinggi",
      catatan: "",
    });
    expect(s).toContain("Keyakinan: tinggi");
    expect(s).toContain("santai, skeptis");
    expect(s).toContain("Ciri khas");
  });
});
