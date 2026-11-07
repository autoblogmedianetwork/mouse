/**
 * Password rules for the fallback sign-in path (ADR 0016).
 *
 * Supabase itself accepts short passwords, so the app enforces the floor
 * before the value leaves the browser. Returns an Indonesian sentence for the
 * first problem found, or null when the password is acceptable.
 */

export const MIN_KATA_SANDI = 8;
/** bcrypt hashes at most 72 bytes, so anything longer is silently truncated. */
export const MAX_KATA_SANDI = 72;

export function validasiKataSandi(nilai: string): string | null {
  if (nilai.length < MIN_KATA_SANDI) {
    return `Kata sandi minimal ${MIN_KATA_SANDI} karakter.`;
  }
  if (nilai.length > MAX_KATA_SANDI) {
    return `Kata sandi maksimal ${MAX_KATA_SANDI} karakter.`;
  }
  if (!/\p{L}/u.test(nilai)) return "Kata sandi harus memuat huruf.";
  if (!/\d/.test(nilai)) return "Kata sandi harus memuat angka.";
  return null;
}
