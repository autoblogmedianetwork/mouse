import { describe, expect, it } from "vitest";
import { buildAdIklanMetaPrompt, PROMPT_VERSION } from "./ad-iklan-meta.v1";
import { ATURAN_BAHASA } from "@/lib/ai/gaya-bahasa";

describe("prompt iklan Meta v1", () => {
  const dasar = { produk: "Tumbler stainless 750ml", harga: "150000", komisiPersen: 8 };

  it("menyisipkan data produk ke dalam prompt", () => {
    const keluaran = buildAdIklanMetaPrompt(dasar);
    expect(keluaran).toContain("Tumbler stainless 750ml");
    expect(keluaran).toContain("150000");
    expect(keluaran).toContain("8%");
  });

  it("memakai penanda default saat harga dan komisi kosong", () => {
    const keluaran = buildAdIklanMetaPrompt({ produk: "Botol minum" });
    expect(keluaran).toContain("(tidak disebutkan)");
    expect(keluaran).toContain("5%");
  });

  it("menyertakan aturan bahasa bersama dan tuntutan tiga varian", () => {
    const keluaran = buildAdIklanMetaPrompt(dasar);
    expect(keluaran).toContain(ATURAN_BAHASA);
    expect(keluaran).toContain("3 VARIAN");
    expect(keluaran).toContain('"varian"');
  });

  it("memuat pagar kepatuhan Shopee Affiliate", () => {
    const keluaran = buildAdIklanMetaPrompt(dasar);
    expect(keluaran).toContain("TIDAK BOLEH menyebut nama marketplace");
    expect(keluaran).toContain("#publi");
    expect(keluaran).toContain("clickbait");
  });

  it("versinya tetap v1 agar tidak menimpa riwayat (rule 13)", () => {
    expect(PROMPT_VERSION).toBe("iklan-meta.v1");
  });
});
