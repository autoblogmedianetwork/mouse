import { describe, expect, it } from "vitest";
import {
  bersihkanVarian,
  buatEksperimen,
  catatPemenang,
  hapusEksperimen,
  ringkasanEksperimen,
  validasiInput,
  MAKS_VARIAN,
  MIN_VARIAN,
} from "./eksperimen-hook";

describe("validasiInput", () => {
  it("menolak nama kosong dan varian kurang dari minimum", () => {
    expect(validasiInput("", ["hook a", "hook b"])).toBe("Nama eksperimen wajib diisi.");
    expect(validasiInput("uji", ["hook a"])).toBe(
      `Isi minimal ${MIN_VARIAN} varian hook yang berbeda.`,
    );
  });

  it("menolak varian duplikat, kosong, dan terlalu panjang", () => {
    expect(validasiInput("uji", ["hook a", "hook a"])).toBe(
      "Varian hook tidak boleh sama persis.",
    );
    expect(validasiInput("uji", ["hook a", ""])).toBe(
      `Isi minimal ${MIN_VARIAN} varian hook yang berbeda.`,
    );
    expect(validasiInput("uji", ["hook a", "x".repeat(501)])).toBe(
      "Satu varian melebihi 500 karakter.",
    );
  });

  it("menolak lebih dari 5 varian", () => {
    const banyak = Array.from({ length: MAKS_VARIAN + 1 }, (_, i) => `hook ${i}`);
    expect(validasiInput("uji", banyak)).toBe(
      `Maksimal ${MAKS_VARIAN} varian hook per eksperimen.`,
    );
  });

  it("menerima input yang valid", () => {
    expect(validasiInput("uji hook", ["hook a", "hook b", "hook c"])).toBeNull();
  });
});

describe("bersihkanVarian", () => {
  it("memangkas spasi dan membuang baris kosong", () => {
    expect(bersihkanVarian(["  hook a  ", "", "hook b"])).toEqual(["hook a", "hook b"]);
  });
});

describe("buatEksperimen", () => {
  it("membuat eksperimen dengan pemenang null", () => {
    const e = buatEksperimen("uji", ["hook a", "hook b"]);
    expect(e.nama).toBe("uji");
    expect(e.varian).toEqual(["hook a", "hook b"]);
    expect(e.pemenang).toBeNull();
    expect(e.dicatat_pada).toBeNull();
    expect(e.id).toBeTruthy();
  });
});

describe("catatPemenang", () => {
  it("mencatat dan membatalkan pemenang", () => {
    const e = buatEksperimen("uji", ["a", "b"]);
    const daftar = [e];
    const hasil = catatPemenang(daftar, e.id, 1);
    expect(hasil.ok).toBe(true);
    expect(hasil.daftar[0].pemenang).toBe(1);
    expect(hasil.daftar[0].dicatat_pada).not.toBeNull();

    const batal = catatPemenang(hasil.daftar, e.id, null);
    expect(batal.daftar[0].pemenang).toBeNull();
    expect(batal.daftar[0].dicatat_pada).toBeNull();
  });

  it("menolak indeks di luar rentang varian", () => {
    const e = buatEksperimen("uji", ["a", "b"]);
    const hasil = catatPemenang([e], e.id, 5);
    expect(hasil.ok).toBe(false);
    expect(hasil.daftar[0].pemenang).toBeNull();
  });

  it("menolak id yang tidak ada", () => {
    const e = buatEksperimen("uji", ["a", "b"]);
    const hasil = catatPemenang([e], "tidak-ada", 0);
    expect(hasil.ok).toBe(false);
  });
});

describe("hapusEksperimen", () => {
  it("menghapus berdasarkan id", () => {
    const a = buatEksperimen("a", ["x", "y"]);
    const b = buatEksperimen("b", ["x", "y"]);
    expect(hapusEksperimen([a, b], a.id)).toEqual([b]);
  });
});

describe("ringkasanEksperimen", () => {
  it("menghitung total, tercatat, dan menang per slot", () => {
    const a = { ...buatEksperimen("a", ["v0", "v1", "v2"]), pemenang: 0 };
    const b = { ...buatEksperimen("b", ["v0", "v1"]), pemenang: 1 };
    const c = buatEksperimen("c", ["v0", "v1"]); // belum dicatat
    const r = ringkasanEksperimen([a, b, c]);
    expect(r.total).toBe(3);
    expect(r.tercatat).toBe(2);
    expect(r.per_slot[0]).toMatchObject({ slot: 0, menang: 1, persen: 50 });
    expect(r.per_slot[1]).toMatchObject({ slot: 1, menang: 1, persen: 50 });
    expect(r.per_slot[2].menang).toBe(0);
  });

  it("mengembalikan nol aman saat kosong", () => {
    const r = ringkasanEksperimen([]);
    expect(r.total).toBe(0);
    expect(r.tercatat).toBe(0);
    expect(r.per_slot.every((s) => s.menang === 0)).toBe(true);
  });
});
