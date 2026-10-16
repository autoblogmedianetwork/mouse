import { describe, expect, it } from "vitest";
import {
  isiTemplateDenganContoh,
  KATEGORI_TEMPLATE,
  PLACEHOLDERS,
} from "@/app/(dashboard)/template/editor-template";

describe("editor-template", () => {
  it("menyediakan 4 kategori template standar", () => {
    expect(KATEGORI_TEMPLATE).toEqual([
      "Marketplace",
      "Hosting/SaaS",
      "Kursus",
      "Lainnya",
    ]);
  });

  it("menyediakan placeholder standar", () => {
    expect(PLACEHOLDERS).toContain("{{NAMA_PRODUK}}");
    expect(PLACEHOLDERS).toContain("{{MANFAAT}}");
    expect(PLACEHOLDERS).toContain("{{KEKURANGAN}}");
  });

  it("mengganti placeholder dengan data contoh saat preview", () => {
    const template = "Review {{NAMA_PRODUK}}: keunggulannya {{MANFAAT}}, tapi {{KEKURANGAN}}.";
    const hasil = isiTemplateDenganContoh(template);
    expect(hasil).toContain("Kaos polos cotton combed 30s");
    expect(hasil).toContain("adem dipakai seharian dan tidak mudah melar");
    expect(hasil).not.toContain("{{NAMA_PRODUK}}");
  });
});
