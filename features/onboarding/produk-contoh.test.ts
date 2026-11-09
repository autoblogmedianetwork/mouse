import { describe, expect, it } from "vitest";
import { productFormSchema } from "@/lib/produk/skema";
import { buatProdukContoh, DRAFT_POSTING_KEY } from "./produk-contoh";

describe("produk contoh onboarding (Fase 1 task C)", () => {
  it("lolos skema form produk manual", () => {
    const produk = buatProdukContoh();
    const hasil = productFormSchema.safeParse(produk);
    expect(hasil.success).toBe(true);
  });

  it("jelas ditandai sebagai contoh supaya mudah dikenali dan dihapus", () => {
    const produk = buatProdukContoh();
    expect(produk.nama_internal.toLowerCase()).toContain("contoh");
    expect(produk.deskripsi_bersih.length).toBeGreaterThanOrEqual(10);
    expect(produk.deskripsi_bersih).not.toMatch(/https?:\/\//);
    expect(produk.deskripsi_bersih).not.toMatch(/#/);
  });

  it("kunci draft sama dengan yang dipakai alur-buat-posting", () => {
    // features/posting/alur-buat-posting.tsx: DRAFT_KEY.
    expect(DRAFT_POSTING_KEY).toBe("autothreads-draft-posting");
  });
});
