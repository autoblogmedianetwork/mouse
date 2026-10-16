import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import {
  DEFAULT_BASE_URL,
  DEFAULT_MODEL,
  generateJSON,
  resolveApiKey,
  resolveBaseURL,
  resolveModel,
} from "./generate-json";

/**
 * Provider chat bebas lewat endpoint OpenAI-compatible apa pun (ADR 0006).
 * Yang dijaga tes ini: AI_BASE_URL / AI_MODEL / AI_API_KEY benar-benar
 * berpengaruh, bukan sekadar tercatat di env.example.
 */

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

/**
 * Respons `/chat/completions` sukses dengan satu jawaban JSON. Dibuat baru tiap
 * panggilan: body `Response` tidak bisa dibaca dua kali, jadi satu instance yang
 * dipakai ulang akan membuat percobaan kedua gagal membaca body.
 */
function chatResponse(content: string) {
  return () =>
    Promise.resolve(
      new Response(JSON.stringify({ choices: [{ message: { content } }] }), { status: 200 }),
    );
}

describe("resolveModel", () => {
  it("mendahulukan opsi eksplisit di atas environment", () => {
    expect(resolveModel("deepseek-chat", "meta/llama")).toBe("deepseek-chat");
  });

  it("memakai AI_MODEL bila opsi tidak diberikan", () => {
    expect(resolveModel(undefined, "deepseek-chat")).toBe("deepseek-chat");
  });

  it("jatuh ke DEFAULT_MODEL saat keduanya kosong", () => {
    expect(resolveModel()).toBe(DEFAULT_MODEL);
    expect(resolveModel(undefined, "")).toBe(DEFAULT_MODEL);
  });

  it("membuang spasi di ujung supaya tidak jadi nama model yang rusak", () => {
    expect(resolveModel("  deepseek-chat  ")).toBe("deepseek-chat");
    expect(resolveModel(undefined, "\tdeepseek-chat\n")).toBe("deepseek-chat");
  });

  it("mengabaikan nilai yang hanya berisi spasi", () => {
    expect(resolveModel("   ", "  ")).toBe(DEFAULT_MODEL);
  });

  it("mendeteksi jika AI_MODEL berisi URL dan menukarnya dengan base URL bila sesuai", () => {
    expect(resolveModel(undefined, "https://openrouter.ai/api/v1", "nvidia/nemotron")).toBe("nvidia/nemotron");
    expect(resolveModel(undefined, "https://openrouter.ai/api/v1")).toBe(DEFAULT_MODEL);
  });
});

describe("resolveBaseURL", () => {
  it("mendeteksi jika AI_BASE_URL bukan URL tapi AI_MODEL berisi URL", () => {
    expect(resolveBaseURL(undefined, "nvidia/nemotron", "https://openrouter.ai/api/v1")).toBe(
      "https://openrouter.ai/api/v1",
    );
  });
  it("memakai AI_BASE_URL bila diisi", () => {
    expect(resolveBaseURL(undefined, "https://api.deepseek.com/v1")).toBe(
      "https://api.deepseek.com/v1",
    );
  });

  it("membuang trailing slash supaya tidak jadi // ganda", () => {
    expect(resolveBaseURL(undefined, "https://api.deepseek.com/v1/")).toBe(
      "https://api.deepseek.com/v1",
    );
    expect(resolveBaseURL("https://openrouter.ai/api/v1///")).toBe(
      "https://openrouter.ai/api/v1",
    );
  });

  it("memakai DEFAULT_BASE_URL saat kosong", () => {
    expect(resolveBaseURL()).toBe(DEFAULT_BASE_URL);
    expect(resolveBaseURL(undefined, "  ")).toBe(DEFAULT_BASE_URL);
  });
});

describe("resolveApiKey", () => {
  it("mendahulukan AI_API_KEY di atas OPENROUTER_API_KEY", () => {
    vi.stubEnv("AI_API_KEY", "kunci-utama");
    vi.stubEnv("OPENROUTER_API_KEY", "kunci-cadangan");
    expect(resolveApiKey()).toBe("kunci-utama");
  });

  it("memakai OPENROUTER_API_KEY bila AI_API_KEY kosong", () => {
    vi.stubEnv("AI_API_KEY", "");
    vi.stubEnv("OPENROUTER_API_KEY", "kunci-cadangan");
    expect(resolveApiKey()).toBe("kunci-cadangan");
  });

  it("mengembalikan undefined bila keduanya kosong", () => {
    vi.stubEnv("AI_API_KEY", "");
    vi.stubEnv("OPENROUTER_API_KEY", "");
    expect(resolveApiKey()).toBeUndefined();
  });
});

describe("generateJSON memakai environment", () => {
  it("mengirim AI_MODEL ke body panggilan chat/completions", async () => {
    vi.stubEnv("AI_API_KEY", "kunci-uji");
    vi.stubEnv("AI_MODEL", "deepseek-chat");
    const fetchMock = vi.fn().mockImplementation(chatResponse('{"a":1}'));
    vi.stubGlobal("fetch", fetchMock);

    const hasil = await generateJSON("prompt uji", z.object({ a: z.number() }));

    expect(hasil.ok).toBe(true);
    expect(hasil.data).toEqual({ a: 1 });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe(`${DEFAULT_BASE_URL}/chat/completions`);

    const body = JSON.parse(String(init.body));
    expect(body.model).toBe("deepseek-chat");
    expect(body.response_format).toEqual({ type: "json_object" });

    // Kunci hanya lewat header, tidak pernah masuk URL maupun body (AGENTS aturan 11).
    expect(String(url)).not.toContain("kunci-uji");
    expect(String(init.body)).not.toContain("kunci-uji");
    expect(init.headers.Authorization).toBe("Bearer kunci-uji");
  });

  it("memakai AI_BASE_URL bila provider diganti", async () => {
    vi.stubEnv("AI_API_KEY", "kunci-uji");
    vi.stubEnv("AI_BASE_URL", "https://api.deepseek.com/v1");
    const fetchMock = vi.fn().mockImplementation(chatResponse('{"a":1}'));
    vi.stubGlobal("fetch", fetchMock);

    await generateJSON("prompt uji", z.object({ a: z.number() }));

    expect(String(fetchMock.mock.calls[0][0])).toBe(
      "https://api.deepseek.com/v1/chat/completions",
    );
  });

  it("memakai model bawaan saat AI_MODEL tidak diisi", async () => {
    vi.stubEnv("AI_API_KEY", "kunci-uji");
    vi.stubEnv("AI_MODEL", "");
    const fetchMock = vi.fn().mockImplementation(chatResponse('{"a":1}'));
    vi.stubGlobal("fetch", fetchMock);

    await generateJSON("prompt uji", z.object({ a: z.number() }));

    const body = JSON.parse(String(fetchMock.mock.calls[0][1].body));
    expect(body.model).toBe(DEFAULT_MODEL);
  });

  it("meringkas pesan error provider, bukan menampilkan JSON mentah", async () => {
    vi.stubEnv("AI_API_KEY", "kunci-salah");
    // Respons baru tiap percobaan: body Response tidak bisa dibaca dua kali.
    const fetchMock = vi.fn().mockImplementation(async () =>
      Promise.resolve(
        new Response(JSON.stringify({ error: { message: "User not found.", code: 401 } }), {
          status: 401,
          statusText: "Unauthorized",
        }),
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const hasil = await generateJSON("prompt uji", z.object({ a: z.number() }));

    expect(hasil.ok).toBe(false);
    expect(hasil.error).toContain("HTTP 401: User not found.");
    expect(hasil.error).toContain("gagal setelah 2 percobaan");
    expect(hasil.error).not.toContain('"code":401');
  });

  it("menolak jalan tanpa API key tanpa menyentuh jaringan", async () => {
    vi.stubEnv("AI_API_KEY", "");
    vi.stubEnv("OPENROUTER_API_KEY", "");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const hasil = await generateJSON("prompt uji", z.object({ a: z.number() }));

    expect(hasil.ok).toBe(false);
    expect(hasil.error).toContain("AI_API_KEY (atau OPENROUTER_API_KEY) belum diisi di server");
    expect(hasil.attempts).toBe(0);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
