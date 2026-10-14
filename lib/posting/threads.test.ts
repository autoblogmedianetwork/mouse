/**
 * Urutan panggilan Threads API diuji dengan fetch tiruan: bentuk URL, nama
 * parameter, dan penyambungan `reply_to_id` adalah hal yang paling mahal kalau
 * salah (status bisa terbit tanpa utasnya nyambung).
 */
import { describe, expect, it, vi } from "vitest";
import { kirimUtasThreads } from "./threads";

interface Panggilan {
  url: string;
  body: Record<string, string>;
}

function fetchPalsu(jawaban: Array<{ id?: string; error?: { message?: string } }>, status = 200) {
  const panggilan: Panggilan[] = [];
  let i = 0;
  const impl = (async (url: string | URL, init?: RequestInit) => {
    const body = Object.fromEntries(new URLSearchParams(String(init?.body ?? "")).entries());
    panggilan.push({ url: String(url), body });
    const isi = jawaban[Math.min(i, jawaban.length - 1)];
    i += 1;
    return new Response(JSON.stringify(isi), {
      status: isi.error ? 400 : status,
      headers: { "content-type": "application/json" },
    });
  }) as unknown as typeof fetch;
  return { impl, panggilan };
}

const opsi = { userId: "123456", token: "TOKEN", baseUrl: "https://graph.threads.net/v1.0" };

describe("kirimUtasThreads", () => {
  it("membuat container lalu publish, berurutan untuk tiap status", async () => {
    const { impl, panggilan } = fetchPalsu([
      { id: "c1" },
      { id: "p1" },
      { id: "c2" },
      { id: "p2" },
    ]);

    const hasil = await kirimUtasThreads(["Status satu", "Status dua"], { ...opsi, fetchImpl: impl });

    expect(hasil.ok).toBe(true);
    expect(hasil.id_terkirim).toEqual(["p1", "p2"]);
    expect(panggilan.map((p) => new URL(p.url).pathname)).toEqual([
      "/v1.0/123456/threads",
      "/v1.0/123456/threads_publish",
      "/v1.0/123456/threads",
      "/v1.0/123456/threads_publish",
    ]);
    expect(panggilan[0].body).toMatchObject({ media_type: "TEXT", text: "Status satu", access_token: "TOKEN" });
    expect(panggilan[0].body.reply_to_id).toBeUndefined();
    expect(panggilan[1].body).toEqual({ creation_id: "c1", access_token: "TOKEN" });
    // Status kedua membalas ID publikasi status pertama, bukan container-nya.
    expect(panggilan[2].body.reply_to_id).toBe("p1");
    expect(panggilan[3].body.creation_id).toBe("c2");
  });

  it("membuang status kosong sebelum mengirim", async () => {
    const { impl, panggilan } = fetchPalsu([{ id: "c1" }, { id: "p1" }]);
    const hasil = await kirimUtasThreads(["  ", "Hanya ini", "   "], { ...opsi, fetchImpl: impl });
    expect(hasil.ok).toBe(true);
    expect(panggilan).toHaveLength(2);
    expect(panggilan[0].body.text).toBe("Hanya ini");
  });

  it("menolak kirim tanpa status", async () => {
    const { impl, panggilan } = fetchPalsu([{ id: "c1" }]);
    const hasil = await kirimUtasThreads(["   "], { ...opsi, fetchImpl: impl });
    expect(hasil.ok).toBe(false);
    expect(hasil.jatuh_ke_manual).toBe(false);
    expect(panggilan).toHaveLength(0);
  });

  it("melaporkan berapa status yang sudah terbit saat gagal di tengah", async () => {
    const { impl } = fetchPalsu([
      { id: "c1" },
      { id: "p1" },
      { error: { message: "Container creation failed" } },
    ]);
    const hasil = await kirimUtasThreads(["Satu", "Dua"], { ...opsi, fetchImpl: impl });

    expect(hasil.ok).toBe(false);
    expect(hasil.id_terkirim).toEqual(["p1"]);
    expect(hasil.jatuh_ke_manual).toBe(true);
    expect(hasil.error).toContain("Status 2 dari 2 gagal");
    expect(hasil.error).toContain("1 status sudah terbit");
  });

  it("menandai kegagalan publish sebagai fallback manual", async () => {
    const { impl } = fetchPalsu([{ id: "c1" }, { error: { message: "Publish ditolak" } }]);
    const hasil = await kirimUtasThreads(["Satu"], { ...opsi, fetchImpl: impl });
    expect(hasil.ok).toBe(false);
    expect(hasil.jatuh_ke_manual).toBe(true);
    expect(hasil.error).toContain("Publish ditolak");
    expect(hasil.id_terkirim).toEqual([]);
  });

  it("memakai base URL default saat env tidak diisi", async () => {
    const { impl, panggilan } = fetchPalsu([{ id: "c1" }, { id: "p1" }]);
    const asli = process.env.THREADS_API_BASE;
    delete process.env.THREADS_API_BASE;
    try {
      await kirimUtasThreads(["Satu"], { userId: "9", token: "T", fetchImpl: impl });
    } finally {
      if (asli !== undefined) process.env.THREADS_API_BASE = asli;
    }
    expect(panggilan[0].url.startsWith("https://graph.threads.net/v1.0/9/threads")).toBe(true);
  });

  it("tidak menggantung saat jaringan gagal, tapi melapor sebagai fallback manual", async () => {
    const impl = vi.fn(async () => {
      throw new TypeError("fetch failed");
    }) as unknown as typeof fetch;
    const hasil = await kirimUtasThreads(["Satu"], { ...opsi, fetchImpl: impl });
    expect(hasil.ok).toBe(false);
    expect(hasil.jatuh_ke_manual).toBe(true);
    expect(hasil.error).toContain("Tidak bisa menghubungi Threads");
  });
});
