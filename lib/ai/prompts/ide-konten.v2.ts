/**
 * Prompt 2 — ide konten, versi v2 (gaya bahasa natural Indonesia).
 *
 * Wrapper di atas v1: 10 ide, label format, dan jembatan tetap dari v1; blok
 * `ATURAN_BAHASA` ditambahkan di akhir. v1 tidak diubah (AGENTS rule 13).
 */
export const PROMPT_VERSION = "ide-konten.v2";

import { buildIdeKontenPrompt as buildV1 } from "./ide-konten.v1";
import { ATURAN_BAHASA } from "@/lib/ai/gaya-bahasa";

export type { IdeInput, Analisis } from "./ide-konten.v1";

/** Same input as v1; only the final prompt text gets the language block. */
export function buildIdeKontenPrompt(input: Parameters<typeof buildV1>[0]): string {
  return `${buildV1(input)}\n\n${ATURAN_BAHASA}`;
}
