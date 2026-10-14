/**
 * Adapter Threads API (Fase 7, ADR 0002). Server-only: token tidak pernah
 * dikirim ke klien (AGENTS aturan 11).
 *
 * Alur resmi Meta untuk satu status: bikin container
 * (`POST /{threads-user-id}/threads`, `media_type=TEXT`) lalu terbitkan
 * (`POST /{threads-user-id}/threads_publish`, `creation_id`). Utas disambung
 * dengan `reply_to_id` yang berisi ID postingan induk **yang sudah terbit**,
 * jadi urutannya harus satu per satu, bukan paralel.
 *
 * Sumber: developers.facebook.com/documentation/threads/posts dan
 * /documentation/threads/reference/publishing (dicek 15 Oktober 2026).
 * Batas platform saat itu: 250 posting dan 1.000 balasan per 24 jam, teks 500
 * karakter per status (emoji dihitung per byte).
 */
import type { HasilKirim } from "./skema";

const BASIS_BAWAAN = "https://graph.threads.net/v1.0";

export interface OpsiThreads {
  /** Threads user id (angka), dari env server. */
  userId: string;
  /** Long-lived access token (60 hari), dari env server. */
  token: string;
  /** Override host/versi API; dipakai pengujian. */
  baseUrl?: string;
  timeoutMs?: number;
  /**
   * Jeda sebelum publish, memberi waktu container diproses. Teks biasanya
   * langsung siap, jadi default 0; media akan butuh tunggu (Meta menyarankan
   * sekitar 30 detik) dan itu diatur lewat `THREADS_CONTAINER_WAIT_MS`.
   */
  jedaKontainerMs?: number;
  /** Dipakai pengujian; default fetch global. */
  fetchImpl?: typeof fetch;
}

interface BalasanGraph {
  id?: string;
  error?: { message?: string; code?: number; error_subcode?: number };
}

/** Nilai default jeda container dari env, dibaca di server saja. */
export function jedaKontainerBawaan(raw = process.env.THREADS_CONTAINER_WAIT_MS): number {
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function pesanError(payload: BalasanGraph, fallback: string): string {
  const pesan = payload?.error?.message?.trim();
  if (!pesan) return fallback;
  const kode = payload.error?.code;
  return kode ? `${pesan} (kode ${kode})` : pesan;
}

function tunggu(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function panggil(
  url: string,
  body: Record<string, string>,
  fetchImpl: typeof fetch,
  timeoutMs: number,
): Promise<BalasanGraph> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetchImpl(url, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(body).toString(),
      signal: controller.signal,
    });
    const teks = await res.text();
    let payload: BalasanGraph = {};
    try {
      payload = teks ? (JSON.parse(teks) as BalasanGraph) : {};
    } catch {
      return { error: { message: `Balasan bukan JSON (${res.status}).` } };
    }
    if (!res.ok) {
      return { error: { message: pesanError(payload, `HTTP ${res.status}`) } };
    }
    return payload;
  } catch (err) {
    const abort = err instanceof DOMException && err.name === "AbortError";
    return {
      error: {
        message: abort
          ? "Permintaan ke Threads melebihi batas waktu."
          : "Tidak bisa menghubungi Threads (jaringan atau DNS).",
      },
    };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Terbitkan utas berurutan. Kegagalan di tengah mengembalikan ID yang sudah
 * terbit lewat `id_terkirim`, supaya pemanggil bisa memberi tahu user apa yang
 * perlu dibersihkan di Threads — bukan menghapus konten dari pustaka.
 */
export async function kirimUtasThreads(
  statuses: string[],
  opsi: OpsiThreads,
): Promise<HasilKirim> {
  const fetchImpl = opsi.fetchImpl ?? fetch;
  const base = (opsi.baseUrl ?? process.env.THREADS_API_BASE?.trim() ?? "").replace(/\/+$/, "") || BASIS_BAWAAN;
  const timeoutMs = opsi.timeoutMs ?? 30_000;
  const jeda = opsi.jedaKontainerMs ?? jedaKontainerBawaan();
  const daftar = statuses.map((s) => s.trim()).filter((s) => s.length > 0);
  const idTerbit: string[] = [];

  if (daftar.length === 0) {
    return {
      ok: false,
      penyedia: "threads_api",
      id_terkirim: [],
      error: "Tidak ada status yang bisa dikirim.",
      jatuh_ke_manual: false,
    };
  }

  for (let i = 0; i < daftar.length; i += 1) {
    const induk = idTerbit[idTerbit.length - 1];
    const container = await panggil(
      `${base}/${opsi.userId}/threads`,
      {
        media_type: "TEXT",
        text: daftar[i],
        access_token: opsi.token,
        ...(induk ? { reply_to_id: induk } : {}),
      },
      fetchImpl,
      timeoutMs,
    );

    if (!container.id) {
      return {
        ok: false,
        penyedia: "threads_api",
        id_terkirim: idTerbit,
        error: ringkasGagal(i, daftar.length, pesanError(container, "container tidak dibuat"), idTerbit.length),
        jatuh_ke_manual: true,
      };
    }

    if (jeda > 0) await tunggu(jeda);

    const terbit = await panggil(
      `${base}/${opsi.userId}/threads_publish`,
      { creation_id: container.id, access_token: opsi.token },
      fetchImpl,
      timeoutMs,
    );

    if (!terbit.id) {
      return {
        ok: false,
        penyedia: "threads_api",
        id_terkirim: idTerbit,
        error: ringkasGagal(i, daftar.length, pesanError(terbit, "publish gagal"), idTerbit.length),
        jatuh_ke_manual: true,
      };
    }

    idTerbit.push(terbit.id);
  }

  return {
    ok: true,
    penyedia: "threads_api",
    id_terkirim: idTerbit,
    error: null,
    jatuh_ke_manual: false,
  };
}

function ringkasGagal(ke: number, total: number, pesan: string, sudahTerbit: number): string {
  const posisi = `Status ${ke + 1} dari ${total} gagal: ${pesan}`;
  if (sudahTerbit === 0) return posisi;
  return `${posisi}. ${sudahTerbit} status sudah terbit di Threads dan perlu dihapus manual di sana kalau tidak diinginkan.`;
}
