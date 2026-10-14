import { describe, expect, it } from "vitest";
import { agregasiGenerations, batasBatasUsd, type BarisGenerasi } from "./statistik";

const SEKARANG = new Date("2026-10-14T09:30:00+00:00");
const BATAS = 5;

function baris(parsial: Partial<BarisGenerasi>): BarisGenerasi {
  return {
    jenis: "analisis",
    status: "done",
    biaya_usd: null,
    input_tokens: 100,
    output_tokens: 50,
    created_at: "2026-10-14T01:00:00+00:00",
    ...parsial,
  };
}

describe("batasBatasUsd", () => {
  it("env valid dipakai", () => {
    expect(batasBatasUsd("3.5")).toBe(3.5);
  });

  it("env kosong/rusak mengembalikan bawaan 5", () => {
    expect(batasBatasUsd(undefined)).toBe(5);
    expect(batasBatasUsd("")).toBe(5);
    expect(batasBatasUsd("nol")).toBe(5);
    // Nol atau negatif tidak masuk akal sebagai batas, pakai bawaan.
    expect(batasBatasUsd("0")).toBe(5);
    expect(batasBatasUsd("-2")).toBe(5);
  });
});

describe("agregasiGenerations", () => {
  it("log kosong: tanpa catatan, nol token, tanpa biaya", () => {
    const hasil = agregasiGenerations([], BATAS, SEKARANG);
    expect(hasil).toEqual({
      hariIniUsd: null,
      bulanIniUsd: null,
      adaCatatan: false,
      batasUsd: BATAS,
      persenBulan: 0,
      perFungsi: {},
      totalTokens: 0,
    });
  });

  it("baris milik tanggal biasa (numeric string dari PostgREST) dijumlah", () => {
    const hasil = agregasiGenerations(
      [
        baris({ biaya_usd: "0.02" }),
        baris({ biaya_usd: "0.01", jenis: "generate" }),
      ],
      BATAS,
      SEKARANG,
    );
    expect(hasil.hariIniUsd).toBeCloseTo(0.03);
    expect(hasil.bulanIniUsd).toBeCloseTo(0.03);
    expect(hasil.adaCatatan).toBe(true);
    expect(hasil.persenBulan).toBeCloseTo(0.6);
    expect(hasil.totalTokens).toBe(300);
  });

  it("baris sebelum awal bulan diabaikan", () => {
    // Zona waktu lokalis diperbolehkan: mulai bulan bisa jadi 30 Sep di UTC
    // (mis. UTC+14), jadi pakai tanggal yang aman untuk semua offset.
    const hasil = agregasiGenerations(
      [
        baris({ biaya_usd: "0.2", created_at: "2026-09-15T12:00:00+00:00" }),
        baris({ biaya_usd: "0.05", created_at: "2026-09-01T00:00:00+00:00" }),
      ],
      BATAS,
      SEKARANG,
    );
    expect(hasil.adaCatatan).toBe(false);
    expect(hasil.bulanIniUsd).toBeNull();
    expect(hasil.persenBulan).toBe(0);
  });

  it("biaya_usd null dihitung tapi tidak menambah nominal", () => {
    const hasil = agregasiGenerations(
      [baris({ biaya_usd: null }), baris({ biaya_usd: "0.10" })],
      BATAS,
      SEKARANG,
    );
    expect(hasil.adaCatatan).toBe(true);
    expect(hasil.bulanIniUsd).toBeCloseTo(0.1);
    expect(hasil.totalTokens).toBe(300);
  });

  it("per fungsi: panggilan, total, rata-rata", () => {
    const hasil = agregasiGenerations(
      [
        baris({ jenis: "analisis", biaya_usd: "0.02" }),
        baris({ jenis: "analisis", biaya_usd: "0.04" }),
        baris({ jenis: "generate", biaya_usd: "0.02" }),
      ],
      BATAS,
      SEKARANG,
    );
    expect(hasil.perFungsi.analisis).toEqual({
      panggilan: 2,
      usd: 0.06,
      inputTokens: 200,
      outputTokens: 100,
      rataRata: 0.03,
    });
    expect(hasil.perFungsi.generate?.panggilan).toBe(1);
  });

  it("semuanya gratis (biaya null) tetap rata-rata null, bukan 0", () => {
    const hasil = agregasiGenerations(
      [baris({ biaya_usd: null }), baris({ biaya_usd: null })],
      BATAS,
      SEKARANG,
    );
    expect(hasil.bulanIniUsd).toBeNull();
    expect(hasil.perFungsi.analisis?.rataRata).toBeNull();
    expect(hasil.perFungsi.analisis?.panggilan).toBe(2);
  });

  it("persen dijepit ke 100 saat biaya melewati batas", () => {
    const hasil = agregasiGenerations([baris({ biaya_usd: "7.5" })], BATAS, SEKARANG);
    expect(hasil.persenBulan).toBe(100);
  });

  it("batas nol tidak membagi dengan nol", () => {
    const hasil = agregasiGenerations([baris({ biaya_usd: "0.01" })], 0, SEKARANG);
    expect(hasil.persenBulan).toBe(0);
  });

  it("jenis kosong jatuh ke bucket 'lainnya' dan tidak melempar", () => {
    const hasil = agregasiGenerations([baris({ jenis: "" })], BATAS, SEKARANG);
    expect(hasil.perFungsi.lainnya?.panggilan).toBe(1);
  });
});
