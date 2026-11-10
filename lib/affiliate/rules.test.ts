import { describe, expect, it } from "vitest";
import {
  ATURAN_MARKETPLACE,
  deteksiMarketplaceLink,
  labelMarketplace,
} from "./rules";

describe("deteksi marketplace dari link (Fase 4-A, versi manual)", () => {
  it("link kosong -> null", () => {
    expect(deteksiMarketplaceLink("")).toBeNull();
    expect(deteksiMarketplaceLink("   ")).toBeNull();
    expect(deteksiMarketplaceLink(undefined)).toBeNull();
  });

  it("shopee: produk dan shortlink", () => {
    expect(deteksiMarketplaceLink("https://shopee.co.id/kaos-premium-i.123.456")).toBe("shopee");
    expect(deteksiMarketplaceLink("https://s.shopee.co.id/xYz?utm=wa")).toBe("shopee");
  });

  it("tokopedia: produk dan shortlink", () => {
    expect(deteksiMarketplaceLink("https://www.tokopedia.com/tokobaju/kaos")).toBe("tokopedia");
    expect(deteksiMarketplaceLink("https://vt.tokopedia.com/abc12")).toBe("tokopedia");
  });

  it("tiktok shop", () => {
    expect(deteksiMarketplaceLink("https://www.tiktok.com/@toko/video/123")).toBe("tiktok");
    expect(deteksiMarketplaceLink("https://vt.tiktok.com/ZSabc/")).toBe("tiktok");
  });

  it("domain asing -> lainnya, huruf besar tetap terdeteksi", () => {
    expect(deteksiMarketplaceLink("https://tokopedia.com/X")).toBe("tokopedia");
    expect(deteksiMarketplaceLink("https://bukalapak.com/produk")).toBe("lainnya");
    expect(deteksiMarketplaceLink("https://SHOPEE.CO.ID/ABC")).toBe("shopee");
  });

  it("label UI: null untuk kosong, nama untuk lainnya", () => {
    expect(labelMarketplace("")).toBeNull();
    expect(labelMarketplace("https://s.shopee.co.id/x")).toBe("Shopee");
    expect(labelMarketplace("https://situs-lain.com/x")).toBe("Lainnya / tidak dikenali");
  });

  it("setiap marketplace punya instruksi dan label", () => {
    for (const kunci of ["shopee", "tokopedia", "tiktok", "lainnya"] as const) {
      expect(ATURAN_MARKETPLACE[kunci].label.length).toBeGreaterThan(0);
      expect(ATURAN_MARKETPLACE[kunci].instruksi.length).toBeGreaterThan(20);
    }
  });
});
