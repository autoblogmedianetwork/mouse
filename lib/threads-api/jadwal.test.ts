import { describe, expect, it } from "vitest";
import { pilihDue, validasiTitipan, type BarisJadwal } from "./jadwal";

function baris(parsial: Partial<BarisJadwal>): BarisJadwal {
  return {
    id: "j1",
    user_id: "u1",
    judul: "Uji",
    teks: "Halo",
    jadwal_pada: new Date("2026-11-20T10:00:00Z").toISOString(),
    status: "terjadwal",
    threads_post_id: null,
    pesan_galat: null,
    terkirim_pada: null,
    dibuat_pada: new Date("2026-11-17T00:00:00Z").toISOString(),
    ...parsial,
  };
}

describe("validasiTitipan", () => {
  const sekarang = new Date("2026-11-17T10:00:00Z");
  const masukanOk = {
    judul: "Uji",
    teks: "Halo dunia",
    jadwalPada: new Date("2026-11-18T10:00:00Z"),
  };

  it("menerima titipan normal", () => {
    expect(validasiTitipan(masukanOk, 500, sekarang)).toEqual({ ok: true });
  });

  it("menolak teks kosong dan melebihi batas", () => {
    expect(validasiTitipan({ ...masukanOk, teks: "  " }, 500, sekarang).ok).toBe(false);
    const hasil = validasiTitipan({ ...masukanOk, teks: "a".repeat(501) }, 500, sekarang);
    expect(hasil.ok).toBe(false);
    if (!hasil.ok) expect(hasil.galat).toContain("501");
  });

  it("menolak jadwal masa lalu dan lebih dari 90 hari", () => {
    const lampau = validasiTitipan(
      { ...masukanOk, jadwalPada: new Date("2026-11-17T09:00:00Z") },
      500,
      sekarang,
    );
    expect(lampau.ok).toBe(false);
    if (!lampau.ok) expect(lampau.galat).toContain("masa depan");

    const jauh = validasiTitipan(
      { ...masukanOk, jadwalPada: new Date("2027-05-01T00:00:00Z") },
      500,
      sekarang,
    );
    expect(jauh.ok).toBe(false);
    if (!jauh.ok) expect(jauh.galat).toContain("90 hari");
  });
});

describe("pilihDue", () => {
  const sekarang = new Date("2026-11-20T10:00:00Z");

  it("hanya terjadwal yang sudah jatuh tempo, urut waktu, maks 10", () => {
    const semua = [
      baris({ id: "masa-depan", jadwal_pada: new Date("2026-11-21T00:00:00Z").toISOString() }),
      baris({ id: "terkirim", status: "terkirim", jadwal_pada: new Date("2026-11-19T00:00:00Z").toISOString() }),
      baris({ id: "gagal", status: "gagal", jadwal_pada: new Date("2026-11-19T01:00:00Z").toISOString() }),
      baris({ id: "batal", status: "dibatalkan", jadwal_pada: new Date("2026-11-19T02:00:00Z").toISOString() }),
      baris({ id: "due-2", jadwal_pada: new Date("2026-11-20T09:00:00Z").toISOString() }),
      baris({ id: "due-1", jadwal_pada: new Date("2026-11-20T08:00:00Z").toISOString() }),
    ];
    const due = pilihDue(semua, sekarang);
    expect(due.map((b) => b.id)).toEqual(["due-1", "due-2"]);
  });

  it("maksimal 10 per siklus", () => {
    const banyak = Array.from({ length: 15 }, (_, i) =>
      baris({ id: `b${i}`, jadwal_pada: new Date("2026-11-19T00:00:00Z").toISOString() }),
    );
    expect(pilihDue(banyak, sekarang)).toHaveLength(10);
  });
});
