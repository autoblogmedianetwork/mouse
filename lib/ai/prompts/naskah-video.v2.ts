/**
 * Prompt 9 — naskah video tiga bagian, versi v2 (gaya bahasa natural Indonesia).
 *
 * Wrapper di atas v1: struktur hook_visual / fungsi_produk / cta tetap dari v1;
 * blok `ATURAN_BAHASA` ditambahkan di akhir. v1 tidak diubah (AGENTS rule 13).
 */
export const PROMPT_VERSION = "naskah-video.v2";

import { buildNaskahVideoPrompt as buildV1 } from "./naskah-video.v1";
import { ATURAN_BAHASA } from "@/lib/ai/gaya-bahasa";

export type { NaskahVideoInput } from "./naskah-video.v1";

/** Same input as v1; only the final prompt text gets the language block. */
export function buildNaskahVideoPrompt(input: Parameters<typeof buildV1>[0]): string {
  return `${buildV1(input)}\n\n${ATURAN_BAHASA}`;
}
