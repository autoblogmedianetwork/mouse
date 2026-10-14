/**
 * Preview suara narasi (N-6) memakai Web Speech API di browser.
 *
 * Ini BUKAN pengganti provider TTS: hanya untuk cek cepat di perangkat user.
 * Karena itu tidak ada kunci API, tidak ada panggilan jaringan, dan tidak ada
 * env flag seperti tools media lain — yang diperiksa hanya dukungan browser
 * (`isAvailable()`), sesuai aturan menampilkan tombol media.
 */

export interface SuaraBrowser {
  nama: string;
  lang: string;
}

/** True kalau browser punya speechSynthesis dan utterance (dipakai UI). */
export function isAvailable(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.speechSynthesis !== "undefined" &&
    typeof window.SpeechSynthesisUtterance !== "undefined"
  );
}

/**
 * Suara Indonesia bila tersedia, kalau tidak suara pertama. Mengembalikan null
 * kalau daftar kosong, supaya pemanggil memakai suara default browser.
 */
export function pilihSuaraIndonesia(daftar: SuaraBrowser[]): SuaraBrowser | null {
  const indonesia = daftar.find((s) => s.lang.toLowerCase().startsWith("id"));
  return indonesia ?? daftar[0] ?? null;
}

/** Teks yang dibacakan: satu status per baris, tanpa status kosong. */
export function teksUntukDibaca(statuses: string[]): string {
  return statuses
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .join("\n");
}
