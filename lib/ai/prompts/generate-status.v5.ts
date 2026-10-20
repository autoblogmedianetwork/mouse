/**
 * Prompt 3 — generate status, versi v5 (gaya bahasa natural Indonesia).
 *
 * Wrapper di atas v4: semua instruksi (kategori penawaran, hook, persona)
 * tetap dibangun di v4, lalu blok `ATURAN_BAHASA` dari `lib/ai/gaya-bahasa.ts`
 * ditambahkan di akhir. v4 tidak diubah (AGENTS rule 13).
 */
export const PROMPT_VERSION = "generate-status.v5";

import { buildGenerateStatusPrompt as buildV4 } from "./generate-status.v4";
import { ATURAN_BAHASA } from "@/lib/ai/gaya-bahasa";

export type { GenerateStatusInput } from "./generate-status.v4";

/** Same input as v4; only the final prompt text gets the language block. */
export function buildGenerateStatusPrompt(input: Parameters<typeof buildV4>[0]): string {
  return `${buildV4(input)}\n\n${ATURAN_BAHASA}`;
}
