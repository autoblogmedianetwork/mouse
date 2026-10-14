/** Schedule rules (Fase 6, UI-Spec 2.5/3.4). */
import { describe, expect, it } from "vitest";
import { kontenSkema, type Konten } from "./skema";
import { batalkanJadwal, jadwalkanKonten, pindahJadwal } from "./store";
import {
  hariMinggu,
  jadwalBulanIni,
  kelompokkanPerHari,
  kontenTerjadwal,
  mulaiMinggu,
  pindahKeHari,
} from "./kalender";

function buat(parsial: Partial<Konten> = {}): Konten {
  return kontenSkema.parse({
    id: `k-${Math.random().toString(36).slice(2, 8)}`,
    judul: "Judul",
    statuses: ["Status utama"],
    status: "siap_posting",
    letak_link: "tanpa_link",
    created_at: "2026-10-01T00:00:00.000Z",
    updated_at: "2026-10-01T00:00:00.000Z",
    ...parsial,
  });
}

// Kamis, 15 Oktober 2026 09:00 UTC. Senin lokal (UTC) = 12 Okt.
const NOW = new Date("2026-10-15T09:00:00+00:00");

describe("mulaiMinggu & hariMinggu", () => {
  it("minggu mulai Senin tengah malam lokal, betapapun hari sekarang", () => {
    const mulai = mulaiMinggu(NOW);
    expect(mulai.getHours()).toBe(0); // tengah malam lokal mesin
    expect(mulai.getDay()).toBe(1); // Senin
    expect(hariMinggu(mulai, NOW)[0].label.startsWith("Sen")).toBe(true);
    expect(hariMinggu(mulai, NOW)[6].label.startsWith("Min")).toBe(true);
  });

  it("Minggu (getDay 0) tetap masuk minggu yang sama, bukan maju", () => {
    const mulaiKamis = mulaiMinggu(NOW);
    const mulaiMingguResp = mulaiMinggu(new Date("2026-10-18T09:00:00+00:00")); // Minggu
    expect(mulaiMingguResp.getTime()).toBe(mulaiKamis.getTime());
  });

  it("hariIni ditandai hanya untuk hari kalender ini", () => {
    const hari = hariMinggu(undefined, NOW);
    expect(hari.filter((h) => h.hariIni)).toHaveLength(1);
    expect(hari.find((h) => h.hariIni)?.kunci).toBe(new Date(NOW).toISOString().slice(0, 10));
  });
});

describe("kontenTerjadwal & kelompokkanPerHari", () => {
  it("hanya status terjadwal dengan jadwal_at efektif", () => {
    const list = [
      buat({ id: "a", status: "terjadwal", jadwal_at: "2026-10-15T06:00:00+00:00" }),
      buat({ id: "b", status: "siap_posting", jadwal_at: "2026-10-15T05:00:00+00:00" }),
      buat({ id: "c", status: "terjadwal", jadwal_at: null }),
      buat({ id: "d", status: "terjadwal", jadwal_at: "bukan-iso" }),
      buat({ id: "e", status: "terjadwal", jadwal_at: "2026-10-14T04:00:00+00:00" }),
    ];
    const hasil = kontenTerjadwal(list);
    expect(hasil.map((k) => k.id)).toEqual(["e", "a"]); // urut waktu naik
  });

  it("baris di luar minggu tidak muncul di kartu", () => {
    const hari = hariMinggu(undefined, NOW);
    const list = [
      buat({ id: "dalam", status: "terjadwal", jadwal_at: "2026-10-15T02:00:00+00:00" }),
      buat({ id: "luar", status: "terjadwal", jadwal_at: "2026-10-25T06:00:00+00:00" }),
    ];
    const peta = kelompokkanPerHari(list, hari);
    // Kartu hari ini (NOW) adalah tempat "dalam" seharusnya muncul.
    const kartuHariIni = hari.find((h) => h.hariIni)!;
    expect((peta.get(kartuHariIni.kunci) ?? []).map((k) => k.id)).toEqual(["dalam"]);
    expect([...peta.keys()].length).toBe(1);
  });
});

describe("jadwalBulanIni", () => {
  it("hanya jadwal pada bulan berjalan", () => {
    const list = [
      buat({ id: "a", status: "terjadwal", jadwal_at: "2026-10-15T06:00:00+00:00" }),
      buat({ id: "b", status: "terjadwal", jadwal_at: "2026-11-02T06:00:00+00:00" }),
    ];
    expect(jadwalBulanIni(list, NOW).map((k) => k.id)).toEqual(["a"]);
  });
});

describe("jadwalkanKonten (store)", () => {
  it("siap_posting -> terjadwal dengan jadwal_at dipertahankan", () => {
    const asal = [buat({ id: "a", status: "siap_posting" })];
    const hasil = jadwalkanKonten(asal, "a", "2026-10-16T02:00:00.000Z");
    expect(hasil.ok).toBe(true);
    expect(hasil.list[0].status).toBe("terjadwal");
    expect(hasil.list[0].jadwal_at).toBe("2026-10-16T02:00:00.000Z");
  });

  it("menolak konten bukan siap_posting (PRD: tidak ada auto-nudge)", () => {
    const asal = [buat({ id: "a", status: "draft" })];
    const hasil = jadwalkanKonten(asal, "a", "2026-10-16T02:00:00.000Z");
    expect(hasil.ok).toBe(false);
    expect(hasil.list[0].status).toBe("draft");
  });

  it("menolak tanggal rusak", () => {
    const hasil = jadwalkanKonten([buat({ id: "a" })], "a", "tidak-iso");
    expect(hasil.ok).toBe(false);
    expect(hasil.alasan).toContain("tidak valid");
  });
});

describe("pindahKeHari (drag antar hari)", () => {
  it("mengganti tanggal tapi jam lokal tetap sama", () => {
    const asal = new Date("2026-10-15T07:30:00");
    const hasil = pindahKeHari(asal.toISOString(), "2026-10-17");
    expect(hasil).not.toBeNull();
    const geser = new Date(hasil!);
    expect(geser.toISOString().slice(0, 10)).toBe(new Date("2026-10-17T07:30:00").toISOString().slice(0, 10));
    expect(geser.getHours()).toBe(7);
    expect(geser.getMinutes()).toBe(30);
  });

  it("menolak kunci hari yang tidak berbentuk tanggal", () => {
    expect(pindahKeHari("2026-10-15T07:30:00.000Z", "17/10/2026")).toBeNull();
    expect(pindahKeHari("2026-10-15T07:30:00.000Z", "2026-13-01")).toBeNull();
  });

  it("menolak jadwal asal yang rusak", () => {
    expect(pindahKeHari("bukan-iso", "2026-10-17")).toBeNull();
  });

  it("menolak tanggal yang tidak ada (31 Februari), bukan membetulkannya diam-diam", () => {
    expect(pindahKeHari("2026-02-01T07:30:00", "2026-02-31")).toBeNull();
  });
});

describe("pindahJadwal (store)", () => {
  it("memindah konten terjadwal dan mempertahankan statusnya", () => {
    const asal = [buat({ id: "a", status: "terjadwal", jadwal_at: "2026-10-16T02:00:00.000Z" })];
    const hasil = pindahJadwal(asal, "a", "2026-10-18T02:00:00.000Z");
    expect(hasil.ok).toBe(true);
    expect(hasil.list[0].jadwal_at).toBe("2026-10-18T02:00:00.000Z");
    expect(hasil.list[0].status).toBe("terjadwal");
  });

  it("tidak bisa dipakai untuk melewati gerbang checklist (hanya siap_posting -> jadwal)", () => {
    const asal = [buat({ id: "a", status: "draft" })];
    const hasil = pindahJadwal(asal, "a", "2026-10-18T02:00:00.000Z");
    expect(hasil.ok).toBe(false);
    expect(hasil.list[0].jadwal_at).toBeNull();
  });
});

describe("batalkanJadwal (store)", () => {
  it("terjadwal -> siap_posting, jadwal_at null", () => {
    const asal = [buat({ id: "a", status: "terjadwal", jadwal_at: "2026-10-16T02:00:00.000Z" })];
    const hasil = batalkanJadwal(asal, "a");
    expect(hasil[0].status).toBe("siap_posting");
    expect(hasil[0].jadwal_at).toBeNull();
  });

  it("tidak menyentuh konten lain atau status lain", () => {
    const asal = [buat({ id: "a", status: "draft" }), buat({ id: "b", status: "terjadwal", jadwal_at: "2026-10-16T02:00:00.000Z" })];
    const hasil = batalkanJadwal(asal, "a");
    expect(hasil.find((k) => k.id === "a")?.status).toBe("draft");
    expect(hasil.find((k) => k.id === "b")?.status).toBe("terjadwal");
  });
});
