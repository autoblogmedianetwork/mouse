/**
 * Prompt 1 — analisis penawaran, versi v3 (gaya bahasa natural Indonesia).
 *
 * Wrapper di atas v2: cabang Marketplace dan Non-Marketplace tetap dibangun di
 * v2; blok `ATURAN_BAHASA` ditambahkan di akhir. v2 tidak diubah (AGENTS rule 13).
 */
export const PROMPT_VERSION = "analisis-penawaran.v3";

import { buildAnalisisPenawaranPrompt as buildV2 } from "./analisis-penawaran.v2";
import { ATURAN_BAHASA } from "@/lib/ai/gaya-bahasa";

/** Same input as v2; only the final prompt text gets the language block. */
export function buildAnalisisPenawaranPrompt(input: Parameters<typeof buildV2>[0]): string {
  return `${buildV2(input)}\n\n${ATURAN_BAHASA}`;
}
