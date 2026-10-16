import { describe, expect, it } from "vitest";
import {
  cariAturanBerdasarkanUrl,
  programAffiliateSkema,
  type ProgramAffiliate,
} from "./skema";

describe("programAffiliateSkema", () => {
  it("memvalidasi data program affiliate yang benar", () => {
    const data = {
      id: "prog-1",
      nama_program: "Hostinger Affiliate",
      url: "https://hostinger.com?ref=123",
      catatan_aturan: "Dilarang menyebut brand di headline, wajib cantumkan kupon.",
      klik: 10,
      komisi: 50000,
    };
    const parsed = programAffiliateSkema.safeParse(data);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.nama_program).toBe("Hostinger Affiliate");
      expect(parsed.data.catatan_aturan).toContain("Dilarang menyebut brand");
    }
  });

  it("menolak URL tanpa protokol http atau https", () => {
    const data = {
      id: "prog-2",
      nama_program: "Shopee Affiliate",
      url: "shopee.co.id/affiliate",
    };
    const parsed = programAffiliateSkema.safeParse(data);
    expect(parsed.success).toBe(false);
  });

  it("mencari aturan berdasarkan kecocokan URL", () => {
    const daftar: ProgramAffiliate[] = [
      {
        id: "1",
        nama_program: "Hostinger",
        url: "https://hostinger.com",
        catatan_aturan: "Dilarang sebut kata 'termurah'.",
        klik: 0,
        komisi: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    expect(cariAturanBerdasarkanUrl(daftar, "https://hostinger.com/deals?ref=abc")).toBe(
      "Dilarang sebut kata 'termurah'.",
    );
    expect(cariAturanBerdasarkanUrl(daftar, "https://google.com")).toBeNull();
    expect(cariAturanBerdasarkanUrl(daftar, "")).toBeNull();
  });
});
