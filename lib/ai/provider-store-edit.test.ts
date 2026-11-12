process.env.AI_PROVIDER_SECRET = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

import { describe, expect, it } from "vitest";
import { rancangPembaruanProvider } from "./provider-store";

describe("rancangPembaruanProvider (edit provider, Gelombang 4)", () => {
  it("API key kosong/tidak dikirim = kunci lama dipertahankan (api_key_enc tidak ikut)", () => {
    const a = rancangPembaruanProvider({ model: "deepseek-flash" });
    expect("kolom" in a && "api_key_enc" in a.kolom).toBe(false);
    const b = rancangPembaruanProvider({ model: "deepseek-flash", apiKey: "" });
    expect("kolom" in b && "api_key_enc" in b.kolom).toBe(false);
    const c = rancangPembaruanProvider({ model: "deepseek-flash", apiKey: "   " });
    expect("kolom" in c && "api_key_enc" in c.kolom).toBe(false);
  });

  it("API key diisi = terenkripsi (bukan teks polos)", () => {
    const r = rancangPembaruanProvider({ apiKey: "sk-lh-contoh-kunci" });
    if (!("kolom" in r)) throw new Error("harus kolom");
    const enc = r.kolom.api_key_enc as string;
    expect(enc).not.toContain("sk-lh-contoh-kunci");
    expect(enc.split(":")).toHaveLength(3); // iv:tag:ciphertext
  });

  it("ganti model saja: kolom lain tidak ikut", () => {
    const r = rancangPembaruanProvider({ model: "gpt-4o-mini" });
    if (!("kolom" in r)) throw new Error("harus kolom");
    expect(Object.keys(r.kolom)).toEqual(["model"]);
    expect(r.kolom.model).toBe("gpt-4o-mini");
  });

  it("base URL divalidasi ulang (SSRF tetap ditolak saat edit)", () => {
    const r = rancangPembaruanProvider({ baseUrl: "http://localhost:20128/v1" });
    expect("error" in r).toBe(true);
  });

  it("base URL valid dinormalisasi (trailing slash dibuang)", () => {
    const r = rancangPembaruanProvider({ baseUrl: "https://ai.sumopod.com/v1/" });
    if (!("kolom" in r)) throw new Error("harus kolom");
    expect(r.kolom.base_url).toBe("https://ai.sumopod.com/v1");
  });

  it("isActive ikut, nama divalidasi", () => {
    const r = rancangPembaruanProvider({ isActive: false });
    if (!("kolom" in r)) throw new Error("harus kolom");
    expect(r.kolom.is_active).toBe(false);
    const s = rancangPembaruanProvider({ nama: "   " });
    expect("error" in s).toBe(true);
  });

  it("tidak ada perubahan = kolom kosong (ditolak di lapisan ubahProvider)", () => {
    const r = rancangPembaruanProvider({});
    expect("kolom" in r && Object.keys(r.kolom)).toEqual([]);
  });
});
