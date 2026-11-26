import { describe, expect, it } from "vitest";
import {
  bahanSlideshowSkema,
  susunBahanSlideshow,
  type MasukanSlideshow,
} from "./bahan-slideshow";

const masukanDasar: MasukanSlideshow = {
  namaProduk: "Rice Cooker Miyako 1,8 L",
  hargaTampil: "Rp 189.000",
  urlAffiliate: "https://s.shopee.co.id/abc",
  suara: "id-ID-ArdiNeural",
  naskah: "Nasi hangat sepanjang hari tanpa ribet.\nKapasitas 1,8 liter, cukup untuk keluarga.",
  fotoUrls: "https://example.com/foto1.jpg\nhttps://example.com/foto2.jpg",
};

describe("susunBahanSlideshow", () => {
  it("menyusun JSON valid dari masukan normal", () => {
    const hasil = susunBahanSlideshow(masukanDasar);
    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    expect(hasil.jumlahScene).toBe(2);
    const bahan = JSON.parse(hasil.json);
    expect(bahan.versi).toBe(1);
    expect(bahan.produk.nama).toBe("Rice Cooker Miyako 1,8 L");
    expect(bahan.scene).toHaveLength(2);
    expect(bahan.keluaran.lebar).toBe(1080);
    expect(bahan.keluaran.tinggi).toBe(1920);
    expect(bahan.keluaran.nama_berkas).toMatch(/^slideshow-rice-cooker-miyako-1-8-l-\d{8}\.mp4$/);
  });

  it("foto dipakai bergantian bila jumlahnya lebih sedikit dari scene", () => {
    const hasil = susunBahanSlideshow({ ...masukanDasar, fotoUrls: "https://example.com/foto1.jpg" });
    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    const bahan = JSON.parse(hasil.json);
    expect(bahan.scene[0].foto_url).toBe("https://example.com/foto1.jpg");
    expect(bahan.scene[1].foto_url).toBe("https://example.com/foto1.jpg");
  });

  it("menolak nama produk kosong", () => {
    const hasil = susunBahanSlideshow({ ...masukanDasar, namaProduk: "  " });
    expect(hasil.ok).toBe(false);
    if (hasil.ok) return;
    expect(hasil.galat).toContain("nama produk");
  });

  it("menolak naskah kosong dan lebih dari 6 scene", () => {
    const kosong = susunBahanSlideshow({ ...masukanDasar, naskah: "\n \n" });
    expect(kosong.ok).toBe(false);
    if (kosong.ok) return;
    expect(kosong.galat).toContain("Naskah masih kosong");

    const tujuh = susunBahanSlideshow({
      ...masukanDasar,
      naskah: Array.from({ length: 7 }, (_, i) => `scene ${i + 1}`).join("\n"),
    });
    expect(tujuh.ok).toBe(false);
    if (tujuh.ok) return;
    expect(tujuh.galat).toContain("Maksimal 6 scene");
  });

  it("menolak URL foto yang tidak valid", () => {
    const hasil = susunBahanSlideshow({ ...masukanDasar, fotoUrls: "ftp://salah.com/foto.jpg" });
    expect(hasil.ok).toBe(false);
    if (hasil.ok) return;
    expect(hasil.galat).toContain("URL foto tidak valid");
  });

  it("menolak teks scene melebihi 220 karakter lewat skema", () => {
    const panjang = "a".repeat(221);
    const hasil = susunBahanSlideshow({ ...masukanDasar, naskah: panjang });
    expect(hasil.ok).toBe(false);
    if (hasil.ok) return;
    expect(hasil.galat).toContain("tidak valid");
  });

  it("skema menolak suara di luar daftar dan scene lebih dari 6", () => {
    const base = {
      versi: 1 as const,
      produk: { nama: "X", harga_tampil: "", url_affiliate: "" },
      suara: "id-ID-ArdiNeural" as const,
      scene: [
        { teks: "a", foto_url: "https://e.com/1.jpg", durasi_detik: 4 },
      ],
      keluaran: { lebar: 1080 as const, tinggi: 1920 as const, fps: 30 as const, nama_berkas: "x.mp4" },
    };
    expect(bahanSlideshowSkema.safeParse({ ...base, suara: "en-US-GuyNeural" }).success).toBe(false);
    expect(
      bahanSlideshowSkema.safeParse({
        ...base,
        scene: Array.from({ length: 7 }, (_, i) => ({
          teks: `s${i}`,
          foto_url: "https://e.com/1.jpg",
          durasi_detik: 4,
        })),
      }).success,
    ).toBe(false);
  });
});
