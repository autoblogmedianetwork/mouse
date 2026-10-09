/**
 * Single entry point for AI calls (AGENTS rule 6): calls the Gemini REST
 * endpoint, parses the JSON answer, and validates it with Zod. Retries once
 * by default per PRD 10.3; Prompt 3 raises it to 2 per PRD 10.4.
 *
 * Server-only: GEMINI_API_KEY must never reach the client (AGENTS rule 8).
 * Call this only from route handlers under app/api/ — never from components.
 *
 * Endpoint reference: docs/ai-provider.md section 3 (verified 9 Oct 2026).
 */
import { z } from "zod";
import { parseModelJson } from "./parse-json";

export interface GenerateJSONResult<T> {
  ok: boolean;
  data?: T;
  error?: string;
  attempts: number;
}

export interface GenerateJSONOptions {
  /** Extra attempts after the first try. Default 1 (PRD 10.3). */
  retries?: number;
  /** Override model; default gemini-2.5-flash-lite (docs/ai-provider.md). */
  model?: string;
  temperature?: number;
  timeoutMs?: number;
}

const MODELS_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const DEFAULT_MODEL = "gemini-2.5-flash-lite";

interface GeminiResponse {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  error?: { message?: string };
}

function extractText(payload: GeminiResponse): string {
  const parts = payload.candidates?.[0]?.content?.parts ?? [];
  return parts
    .map((p) => p.text ?? "")
    .join("")
    .trim();
}

export async function generateJSON<T>(
  prompt: string,
  schema: z.ZodType<T>,
  options: GenerateJSONOptions = {},
): Promise<GenerateJSONResult<T>> {
  if (typeof window !== "undefined") {
    return {
      ok: false,
      error: "generateJSON hanya boleh dipanggil dari server.",
      attempts: 0,
    };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      ok: false,
      error:
        "GEMINI_API_KEY belum diisi di server. Isi di .env.local lalu coba lagi, atau lanjutkan dengan input manual.",
      attempts: 0,
    };
  }

  const model = options.model ?? DEFAULT_MODEL;
  const maxAttempts = (options.retries ?? 1) + 1;
  let lastError = "unknown error";

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await fetch(`${MODELS_BASE}/${model}:generateContent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: options.temperature ?? 0.7,
          },
        }),
        signal: AbortSignal.timeout(options.timeoutMs ?? 30_000),
      });

      if (!res.ok) {
        const detail = await res.text().catch(() => "");
        lastError = `Gemini HTTP ${res.status}: ${(detail || res.statusText).slice(0, 300)}`;
        continue;
      }

      const payload = (await res.json()) as GeminiResponse;
      const text = extractText(payload);
      if (!text) {
        lastError = "Respons AI kosong.";
        continue;
      }

      let raw: unknown;
      try {
        raw = parseModelJson(text);
      } catch {
        lastError = "Output AI bukan JSON valid.";
        continue;
      }

      const parsed = schema.safeParse(raw);
      if (parsed.success) {
        return { ok: true, data: parsed.data, attempts: attempt };
      }
      lastError = parsed.error.issues
        .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
        .join("; ");
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
    }
  }

  return {
    ok: false,
    error: `${lastError} — gagal setelah ${maxAttempts} percobaan.`,
    attempts: maxAttempts,
  };
}
