import { describe, expect, it } from "vitest";
import { BATAS_PLATFORM } from "@/lib/platforms/batas";
import { kemasanMultiPlatform, potongAman } from "./kemasan-multi-platform";

const konten = {
  judul: "Tumbler pagi",
  statuses: ["Air panas tetap panas sampai jam makan siang.", "Tutupnya geser, aman di tas."],
  link_produk: "https://s.shopee.co.id/abc",
  letak_link: "status_terakhir" as const,
};

describe("kemasanMultiPlatform", () => {
  it("menyusun utas Threads utuh dan menambahkan link di caption TikTok/WA", () => {
    const hasil = kemasanMultiPlatform(konten);
    expect(hasil.threads).toBe(
      "Air panas tetap panas sampai jam makan siang.\n\nTutupnya geser, aman di tas.",
    );
    expect(hasil.tiktok).toContain("https://s.shopee.co.id/abc");
    expect(hasil.whatsapp).toContain("https://s.shopee.co.id/abc");
    expect(hasil.teks).toContain("=== UTAS THREADS (2 status) ===");
  });

  it("tidak menyertakan link bila letak link tanpa_link", () => {
    const hasil = kemasanMultiPlatform({ ...konten, letak_link: "tanpa_link" });
    expect(hasil.tiktok).not.toContain("shopee");
    expect(hasil.whatsapp).not.toContain("shopee");
  });

  it("menjaga caption TikTok dan status WA di bawah batas platform", () => {
    const panjang = "kata ".repeat(900).trim();
    const hasil = kemasanMultiPlatform({ ...konten, statuses: [panjang], link_produk: "" });
    expect(hasil.tiktok.length).toBeLessThanOrEqual(BATAS_PLATFORM.tiktok_caption);
    expect(hasil.whatsapp.length).toBeLessThanOrEqual(BATAS_PLATFORM.whatsapp_status);
  });
});

describe("potongAman", () => {
  it("mengembalikan teks apa adanya bila masih di bawah batas", () => {
    expect(potongAman("  halo dunia  ", 50)).toBe("halo dunia");
  });

  it("memotong di batas kata dan menambahkan elipsis", () => {
    const hasil = potongAman("satu dua tiga empat lima", 14);
    expect(hasil).toBe("satu dua tiga…");
    expect(hasil.length).toBeLessThanOrEqual(14);
  });
});
