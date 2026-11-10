/**
 * Helper fetch JSON untuk komponen klien: satu bentuk hasil, status HTTP ikut
 * dikembalikan, dan respons non-JSON tidak melempar error mentah ke UI.
 */
export type HasilApi<T> =
  | { ok: true; data: T; status: number }
  | { ok: false; error: string; status: number };

export async function ambilJson<T>(
  input: string,
  init?: RequestInit,
): Promise<HasilApi<T>> {
  try {
    const res = await fetch(input, {
      cache: "no-store",
      ...init,
      headers: { Accept: "application/json", ...(init?.headers ?? {}) },
    });
    const json = (await res.json().catch(() => null)) as
      | (T & { ok?: boolean; error?: string })
      | null;

    if (!res.ok || !json || json.ok === false) {
      return {
        ok: false,
        status: res.status,
        error:
          json?.error ??
          (res.status === 401
            ? "Sesi berakhir. Masuk ulang untuk melanjutkan."
            : `Server menjawab HTTP ${res.status}.`),
      };
    }
    return { ok: true, status: res.status, data: json };
  } catch {
    return {
      ok: false,
      status: 0,
      error: "Tidak bisa menghubungi server. Periksa koneksi lalu coba lagi.",
    };
  }
}
