/**
 * Single entry point for AI calls (AGENTS rule 6): calls an OpenAI-compatible
 * `/chat/completions` endpoint, parses the JSON answer, and validates it with
 * Zod. Retries once by default per PRD 10.3; Prompt 3 raises it to 2 per
 * PRD 10.4.
 *
 * Provider bebas: cukup ganti AI_BASE_URL / AI_MODEL / AI_API_KEY di server.
 * Default memakai OpenRouter (lihat docs/ai-provider.md bagian 3).
 *
 * Server-only: API key must never reach the client (AGENTS rule 11).
 * Call this only from route handlers under app/api/ — never from components.
 */
import { z } from "zod";
import { parseModelJson } from "./parse-json";

export interface UsageAI {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface GenerateJSONResult<T> {
  ok: boolean;
  data?: T;
  error?: string;
  attempts: number;
  /** Model actually used (self-reported back to routes, so generations.model is accurate). */
  model?: string;
  /** Token usage summed across every attempt (each attempt costs tokens). */
  usage?: UsageAI;
}

export interface GenerateJSONOptions {
  /** Extra attempts after the first try. Default 1 (PRD 10.3). */
  retries?: number;
  /** Override model; default from AI_MODEL or DEFAULT_MODEL. */
  model?: string;
  temperature?: number;
  timeoutMs?: number;
}

export const DEFAULT_BASE_URL = "https://openrouter.ai/api/v1";
export const DEFAULT_MODEL = "nvidia/nemotron-3-super-120b-a12b:free";

/**
 * Base URL endpoint OpenAI-compatible, berurut dari yang paling diutamakan:
 * opsi eksplisit -> `AI_BASE_URL` -> `DEFAULT_BASE_URL`.
 *
 * Trailing slash dibuang supaya URL jadi `{base}/chat/completions` tanpa
 * ganda `//` yang bikin beberapa provider menjawab 404.
 */
export function resolveBaseURL(explicit?: string, envValue?: string, envModel?: string): string {
  const dariOpsi = explicit?.trim();
  if (dariOpsi) return dariOpsi.replace(/\/+$/, "");

  const dariEnv = envValue?.trim();
  const modelEnv = envModel?.trim();

  // Bila AI_MODEL berisi URL dan AI_BASE_URL bukan URL (tertukar)
  if (dariEnv && !/^https?:\/\//i.test(dariEnv) && modelEnv && /^https?:\/\//i.test(modelEnv)) {
    return modelEnv.replace(/\/+$/, "");
  }

  return (dariEnv || DEFAULT_BASE_URL).replace(/\/+$/, "");
}

/**
 * Model yang dipakai, berurut dari yang paling diutamakan:
 * opsi eksplisit -> `AI_MODEL` -> `DEFAULT_MODEL`.
 *
 * Bila AI_MODEL tidak sengaja berisi URL (misalnya tertukar dengan AI_BASE_URL),
 * sistem secara cerdas mendeteksi isi model dari AI_BASE_URL atau jatuh ke DEFAULT_MODEL.
 */
export function resolveModel(explicit?: string, envValue?: string, envBaseUrl?: string): string {
  const dariOpsi = explicit?.trim();
  if (dariOpsi && !/^https?:\/\//i.test(dariOpsi)) return dariOpsi;

  const dariEnv = envValue?.trim();
  const baseUrlEnv = envBaseUrl?.trim();

  // Jika envValue ternyata sebuah URL (tertukar dengan base URL)
  if (dariEnv && /^https?:\/\//i.test(dariEnv)) {
    if (baseUrlEnv && !/^https?:\/\//i.test(baseUrlEnv)) {
      return baseUrlEnv;
    }
    return DEFAULT_MODEL;
  }

  if (dariEnv) return dariEnv;

  // Jika envValue kosong tapi baseUrlEnv berisi nama model
  if (baseUrlEnv && !/^https?:\/\//i.test(baseUrlEnv)) {
    return baseUrlEnv;
  }

  return DEFAULT_MODEL;
}

/**
 * API key server-side. `AI_API_KEY` dipakai dulu; `OPENROUTER_API_KEY`
 * tetap dibaca sebagai cadangan agar rahasia lama di Vercel tidak perlu
 * diganti nama.
 */
export function resolveApiKey(): string | undefined {
  const utama = process.env.AI_API_KEY?.trim();
  if (utama) return utama;
  return process.env.OPENROUTER_API_KEY?.trim() || undefined;
}

interface ChatCompletionsResponse {
  choices?: Array<{ message?: { content?: string | null } }>;
  /** Provider usage block (OpenAI-compatible); absent on some errors. */
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  error?: { message?: string };
}

function extractText(payload: ChatCompletionsResponse): string {
  return (payload.choices?.[0]?.message?.content ?? "").trim();
}

/**
 * Satu panggilan teks ke provider chat. Provider bebas lewat AI_BASE_URL,
 * model lewat AI_MODEL, kunci lewat AI_API_KEY (terlihat di dua baris
 * berikutnya). Parse, validasi dengan Zod, retry sekali, dan ringkas pesan
 * error provider (bukan JSON mentah) sebelum mengembalikan.
 */
export async function generateJSON<T>(
  prompt: string,
  schema: z.ZodTypeAny,
  options: GenerateJSONOptions = {},
): Promise<GenerateJSONResult<T>> {
  const retries = Math.max(0, options.retries ?? 1);
  const model = resolveModel(options.model, process.env.AI_MODEL, process.env.AI_BASE_URL);
  const baseURL = resolveBaseURL(undefined, process.env.AI_BASE_URL, process.env.AI_MODEL);

  // Server-only: kunci AI tidak pernah sampai ke klien (AGENTS rule 11).
  const apiKey = resolveApiKey();
  if (!apiKey) {
    return {
      ok: false,
      error: "AI_API_KEY (atau OPENROUTER_API_KEY) belum diisi di server. Isi di .env.local atau Vercel Settings -> Environment Variables.",
      attempts: 0,
    };
  }

  const controller = options.timeoutMs ? new AbortController() : undefined;
  if (controller) setTimeout(() => controller.abort(), options.timeoutMs);

  let lastError: unknown;
  const usageTotal: UsageAI = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
  let adaUsage = false;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetch(`${baseURL}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "HTTP-Referer": "https://autothreads.app",
          "X-Title": "Heaviliate",
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: prompt }],
          temperature: options.temperature ?? 0.7,
          response_format: { type: "json_object" },
        }),
        signal: controller?.signal,
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: { message?: string; code?: string } };
        const detail = body.error?.message ?? `HTTP ${response.status}`;
        lastError = new Error(`HTTP ${response.status}: ${detail}`);
        continue;
      }

      const payload = (await response.json()) as ChatCompletionsResponse;
      // Sum usage on every successful HTTP response, even when the answer is
      // invalid JSON: the user pays for those attempts too (PRD F10 logging).
      if (payload.usage && typeof payload.usage === "object") {
        usageTotal.promptTokens += payload.usage.prompt_tokens ?? 0;
        usageTotal.completionTokens += payload.usage.completion_tokens ?? 0;
        usageTotal.totalTokens += payload.usage.total_tokens ?? payload.usage.prompt_tokens ?? payload.usage.completion_tokens ?? 0;
        adaUsage = true;
      }
      const text = extractText(payload);
      if (!text) {
        lastError = new Error("Provider mengembalikan teks kosong.");
        continue;
      }

      let json: unknown;
      try {
        json = parseModelJson(text);
      } catch (err) {
        lastError = err;
        continue;
      }

      const parsed = schema.safeParse(json);
      if (!parsed.success) {
        lastError = new Error(`JSON tidak valid setelah 1 retry: ${JSON.stringify(parsed.error.flatten().fieldErrors)}`);
        continue;
      }

      return { ok: true, data: parsed.data as T, error: undefined, attempts: attempt + 1, model, ...(adaUsage ? { usage: { ...usageTotal } } : {}) };
    } catch (err) {
      // AbortError / jaringan: retry sampai habis, lalu tampilkan pesan ringkas.
      const isAbort = err instanceof DOMException && err.name === "AbortError";
      const isNetwork = err instanceof TypeError && err.message.includes("Failed to fetch");
      if (isAbort || isNetwork) {
        lastError = err;
        continue;
      }
      lastError = err;
      break;
    }
  }

  const message = (() => {
    if (lastError instanceof Error) return lastError.message;
    if (lastError) return String(lastError);
    return "Generate JSON gagal tanpa alasan yang bisa dibaca.";
  })();

  const retryLabel = retries > 0 ? `gagal setelah ${retries + 1} percobaan` : "gagal pada percobaan pertama";

  return {
    ok: false,
    error: `${message} (${retryLabel})`,
    attempts: retries + 1,
    model,
    ...(adaUsage ? { usage: { ...usageTotal } } : {}),
  };
}
