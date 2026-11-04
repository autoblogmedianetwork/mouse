/**
 * Prompt 3 — generate status, versi v6 (kerangka penulisan).
 *
 * Wrapper di atas v5: seluruh instruksi v5 (kategori, hook, persona, gaya
 * bahasa natural) tetap utuh; v6 menambahkan blok kerangka dari
 * `lib/ai/kerangka.ts` sesuai pilihan user. Dengan `kerangka: "bebas"` prompt
 * yang dihasilkan identik dengan v5, sehingga draf lama tidak berubah perilaku.
 *
 * v5 dan versi sebelumnya tidak diubah (AGENTS rule 13).
 */
export const PROMPT_VERSION = "generate-status.v6";

import { buildGenerateStatusPrompt as buildV5 } from "./generate-status.v5";
import { instruksiKerangka } from "@/lib/ai/kerangka";

export type { GenerateStatusInput } from "./generate-status.v5";

/**
 * Blok kerangka diletakkan setelah blok gaya bahasa: aturan bahasa berlaku
 * untuk semua bagian, kerangka hanya mengatur urutannya.
 */
export function buildGenerateStatusPrompt(input: Parameters<typeof buildV5>[0]): string {
  const dasar = buildV5(input);
  const kerangka = instruksiKerangka(input.pengaturan.kerangka);
  return kerangka ? `${dasar}\n\n${kerangka}` : dasar;
}
