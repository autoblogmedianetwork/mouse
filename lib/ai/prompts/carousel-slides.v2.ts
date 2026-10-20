/**
 * Prompt 8 — carousel slides, versi v2 (gaya bahasa natural Indonesia).
 *
 * Wrapper di atas v1: susunan slide, cover/isi/cta, dan schema tetap dari v1;
 * blok `ATURAN_BAHASA` ditambahkan di akhir. v1 tidak diubah (AGENTS rule 13).
 */
export const PROMPT_VERSION = "carousel-slides.v2";

import { buildCarouselPrompt as buildV1 } from "./carousel-slides.v1";
import { ATURAN_BAHASA } from "@/lib/ai/gaya-bahasa";

export type { CarouselRequest } from "@/lib/ai/schemas";

/** Same input as v1; only the final prompt text gets the language block. */
export function buildCarouselPrompt(input: Parameters<typeof buildV1>[0]): string {
  return `${buildV1(input)}\n\n${ATURAN_BAHASA}`;
}
