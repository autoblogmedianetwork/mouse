/**
 * Validator JSON tempelan ChatGPT. Struktur rusak harus ditolak dengan pesan
 * yang bisa dibaca; masalah gaya hanya jadi peringatan supaya user tetap bisa
 * lanjut menyalin prompt.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { hitungKata, periksaPeringatan, validasiStoryboard } from "./storyboard";

const fixture = readFileSync(new URL("../../tests/fixtures/storyboard-contoh.json", import.meta.url), "utf8");

describe("validasiStoryboard", () => {
  it("menerima JSON valid dari fixture", () => {
    const hasil = validasiStoryboard(fixture);
    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    expect(hasil.storyboard.scenes).toHaveLength(3);
    expect(hasil.storyboard.scenes[0].teks_layar).toBe("Nasi cepat dingin?");
  });

  it("membersihkan pagar markdown dari ChatGPT", () => {
    const hasil = validasiStoryboard("```json\n" + fixture + "\n```");
    expect(hasil.ok).toBe(true);
  });

  it("menerima nama kolom dari Template-Video-Affiliate (deskripsi_visual, kamera, id)", () => {
    const hasil = validasiStoryboard(
      JSON.stringify({
        scenes: [
          { id: 1, durasi: 4, deskripsi_visual: "Produk di meja", kamera: "pan kanan", teks: "Coba ini" },
          { id: 2, durasi: 6, deskripsi_visual: "Produk dipakai", kamera: "close up", teks: "Praktis" },
        ],
      }),
    );
    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    expect(hasil.storyboard.scenes[0]).toMatchObject({
      urutan: 1,
      durasi_detik: 4,
      visual: "Produk di meja",
      gerakan_kamera: "pan kanan",
      teks_layar: "Coba ini",
      narasi: null,
    });
  });

  it("menolak teks kosong", () => {
    const hasil = validasiStoryboard("   ");
    expect(hasil).toEqual({ ok: false, error: "Tempel dulu JSON storyboard dari ChatGPT." });
  });

  it("menolak teks yang bukan JSON", () => {
    const hasil = validasiStoryboard("Ini storyboard saya: adegan pertama produk muncul.");
    expect(hasil.ok).toBe(false);
    if (hasil.ok) return;
    expect(hasil.error).toContain("bukan JSON");
  });

  it("menolak scene tanpa deskripsi visual", () => {
    const hasil = validasiStoryboard(
      JSON.stringify({ scenes: [{ durasi_detik: 3, visual: "  " }] }),
    );
    expect(hasil.ok).toBe(false);
    if (hasil.ok) return;
    expect(hasil.error).toContain("visual");
  });

  it("menolak durasi nol", () => {
    const hasil = validasiStoryboard(
      JSON.stringify({ scenes: [{ durasi_detik: 0, visual: "Produk" }] }),
    );
    expect(hasil.ok).toBe(false);
  });

  it("memberi peringatan saat durasi scene tidak sama dengan durasi total", () => {
    const hasil = validasiStoryboard(fixture);
    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    const salah = { ...hasil.storyboard, durasi_total_detik: 12 };
    expect(periksaPeringatan(salah).join(" ")).toContain("berjumlah 10 detik, tetapi tertulis 12");
  });

  it("memberi peringatan saat teks layar lebih dari 8 kata", () => {
    const hasil = validasiStoryboard(
      JSON.stringify({
        scenes: [
          {
            durasi_detik: 10,
            visual: "Produk",
            teks_layar: "satu dua tiga empat lima enam tujuh delapan sembilan",
          },
        ],
      }),
    );
    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    expect(hasil.peringatan.join(" ")).toContain("teks layar 9 kata");
  });

  it("memberi peringatan saat narasi melebihi 2 kata per detik", () => {
    const hasil = validasiStoryboard(
      JSON.stringify({
        scenes: [
          {
            durasi_detik: 2,
            visual: "Produk",
            narasi: "nasi hangat tetap enak sampai jam makan siang",
          },
        ],
      }),
    );
    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    expect(hasil.peringatan.join(" ")).toContain("narasi 8 kata untuk 2 detik");
  });

  it("menyebut klaim yang perlu dicek sebagai peringatan, bukan error", () => {
    const hasil = validasiStoryboard(fixture);
    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    expect(hasil.peringatan.join(" ")).toContain("warm 12 jam sesuai deskripsi");
  });
});

describe("hitungKata", () => {
  it("menghitung nol untuk teks kosong", () => {
    expect(hitungKata("")).toBe(0);
    expect(hitungKata(null)).toBe(0);
  });

  it("mengabaikan spasi berlebih", () => {
    expect(hitungKata("  nasi   hangat  ")).toBe(2);
  });
});
