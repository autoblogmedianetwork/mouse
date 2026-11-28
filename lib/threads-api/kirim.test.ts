import { describe, expect, it } from "vitest";
import { bodyContainer, kirimTeks } from "./kirim";
import { terjemahkanGalatThreads, urlOtorisasi, konfigurasiThreads } from "./config";

describe("bodyContainer", () => {
  it("memuat media_type TEXT dan teks", () => {
    const body = bodyContainer("Halo dunia");
    expect(body.get("media_type")).toBe("TEXT");
    expect(body.get("text")).toBe("Halo dunia");
  });
});

describe("kirimTeks", () => {
  it("dua langkah: container lalu publish, mengembalikan postId", async () => {
    const panggilan: Array<{ url: string; init: RequestInit }> = [];
    const antrean = [
      new Response(JSON.stringify({ id: "container-1" }), { status: 200 }),
      new Response(JSON.stringify({ id: "post-99" }), { status: 200 }),
    ];
    const hasil = await kirimTeks({
      accessToken: "token",
      threadsUserId: "user-1",
      teks: "Halo",
      fetchImpl: async (url, init) => {
        panggilan.push({ url, init });
        return antrean.shift() as Response;
      },
    });
    expect(hasil).toEqual({ ok: true, postId: "post-99" });
    expect(panggilan[0].url).toContain("/user-1/threads");
    expect(panggilan[1].url).toContain("/threads_publish");
    expect(panggilan[1].init.body).toContain("creation_id=container-1");
  });

  it("galat 401 ditandai perluSambungUlang", async () => {
    const hasil = await kirimTeks({
      accessToken: "kadaluarsa",
      threadsUserId: "user-1",
      teks: "Halo",
      fetchImpl: async () => new Response("invalid access token", { status: 401 }),
      terjemahkanGalat: terjemahkanGalatThreads,
    });
    expect(hasil.ok).toBe(false);
    if (hasil.ok) return;
    expect(hasil.perluSambungUlang).toBe(true);
    expect(hasil.galat).toContain("Sambungkan ulang");
  });

  it("publish tanpa id mengembalikan peringatan jelas (tidak diulang otomatis)", async () => {
    const antrean = [
      new Response(JSON.stringify({ id: "c1" }), { status: 200 }),
      new Response(JSON.stringify({}), { status: 200 }),
    ];
    const hasil = await kirimTeks({
      accessToken: "token",
      threadsUserId: "user-1",
      teks: "Halo",
      fetchImpl: async () => antrean.shift() as Response,
    });
    expect(hasil.ok).toBe(false);
    if (hasil.ok) return;
    expect(hasil.galat).toContain("jangan kirim ulang");
  });
});

describe("terjemahkanGalatThreads", () => {
  it("429 -> pesan batas harian", () => {
    expect(terjemahkanGalatThreads(429, "")).toContain("250 postingan");
  });
  it("401 -> minta sambung ulang", () => {
    expect(terjemahkanGalatThreads(401, "")).toContain("Sambungkan ulang");
  });
  it("5xx -> server bermasalah", () => {
    expect(terjemahkanGalatThreads(503, "")).toContain("bermasalah");
  });
});

describe("konfigurasi & URL otorisasi", () => {
  it("null bila env belum diisi (fail-closed)", () => {
    const lama = { THREADS_APP_ID: process.env.THREADS_APP_ID, THREADS_APP_SECRET: process.env.THREADS_APP_SECRET };
    delete process.env.THREADS_APP_ID;
    delete process.env.THREADS_APP_SECRET;
    expect(konfigurasiThreads("https://x.vercel.app")).toBeNull();
    process.env.THREADS_APP_ID = lama.THREADS_APP_ID;
    process.env.THREADS_APP_SECRET = lama.THREADS_APP_SECRET;
  });

  it("URL otorisasi memuat scope, redirect, dan state", () => {
    const url = urlOtorisasi(
      { appId: "app123", appSecret: "sec", redirectUri: "https://x.app/auth/threads/callback" },
      "state-rahasia",
    );
    expect(url).toContain("https://threads.com/oauth/authorize?");
    expect(url).toContain("client_id=app123");
    expect(url).toContain("scope=threads_basic%2Cthreads_content_publish");
    expect(url).toContain("state=state-rahasia");
  });
});
