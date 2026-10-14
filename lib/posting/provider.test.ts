/** Fallback provider posting (ADR 0002, AGENTS aturan 7 dan 8). */
import { afterEach, describe, expect, it } from "vitest";
import {
  ambilProvider,
  daftarKetersediaan,
  penyediaDariEnv,
  penyediaEfektif,
} from "./provider";

const ENV_ASLI = {
  user: process.env.THREADS_USER_ID,
  token: process.env.THREADS_ACCESS_TOKEN,
  provider: process.env.POSTING_PROVIDER,
};

function pulihkan() {
  for (const [kunci, nilai] of Object.entries({
    THREADS_USER_ID: ENV_ASLI.user,
    THREADS_ACCESS_TOKEN: ENV_ASLI.token,
    POSTING_PROVIDER: ENV_ASLI.provider,
  })) {
    if (nilai === undefined) delete process.env[kunci];
    else process.env[kunci] = nilai;
  }
}

afterEach(pulihkan);

describe("penyediaDariEnv", () => {
  it("memakai manual sebagai bawaan", () => {
    delete process.env.POSTING_PROVIDER;
    expect(penyediaDariEnv()).toBe("manual");
  });

  it("mengabaikan nilai yang tidak dikenal", () => {
    expect(penyediaDariEnv("buffer")).toBe("manual");
    expect(penyediaDariEnv("threads_api")).toBe("threads_api");
  });
});

describe("fallback ke manual", () => {
  it("threads_api tanpa kredensial jatuh ke manual", () => {
    delete process.env.THREADS_USER_ID;
    delete process.env.THREADS_ACCESS_TOKEN;
    expect(penyediaEfektif("threads_api")).toBe("manual");
    expect(ambilProvider("threads_api").id).toBe("manual");
  });

  it("threads_api siap setelah kredensial diisi", () => {
    process.env.THREADS_USER_ID = "123456";
    process.env.THREADS_ACCESS_TOKEN = "token";
    expect(penyediaEfektif("threads_api")).toBe("threads_api");
  });

  it("mengabaikan kredensial yang hanya berisi spasi", () => {
    process.env.THREADS_USER_ID = "   ";
    process.env.THREADS_ACCESS_TOKEN = "   ";
    expect(penyediaEfektif("threads_api")).toBe("manual");
  });

  it("manual selalu tersedia dan mengembalikan hasil tanpa API", async () => {
    const hasil = await ambilProvider("manual").kirim(["Satu"]);
    expect(hasil.ok).toBe(true);
    expect(hasil.id_terkirim).toEqual([]);
    expect(hasil.jatuh_ke_manual).toBe(false);
  });
});

describe("daftarKetersediaan", () => {
  it("selalu memuat manual dan menjelaskan provider yang tidak siap", () => {
    delete process.env.THREADS_USER_ID;
    delete process.env.THREADS_ACCESS_TOKEN;
    const daftar = daftarKetersediaan();
    expect(daftar.find((p) => p.id === "manual")).toMatchObject({ tersedia: true, alasan: null });
    const threads = daftar.find((p) => p.id === "threads_api");
    expect(threads?.tersedia).toBe(false);
    expect(threads?.alasan).toContain("THREADS_ACCESS_TOKEN");
  });
});
