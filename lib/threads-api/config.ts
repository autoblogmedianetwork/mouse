/**
 * Konfigurasi Threads API (Fase 7, ADR 0023) — cek env & URL OAuth.
 *
 * Env yang dibutuhkan (semua di server, tidak pernah ke klien):
 *   THREADS_APP_ID      — ID Meta app dengan use case Threads
 *   THREADS_APP_SECRET  — app secret
 *   THREADS_REDIRECT_URI— callback OAuth (opsional; default {origin}/auth/threads/callback)
 *   CRON_SECRET         — rahasia pemanggil cron (Vercel Cron mengirim
 *                         header Authorization: Bearer <CRON_SECRET>)
 *
 * Tanpa env ini, fitur otomatis menampilkan petunjuk pemasangan dan tidak
 * pernah mencoba mengirim apa pun (gagal tertutup, fail-closed).
 */

export interface KonfigurasiThreads {
  appId: string;
  appSecret: string;
  redirectUri: string;
}

export function konfigurasiThreads(origin?: string): KonfigurasiThreads | null {
  const appId = process.env.THREADS_APP_ID?.trim();
  const appSecret = process.env.THREADS_APP_SECRET?.trim();
  if (!appId || !appSecret) return null;
  const redirectUri =
    process.env.THREADS_REDIRECT_URI?.trim() ||
    (origin ? `${origin.replace(/\/$/, "")}/auth/threads/callback` : "");
  if (!redirectUri) return null;
  return { appId, appSecret, redirectUri };
}

/** Scope minimum untuk posting teks atas nama akun sendiri. */
export const SCOPE_THREADS = "threads_basic,threads_content_publish";

/**
 * URL OAuth Threads. `state` wajib: penangkal CSRF, dibandingkan di callback.
 */
export function urlOtorisasi(k: KonfigurasiThreads, state: string): string {
  const params = new URLSearchParams({
    client_id: k.appId,
    redirect_uri: k.redirectUri,
    response_type: "code",
    scope: SCOPE_THREADS,
    state,
  });
  return `https://threads.com/oauth/authorize?${params.toString()}`;
}

/**
 * Tukar kode otorisasi menjadi token jangka pendek, lalu naikkan ke token
 * jangka panjang (60 hari) sesuai docs Threads API.
 */
export async function tukarKode(
  k: KonfigurasiThreads,
  kode: string,
): Promise<{ accessToken: string; kedaluwarsaDetik: number; threadsUserId: string; username: string }> {
  // 1) kode -> short-lived token
  const res1 = await fetch("https://graph.threads.com/oauth/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: k.appId,
      client_secret: k.appSecret,
      grant_type: "authorization_code",
      redirect_uri: k.redirectUri,
      code: kode,
    }),
  });
  if (!res1.ok) {
    throw new Error(`Pertukaran kode gagal (${res1.status}). Periksa THREADS_APP_ID/SECRET.`);
  }
  const j1 = (await res1.json()) as { access_token?: string };
  if (!j1.access_token) throw new Error("Respons token tidak memuat access_token.");

  // 2) short-lived -> long-lived (60 hari)
  const res2 = await fetch(
    `https://graph.threads.com/access_token?grant_type=threads_long_lived_token&client_secret=${encodeURIComponent(k.appSecret)}&access_token=${encodeURIComponent(j1.access_token)}`,
  );
  if (!res2.ok) {
    throw new Error(`Penaikan token jangka panjang gagal (${res2.status}).`);
  }
  const j2 = (await res2.json()) as { access_token?: string; expires_in?: number };
  if (!j2.access_token) throw new Error("Respons token jangka panjang tidak memuat access_token.");

  // 3) profil: id + username (threads_basic)
  const res3 = await fetch(
    `https://graph.threads.com/v1.0/me?fields=id,username&access_token=${encodeURIComponent(j2.access_token)}`,
  );
  if (!res3.ok) throw new Error(`Gagal membaca profil Threads (${res3.status}).`);
  const j3 = (await res3.json()) as { id?: string; username?: string };
  if (!j3.id) throw new Error("Respons profil tidak memuat id.");

  return {
    accessToken: j2.access_token,
    kedaluwarsaDetik: j2.expires_in ?? 60 * 24 * 60 * 60,
    threadsUserId: j3.id,
    username: j3.username ?? "",
  };
}

/** Pesan galat API Threads -> Bahasa Indonesia yang bisa dipahami user. */
export function terjemahkanGalatThreads(status: number, body: string): string {
  if (status === 401 || /access_token/i.test(body)) {
    return "Token Threads kedaluwarsa atau tidak valid. Sambungkan ulang akun di Pengaturan.";
  }
  if (status === 429) {
    return "Batas kirim Threads tercapai (250 postingan per 24 jam). Tunggu sebentar lalu coba lagi.";
  }
  if (status === 403) {
    return "Threads menolak kiriman ini. Pastikan aplikasi punya izin threads_content_publish.";
  }
  if (status >= 500) {
    return "Server Threads sedang bermasalah. Coba lagi beberapa menit lagi.";
  }
  return `Gagal mengirim (${status}). Coba lagi atau kirim manual lewat tombol Buka di Threads.`;
}
