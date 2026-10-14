/**
 * OAuth Threads (Fase 7): pembangun URL, penukaran token, dan masa berlaku.
 *
 * Sumber: developers.facebook.com/documentation/threads/get-started
 * (dicek 15 Oktober 2026). Ringkasnya:
 *   - authorisasi  : https://threads.com/oauth/authorize (code berlaku 1 jam)
 *   - code -> token pendek : POST https://graph.threads.com/oauth/access_token
 *   - token pendek (1 jam) -> panjang (60 hari) : GET
 *     https://graph.threads.net/access_token?grant_type=th_exchange_token
 *   - perpanjang   : GET https://graph.threads.net/refresh_access_token
 *     ?grant_type=th_refresh_token (token minimal berumur 24 jam)
 *
 * Semua fungsi di sini butuh app secret, jadi server-only (AGENTS aturan 11).
 */

/** Scope minimum untuk bisa memposting (threads_basic wajib untuk semua endpoint). */
export const SCOPE_POSTING = ["threads_basic", "threads_content_publish"] as const;

const OTORISASI = "https://threads.com/oauth/authorize";
const TUKAR_TOKEN = "https://graph.threads.com/oauth/access_token";
const TOKEN_PANJANG = "https://graph.threads.net/access_token";
const SEGARKAN = "https://graph.threads.net/refresh_access_token";

export interface OpsiOauth {
  appId: string;
  appSecret: string;
  redirectUri: string;
  /** Nilai anti-CSRF yang dikembalikan apa adanya oleh Threads. */
  state?: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

export interface TokenHasil {
  ok: boolean;
  token?: string;
  /** Detik sampai kedaluwarsa, sesuai balasan Threads. */
  expiresInDetik?: number;
  userId?: string;
  error?: string;
}

/** URL yang dibuka user untuk memberi izin ke akun Threads-nya. */
export function urlOtorisasi(opsi: Pick<OpsiOauth, "appId" | "redirectUri" | "state">): string {
  const params = new URLSearchParams({
    client_id: opsi.appId,
    redirect_uri: opsi.redirectUri,
    scope: SCOPE_POSTING.join(","),
    response_type: "code",
  });
  if (opsi.state) params.set("state", opsi.state);
  return `${OTORISASI}?${params.toString()}`;
}

interface BalasanToken {
  access_token?: string;
  expires_in?: number;
  user_id?: string;
  error_message?: string;
  error?: { message?: string };
}

async function panggilToken(
  url: string,
  init: RequestInit,
  fetchImpl: typeof fetch,
  timeoutMs: number,
): Promise<TokenHasil> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetchImpl(url, { ...init, signal: controller.signal });
    const teks = await res.text();
    let payload: BalasanToken = {};
    try {
      payload = teks ? (JSON.parse(teks) as BalasanToken) : {};
    } catch {
      return { ok: false, error: `Balasan bukan JSON (${res.status}).` };
    }
    if (!res.ok || !payload.access_token) {
      return {
        ok: false,
        error: payload.error_message ?? payload.error?.message ?? `HTTP ${res.status}`,
      };
    }
    return {
      ok: true,
      token: payload.access_token,
      expiresInDetik: payload.expires_in,
      userId: payload.user_id,
    };
  } catch {
    return { ok: false, error: "Tidak bisa menghubungi Threads." };
  } finally {
    clearTimeout(timer);
  }
}

/** code (1 jam) -> token pendek (1 jam). Server-only. */
export async function tukarKodeJadiToken(code: string, opsi: OpsiOauth): Promise<TokenHasil> {
  const fetchImpl = opsi.fetchImpl ?? fetch;
  return panggilToken(
    TUKAR_TOKEN,
    {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: opsi.appId,
        client_secret: opsi.appSecret,
        code,
        grant_type: "authorization_code",
        redirect_uri: opsi.redirectUri,
      }).toString(),
    },
    fetchImpl,
    opsi.timeoutMs ?? 30_000,
  );
}

/** Token pendek -> token panjang (60 hari). */
export async function jadikanTokenPanjang(
  tokenPendek: string,
  opsi: Pick<OpsiOauth, "appSecret" | "fetchImpl" | "timeoutMs">,
): Promise<TokenHasil> {
  const fetchImpl = opsi.fetchImpl ?? fetch;
  const url = `${TOKEN_PANJANG}?${new URLSearchParams({
    grant_type: "th_exchange_token",
    client_secret: opsi.appSecret,
    access_token: tokenPendek,
  }).toString()}`;
  return panggilToken(url, { method: "GET" }, fetchImpl, opsi.timeoutMs ?? 30_000);
}

/** Perpanjang token panjang. Gagal kalau token sudah kedaluwarsa (>60 hari). */
export async function segarkanToken(
  token: string,
  opsi: Pick<OpsiOauth, "fetchImpl" | "timeoutMs"> = {},
): Promise<TokenHasil> {
  const fetchImpl = opsi.fetchImpl ?? fetch;
  const url = `${SEGARKAN}?${new URLSearchParams({
    grant_type: "th_refresh_token",
    access_token: token,
  }).toString()}`;
  return panggilToken(url, { method: "GET" }, fetchImpl, opsi.timeoutMs ?? 30_000);
}

export type StatusKoneksi = "terhubung" | "akan_kedaluwarsa" | "kedaluwarsa";

/** Ambang peringatan: token tinggal sepekan lagi (permintaan refresh pertama). */
const AMBANG_PERINGATAN_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Status koneksi dari tanggal kedaluwarsa token. Nilainya sama dengan enum
 * `threads_accounts.status_koneksi` supaya baris database dan UI tidak perlu
 * menerjemahkan apa pun.
 */
export function statusKoneksi(kedaluwarsaAt: string | null, now = new Date()): StatusKoneksi {
  if (!kedaluwarsaAt) return "kedaluwarsa";
  const t = Date.parse(kedaluwarsaAt);
  if (!Number.isFinite(t)) return "kedaluwarsa";
  const sisa = t - now.getTime();
  if (sisa <= 0) return "kedaluwarsa";
  return sisa <= AMBANG_PERINGATAN_MS ? "akan_kedaluwarsa" : "terhubung";
}
