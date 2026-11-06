/**
 * Post-login destination (`?tujuan=` / `?next=`).
 *
 * The value arrives from the URL, so it is untrusted: only internal paths are
 * allowed. `//host` and `/\host` are rejected because browsers normalise the
 * backslash to a slash and would leave the app.
 */
export function tujuanAman(next: string | null | undefined): string {
  if (!next) return "/";
  const trimmed = next.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//") || trimmed.startsWith("/\\")) {
    return "/";
  }
  // Control characters can smuggle a newline into a Location header.
  if (/[\u0000-\u001f\u007f]/.test(trimmed)) return "/";
  return trimmed;
}

/** `/masuk?tujuan=...`, keeping the destination readable in the address bar. */
export function tautanMasuk(tujuan: string): string {
  const aman = tujuanAman(tujuan);
  if (aman === "/") return "/masuk";
  return `/masuk?tujuan=${encodeURIComponent(aman)}`;
}
