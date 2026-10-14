/** Aturan antrian posting (Fase 7): gerbang persetujuan, jeda, dan batas harian. */
import { describe, expect, it } from "vitest";
import {
  jedaTersisaDetik,
  panjangByte,
  periksaKirim,
  petaAntrian,
  terkirimDalam24Jam,
} from "./antrian";
import { PENGATURAN_POSTING_AWAL, type CatatanKirim, type PengaturanPosting } from "./skema";

const NOW = new Date("2026-10-15T09:00:00.000Z");

const aturan: PengaturanPosting = { penyedia: "threads_api", jeda_detik: 60, batas_harian: 3 };

function konten(ubah: Partial<Parameters<typeof periksaKirim>[0]> = {}) {
  return {
    id: "k1",
    judul: "Utas Tas Kanvas",
    status: "siap_posting" as const,
    statuses: ["Status satu"],
    jadwal_at: null,
    ...ubah,
  };
}

function kirim(ubah: Partial<CatatanKirim> = {}): CatatanKirim {
  return {
    konten_id: "k1",
    waktu: "2026-10-15T08:00:00.000Z",
    ok: true,
    penyedia: "threads_api",
    ...ubah,
  };
}

describe("periksaKirim: gerbang persetujuan", () => {
  it("mengizinkan konten yang sudah disetujui", () => {
    expect(periksaKirim(konten(), [], aturan, NOW).boleh).toBe(true);
    expect(periksaKirim(konten({ status: "terjadwal", jadwal_at: "2026-10-15T08:00:00.000Z" }), [], aturan, NOW).boleh).toBe(true);
    // Gagal boleh dicoba lagi (UI-Spec 5.1).
    expect(periksaKirim(konten({ status: "gagal" }), [], aturan, NOW).boleh).toBe(true);
  });

  it("menolak draft dan konten yang ditolak", () => {
    for (const status of ["draft", "ditolak"] as const) {
      const hasil = periksaKirim(konten({ status }), [], aturan, NOW);
      expect(hasil.boleh).toBe(false);
      expect(hasil.alasan).toContain("sudah disetujui");
    }
  });

  it("menolak konten tanpa status", () => {
    expect(periksaKirim(konten({ statuses: [] }), [], aturan, NOW).boleh).toBe(false);
  });

  it("tidak mengirim konten terjadwal sebelum waktunya", () => {
    const hasil = periksaKirim(
      konten({ status: "terjadwal", jadwal_at: "2026-10-15T10:00:00.000Z" }),
      [],
      aturan,
      NOW,
    );
    expect(hasil.boleh).toBe(false);
    expect(hasil.alasan).toContain("Jadwal belum tiba");
  });

  it("mengabaikan jadwal_at yang rusak (tidak menahan selamanya)", () => {
    expect(periksaKirim(konten({ status: "terjadwal", jadwal_at: "bukan-iso" }), [], aturan, NOW).boleh).toBe(true);
  });
});

describe("periksaKirim: jeda dan batas harian", () => {
  it("menahan kirim selama jeda antar posting belum lewat", () => {
    const baru = kirim({ waktu: "2026-10-15T08:59:30.000Z" });
    const hasil = periksaKirim(konten(), [baru], aturan, NOW);
    expect(hasil.boleh).toBe(false);
    expect(hasil.alasan).toContain("30 detik");
  });

  it("mengizinkan lagi setelah jeda lewat", () => {
    expect(periksaKirim(konten(), [kirim({ waktu: "2026-10-15T08:58:00.000Z" })], aturan, NOW).boleh).toBe(true);
  });

  it("menghitung hanya kiriman dalam 24 jam berjalan", () => {
    const riwayat = [
      kirim({ waktu: "2026-10-15T07:00:00.000Z" }),
      kirim({ waktu: "2026-10-15T06:00:00.000Z" }),
      kirim({ waktu: "2026-10-14T05:00:00.000Z" }), // lebih dari 24 jam
      kirim({ waktu: "2026-10-15T05:30:00.000Z", ok: false }), // gagal tidak dihitung
    ];
    expect(terkirimDalam24Jam(riwayat, NOW)).toBe(2);
    expect(periksaKirim(konten(), riwayat, aturan, NOW).boleh).toBe(true);
  });

  it("menahan kirim saat batas harian tercapai", () => {
    const penuh = [
      kirim({ waktu: "2026-10-15T05:00:00.000Z" }),
      kirim({ waktu: "2026-10-15T06:00:00.000Z" }),
      kirim({ waktu: "2026-10-15T07:00:00.000Z" }),
    ];
    const hasil = periksaKirim(konten(), penuh, aturan, NOW);
    expect(hasil.boleh).toBe(false);
    expect(hasil.alasan).toContain("Batas kirim 3 posting");
  });

  it("jedaTersisaDetik nol saat belum ada kiriman sukses", () => {
    expect(jedaTersisaDetik([], aturan, NOW)).toBe(0);
    expect(jedaTersisaDetik([kirim({ ok: false })], aturan, NOW)).toBe(0);
  });

  it("jedaTersisaDetik memakai kiriman sukses terbaru saja", () => {
    const riwayat = [
      kirim({ waktu: "2026-10-15T08:00:00.000Z" }),
      kirim({ waktu: "2026-10-15T08:59:00.000Z" }),
    ];
    expect(jedaTersisaDetik(riwayat, aturan, NOW)).toBe(0);
    expect(jedaTersisaDetik(riwayat, { jeda_detik: 120 }, NOW)).toBe(60);
  });
});

describe("panjangByte (cara Threads menghitung emoji)", () => {
  it("menghitung ASCII satu byte per karakter", () => {
    expect(panjangByte("abc")).toBe(3);
  });

  it("menghitung emoji lebih dari satu byte", () => {
    expect(panjangByte("🔥")).toBe(4);
    expect(panjangByte("é")).toBe(2);
  });

  it("menolak status yang lewat 500 byte walau karakternya di bawah 500", () => {
    const emoji = "🔥".repeat(200); // 200 karakter, 800 byte
    const hasil = periksaKirim(konten({ statuses: [emoji] }), [], aturan, NOW);
    expect(hasil.boleh).toBe(false);
    expect(hasil.alasan).toContain("800 byte");
  });
});

describe("petaAntrian", () => {
  const daftar = [
    konten({ id: "a" }),
    konten({ id: "b", status: "draft" }),
    konten({ id: "c", status: "terjadwal", jadwal_at: "2026-10-16T09:00:00.000Z" }),
  ];

  it("memisahkan siap, tertahan, dan bukan kandidat", () => {
    const peta = petaAntrian(daftar, [], aturan, NOW);
    expect(peta.map((p) => [p.konten.id, p.status])).toEqual([
      ["a", "siap"],
      ["b", "tidak_boleh"],
      ["c", "tertahan"],
    ]);
  });

  it("semua tertahan saat batas harian penuh, jadi tombol kirim bisa dimatikan", () => {
    const penuh = [
      kirim({ waktu: "2026-10-15T05:00:00.000Z" }),
      kirim({ waktu: "2026-10-15T06:00:00.000Z" }),
      kirim({ waktu: "2026-10-15T07:00:00.000Z" }),
    ];
    const peta = petaAntrian([konten({ id: "a" })], penuh, aturan, NOW);
    expect(peta[0].status).toBe("tertahan");
  });

  it("aturan bawaan tetap manual dan konservatif", () => {
    expect(PENGATURAN_POSTING_AWAL.penyedia).toBe("manual");
    expect(PENGATURAN_POSTING_AWAL.batas_harian).toBeLessThanOrEqual(20);
  });
});
