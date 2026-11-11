import { describe, expect, it } from "vitest";
import type { Konten } from "./skema";
import { usulkanAutoIsi } from "./auto-isi";

const konten = (id: string, status: Konten["status"], jadwal?: string): Konten =>
  ({
    id,
    judul: `Konten ${id}`,
    produk_nama: "",
    ide_judul: "",
    statuses: ["isi"],
    status,
    letak_link: "balasan",
    gaya_hook: "bawaan",
    kerangka: "bebas",
    link_produk: "",
    arsip: false,
    arsip_at: null,
    skor: null,
    otomatis: false,
    checklist: {},
    jadwal_at: jadwal ?? null,
  }) as unknown as Konten;

const HARI_INI = new Date("2026-11-11T00:00:00");

describe("auto-isi kalender (power-up Kalender)", () => {
  it("tidak ada konten siap -> pesan jelas", () => {
    const hasil = usulkanAutoIsi([konten("a", "draft")], HARI_INI);
    expect(hasil.usulan).toHaveLength(0);
    expect(hasil.pesan).toContain("Tidak ada konten siap");
  });

  it("konten siap dipasangkan satu per hari mulai hari ini pukul 19:00", () => {
    const hasil = usulkanAutoIsi(
      [konten("a", "siap_posting"), konten("b", "siap_posting")],
      HARI_INI,
    );
    expect(hasil.usulan).toHaveLength(2);
    expect(hasil.usulan[0].id).toBe("a");
    const d0 = new Date(hasil.usulan[0].jadwalAt);
    expect(d0.getDate()).toBe(11);
    expect(d0.getHours()).toBe(19);
    const d1 = new Date(hasil.usulan[1].jadwalAt);
    expect(d1.getDate()).toBe(12);
  });

  it("hari yang sudah terisi dilewati", () => {
    const hasil = usulkanAutoIsi(
      [
        konten("sudah", "terjadwal", "2026-11-11T12:00:00Z"),
        konten("a", "siap_posting"),
        konten("b", "siap_posting"),
      ],
      HARI_INI,
    );
    expect(hasil.usulan).toHaveLength(2);
    const hari = hasil.usulan.map((u) => new Date(u.jadwalAt).getDate());
    expect(hari).not.toContain(11);
  });

  it("konten yang sudah punya jadwal tidak diusulkan ulang", () => {
    const hasil = usulkanAutoIsi(
      [konten("a", "siap_posting"), konten("b", "terjadwal", "2026-11-20T12:00:00Z")],
      HARI_INI,
    );
    expect(hasil.usulan).toHaveLength(1);
    expect(hasil.usulan[0].id).toBe("a");
  });
});
