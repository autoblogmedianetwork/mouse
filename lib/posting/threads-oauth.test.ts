/** OAuth Threads: URL otorisasi dan masa berlaku token (Fase 7). */
import { describe, expect, it } from "vitest";
import {
  jadikanTokenPanjang,
  SCOPE_POSTING,
  statusKoneksi,
  tukarKodeJadiToken,
  urlOtorisasi,
} from "./threads-oauth";

describe("urlOtorisasi", () => {
  it("memuat client_id, redirect_uri, scope posting, dan response_type", () => {
    const url = new URL(
      urlOtorisasi({ appId: "app1", redirectUri: "https://contoh.id/auth/callback" }),
    );
    expect(url.origin + url.pathname).toBe("https://threads.com/oauth/authorize");
    expect(url.searchParams.get("client_id")).toBe("app1");
    expect(url.searchParams.get("redirect_uri")).toBe("https://contoh.id/auth/callback");
    expect(url.searchParams.get("response_type")).toBe("code");
    expect(url.searchParams.get("scope")).toBe(SCOPE_POSTING.join(","));
    expect(url.searchParams.get("state")).toBeNull();
  });

  it("menyertakan state saat diberikan", () => {
    const url = new URL(
      urlOtorisasi({ appId: "app1", redirectUri: "https://contoh.id/cb", state: "abc123" }),
    );
    expect(url.searchParams.get("state")).toBe("abc123");
  });
});

const opsi = {
  appId: "app1",
  appSecret: "secret",
  redirectUri: "https://contoh.id/cb",
};

function fetchToken(jawaban: unknown, status = 200) {
  const panggilan: Array<{ url: string; init?: RequestInit }> = [];
  const impl = (async (url: string | URL, init?: RequestInit) => {
    panggilan.push({ url: String(url), init });
    return new Response(JSON.stringify(jawaban), {
      status,
      headers: { "content-type": "application/json" },
    });
  }) as unknown as typeof fetch;
  return { impl, panggilan };
}

describe("tukarKodeJadiToken", () => {
  it("mengirim form yang diminta Meta dan mengembalikan token", async () => {
    const { impl, panggilan } = fetchToken({ access_token: "pendek", expires_in: 3600, user_id: "9" });
    const hasil = await tukarKodeJadiToken("kode", { ...opsi, fetchImpl: impl });

    expect(hasil).toMatchObject({ ok: true, token: "pendek", expiresInDetik: 3600, userId: "9" });
    expect(panggilan[0].url).toBe("https://graph.threads.com/oauth/access_token");
    const body = Object.fromEntries(
      new URLSearchParams(String(panggilan[0].init?.body ?? "")).entries(),
    );
    expect(body).toMatchObject({
      client_id: "app1",
      client_secret: "secret",
      code: "kode",
      grant_type: "authorization_code",
      redirect_uri: "https://contoh.id/cb",
    });
  });

  it("melaporkan pesan error dari Threads", async () => {
    const { impl } = fetchToken({ error_message: "code sudah dipakai" }, 400);
    const hasil = await tukarKodeJadiToken("kode", { ...opsi, fetchImpl: impl });
    expect(hasil.ok).toBe(false);
    expect(hasil.error).toBe("code sudah dipakai");
  });
});

describe("jadikanTokenPanjang", () => {
  it("memakai grant_type th_exchange_token dan mengembalikan token 60 hari", async () => {
    const { impl, panggilan } = fetchToken({ access_token: "panjang", expires_in: 5_184_000 });
    const hasil = await jadikanTokenPanjang("pendek", { appSecret: "secret", fetchImpl: impl });

    expect(hasil).toMatchObject({ ok: true, token: "panjang" });
    const url = new URL(panggilan[0].url);
    expect(url.origin + url.pathname).toBe("https://graph.threads.net/access_token");
    expect(url.searchParams.get("grant_type")).toBe("th_exchange_token");
    expect(url.searchParams.get("access_token")).toBe("pendek");
  });
});

describe("statusKoneksi", () => {
  const now = new Date("2026-10-15T09:00:00.000Z");

  it("terhubung saat token masih lama", () => {
    expect(statusKoneksi("2026-11-20T09:00:00.000Z", now)).toBe("terhubung");
  });

  it("akan_kedaluwarsa saat tinggal sepekan atau kurang", () => {
    expect(statusKoneksi("2026-10-20T09:00:00.000Z", now)).toBe("akan_kedaluwarsa");
  });

  it("kedaluwarsa saat tanggalnya sudah lewat atau tidak ada", () => {
    expect(statusKoneksi("2026-10-01T09:00:00.000Z", now)).toBe("kedaluwarsa");
    expect(statusKoneksi(null, now)).toBe("kedaluwarsa");
    expect(statusKoneksi("bukan-tanggal", now)).toBe("kedaluwarsa");
  });
});
