/**
 * Shared language block for every AI prompt (keputusan ADR 0010).
 *
 * ALL output must sound like a real person typing on social media in
 * Indonesian, not translated corporate text. Every new prompt version
 * appends this block; older prompt files stay untouched (AGENTS rule 13).
 * Do not translate to English: the model reads the prompt in Indonesian.
 */
export const ATURAN_BAHASA = `GAYA BAHASA (WAJIB, berlaku untuk SEMUA teks yang kamu hasilkan):
- Tulis bahasa Indonesia natural khas media sosial: kasual, mengalir, seperti orang asli lagi ngetik—bukan bahasa baku, bukan kalimat terjemahan kaku.
- Pakai kata sehari-hari: "bikin", "banget", "kayak". HARAM pakai kata formal: "merupakan", "disarankan", "tersebut", "memungkinkan", "sebagaimana".
- Kalimat pendek-pendek dan bervariasi panjangnya. Satu status boleh cuma satu kalimat tajam lagi trackable, bukan paragraf rapor-dan-teteh.
- HARAM pembuka generik ala AI: "Dalam dunia yang...", "Mari kita telusuri...", "Siapa sangka...".
- Tetap jujur sesuai data: bahasa santai BUKAN alasan mengarang klaim, harga, atau spesifikasi.`;
