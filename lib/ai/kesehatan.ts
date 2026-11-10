/**
 * Pemeriksaan kesehatan provider AI (Pengaturan -> AI).
 *
 * Tiga hal yang dicek, berurutan:
 *   1. Konfigurasi terbaca: base URL, model, dan API key ada di server.
 *   2. Katalog model provider bisa dibaca (`GET {base}/models`) dan model yang
 *      dipakai benar-benar terdaftar di sana.
 *   3. Panggilan chat sungguhan lewat `generateJSON` (satu percobaan, tanpa
 *      retry) mengembalikan JSON yang lolos Zod.
 *
 * Langkah 3 sengaja ada: beberapa provider menjawab katalog model dengan 200
 * walau kunci tidak berlaku untuk chat, sehingga cek katalog saja menyesatkan.
 *
 * Server-only: API key tidak pernah ikut ke hasil (AGENTS aturan 11), dan hasil
 * ini tidak boleh jadi sumber kebenaran untuk menampilkan tombol fitur AI —
 * fitur tetap memakai `isAvailable()` masing-masing.
 */
import { z } from "zod";
import { generateJSON, resolveApiKey, resolveBaseURL, resolveModel } from "./generate-json";

export interface ModelProvider {
  id: string;
  /** Batas token kalau provider mengirimkannya; tidak semua mengirim. */
  maxInputTokens?: number;
  maxOutputTokens?: number;
}

export interface KesehatanAI {
  /** True hanya kalau chat sungguhan berhasil (bukan sekadar katalog terbaca). */
  ok: boolean;
  baseUrl: string;
  model: string;
  /** Kunci hanya dilaporkan ada/tidak, nilainya tidak pernah dikirim. */
  kunciAda: boolean;
  katalogTerbaca: boolean;
  modelTerdaftar: boolean;
  daftarModel: ModelProvider[];
  /** Latensi panggilan chat dalam milidetik; null bila chat gagal. */
  latensiMs: number | null;
  pesan: string | null;
  diperiksaPada: string;
}

const balasanSkema = z.object({ balasan: z.string().min(1) });

const PROMPT_PING =
  'Balas HANYA JSON valid tanpa markdown, tepat seperti ini: {"balasan":"ok"}';

/** Batas waktu katalog model; chat punya batas sendiri di generateJSON. */
const TIMEOUT_KATALOG_MS = 8_000;

/** Pesan galat provider bisa panjang dan memuat hash kunci; dipotong untuk UI. */
function ringkas(pesan: string, maks = 280): string {
  return pesan.length > maks ? `${pesan.slice(0, maks).trimEnd()}…` : pesan;
}

/**
 * Baca katalog model provider. Kegagalan di sini tidak menggagalkan seluruh
 * pemeriksaan: sebagian provider menutup `/models` walau chat-nya jalan.
 */
async function bacaKatalog(
  baseUrl: string,
  apiKey: string,
): Promise<{ terbaca: boolean; model: ModelProvider[]; error?: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_KATALOG_MS);

  try {
    const response = await fetch(`${baseUrl}/models`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: controller.signal,
    });
    if (!response.ok) {
      const detail = await response
        .json()
        .then((body) => (body as { error?: { message?: string } }).error?.message)
        .catch(() => undefined);
      return { terbaca: false, model: [], error: ringkas(detail ?? `HTTP ${response.status}`) };
    }

    type ItemKatalog = { id?: string; max_input_tokens?: number; max_output_tokens?: number };
    const payload = (await response.json()) as { data?: ItemKatalog[] };
    const model = (payload.data ?? [])
      .filter((item): item is ItemKatalog & { id: string } => typeof item.id === "string")
      .map((item) => ({
        id: item.id,
        ...(typeof item.max_input_tokens === "number" ? { maxInputTokens: item.max_input_tokens } : {}),
        ...(typeof item.max_output_tokens === "number" ? { maxOutputTokens: item.max_output_tokens } : {}),
      }));
    return { terbaca: true, model };
  } catch (err) {
    const detail =
      err instanceof DOMException && err.name === "AbortError"
        ? "Katalog model tidak menjawab dalam 8 detik."
        : "Katalog model tidak bisa dihubungi.";
    return { terbaca: false, model: [], error: detail };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Jalankan pemeriksaan lengkap. Selalu mengembalikan objek (tidak pernah
 * throw) supaya route bisa menjawab 200 dengan `ok: false` dan pesan yang
 * bisa dibaca pengguna.
 */
export async function periksaKesehatanAI(): Promise<KesehatanAI> {
  const baseUrl = resolveBaseURL(undefined, process.env.AI_BASE_URL, process.env.AI_MODEL);
  const model = resolveModel(undefined, process.env.AI_MODEL, process.env.AI_BASE_URL);
  const apiKey = resolveApiKey();
  const diperiksaPada = new Date().toISOString();

  if (!apiKey) {
    return {
      ok: false,
      baseUrl,
      model,
      kunciAda: false,
      katalogTerbaca: false,
      modelTerdaftar: false,
      daftarModel: [],
      latensiMs: null,
      pesan:
        "AI_API_KEY (atau OPENROUTER_API_KEY) belum diisi di server. Isi di .env.local atau Vercel Settings -> Environment Variables.",
      diperiksaPada,
    };
  }

  const katalog = await bacaKatalog(baseUrl, apiKey);

  const mulai = Date.now();
  const hasil = await generateJSON(PROMPT_PING, balasanSkema, {
    retries: 0,
    timeoutMs: 20_000,
    temperature: 0,
  });
  const latensiMs = hasil.ok ? Date.now() - mulai : null;

  const pesanBagian = [
    katalog.error ? `Katalog model: ${katalog.error}` : null,
    hasil.ok ? null : `Chat: ${ringkas(hasil.error ?? "gagal tanpa pesan.")}`,
  ].filter((bagian): bagian is string => Boolean(bagian));

  return {
    ok: hasil.ok,
    baseUrl,
    model: hasil.model ?? model,
    kunciAda: true,
    katalogTerbaca: katalog.terbaca,
    modelTerdaftar: katalog.model.some((item) => item.id === model),
    daftarModel: katalog.model,
    latensiMs,
    pesan: pesanBagian.length > 0 ? pesanBagian.join(" ") : null,
    diperiksaPada,
  };
}
