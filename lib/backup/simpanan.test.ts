import { beforeEach, describe, expect, it } from "vitest";
import {
  CADANGAN_AWALAN,
  kumpulkanCadangan,
  pulihkanCadangan,
  validasiBerkasCadangan,
} from "./simpanan";

const simpan = new Map<string, string>();

beforeEach(() => {
  simpan.clear();
  simpan.set("autothreads-konten", "[{\"id\":\"k1\"}]");
  simpan.set("autothreads-pengaturan", "{\"sebut_kekurangan\":true}");
  simpan.set("bukan-milik-aplikasi", "rahasia lain");
});

const baca = (k: string) => simpan.get(k) ?? null;
const tulis = (k: string, v: string) => void simpan.set(k, v);

describe("cadangan data localStorage (Fase 4-B)", () => {
  it("kumpulkan hanya kunci milik aplikasi, data lain tidak ikut", () => {
    const hasil = kumpulkanCadangan(baca, ["autothreads-konten", "autothreads-pengaturan"]);
    expect(hasil.ok).toBe(true);
    expect(hasil.berkas?.jumlah_kunci).toBe(2);
    expect(Object.keys(hasil.berkas?.isi ?? {})).not.toContain("bukan-milik-aplikasi");
  });

  it("tidak ada data -> jujur bilang kosong", () => {
    const hasil = kumpulkanCadangan(baca, []);
    expect(hasil.ok).toBe(false);
    expect(hasil.pesan).toContain("Belum ada data");
  });

  it("validasi: JSON rusak atau bentuk salah ditolak", () => {
    expect(validasiBerkasCadangan("bukan json")).toBeNull();
    expect(validasiBerkasCadangan("{\"versi\":1,\"isi\":{\"a\":123}}")).toBeNull();
    expect(validasiBerkasCadangan("{\"isi\":{}}")).toBeNull();
  });

  it("validasi: berkas sah diterima", () => {
    const berkas = validasiBerkasCadangan(
      JSON.stringify({ versi: 1, dibuat: "2026-11-10", isi: { "autothreads-konten": "[]" } }),
    );
    expect(berkas).not.toBeNull();
    expect(berkas?.jumlah_kunci).toBe(1);
  });

  it("pulihkan: kunci asing di cadangan diabaikan, data kembali", () => {
    const berkas = {
      versi: 1,
      dibuat: "2026-11-10",
      jumlah_kunci: 2,
      isi: {
        "autothreads-konten": "[{\"id\":\"k9\"}]",
        "autothreads-pengaturan": "{}",
        "bukan-milik-aplikasi": "jangan ditulis",
      },
    };
    const hasil = pulihkanCadangan(berkas, tulis);
    expect(hasil.ok).toBe(true);
    expect(hasil.dipulihkan).toBe(2);
    expect(simpan.get("autothreads-konten")).toBe("[{\"id\":\"k9\"}]");
    expect(simpan.get("bukan-milik-aplikasi")).toBe("rahasia lain");
  });

  it("pulihkan: berkas tanpa kunci aplikasi gagal dengan pesan jelas", () => {
    const hasil = pulihkanCadangan(
      { versi: 1, dibuat: "", jumlah_kunci: 1, isi: { "bukan-milik-aplikasi": "x" } },
      tulis,
    );
    expect(hasil.ok).toBe(false);
    expect(hasil.dipulihkan).toBe(0);
  });

  it("awalan konsisten", () => {
    expect(CADANGAN_AWALAN).toBe("autothreads-");
  });
});
