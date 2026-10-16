import { describe, expect, it } from "vitest";
import {
  apakahSudahAdaDisclosure,
  sisipkanDisclosure,
  terapkanDisclosureUtas,
} from "./disclosure";
import { charLength } from "@/lib/statuses/validator-500";

describe("disclosure affiliate", () => {
  it("mendeteksi jika status sudah punya disclosure", () => {
    expect(apakahSudahAdaDisclosure("Cek link di bio #iklan")).toBe(true);
    expect(apakahSudahAdaDisclosure("Gunakan kupon kami #affiliate")).toBe(true);
    expect(apakahSudahAdaDisclosure("Posting biasa tanpa tag")).toBe(false);
  });

  it("menyisipkan disclosure lengkap jika ruang masih cukup", () => {
    const teks = "Ini rekomendasi hosting terbaik.";
    const hasil = sisipkanDisclosure(teks, 500);
    expect(hasil).toContain("#iklan #affiliate");
    expect(charLength(hasil)).toBeLessThanOrEqual(500);
  });

  it("tidak menduplikasi disclosure jika sudah ada", () => {
    const teks = "Ini rekomendasi hosting #iklan";
    const hasil = sisipkanDisclosure(teks, 500);
    expect(hasil).toBe(teks);
  });

  it("menjaga batas ketat untuk platform X (280 karakter)", () => {
    const teksPanjang = "A".repeat(270);
    const hasil = sisipkanDisclosure(teksPanjang, 280);
    expect(charLength(hasil)).toBeLessThanOrEqual(280);
    expect(hasil).toContain("#iklan");
  });

  it("menjaga batas ketat untuk platform Threads (500 karakter)", () => {
    const teksPanjang = "K".repeat(495);
    const hasil = sisipkanDisclosure(teksPanjang, 500);
    expect(charLength(hasil)).toBeLessThanOrEqual(500);
    expect(hasil).toContain("#iklan");
  });

  it("hanya menambahkan disclosure ke status terakhir pada utas", () => {
    const utas = [
      "Status 1: Pengenalan masalah",
      "Status 2: Solusi fitur",
      "Status 3: Link pembelian ada di sini",
    ];
    const hasil = terapkanDisclosureUtas(utas, 500, true);
    expect(hasil[0]).toBe("Status 1: Pengenalan masalah");
    expect(hasil[1]).toBe("Status 2: Solusi fitur");
    expect(hasil[2]).toContain("#iklan #affiliate");
  });

  it("tidak mengubah apapun jika toggle aktif bernilai false", () => {
    const utas = ["Status 1", "Status 2"];
    const hasil = terapkanDisclosureUtas(utas, 500, false);
    expect(hasil).toEqual(utas);
  });
});
