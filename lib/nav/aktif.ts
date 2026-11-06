/**
 * Active-route matching for the sidebar and breadcrumb (ADR 0013).
 *
 * Pure functions: the AppShell feeds a pathname and gets the owning menu item
 * back. Kept out of the component so the segment-boundary rule is testable
 * (AGENTS rule 14) — `/posting/baruan` must not light up `/posting/baru`.
 */

/** True when `pathname` is `href` itself or a child of it, on a segment boundary. */
export function cocokRute(pathname: string, href: string): boolean {
  // "/" only ever matches exactly, otherwise every route would be active.
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export interface MenuCocok {
  href: string;
  /** Sibling routes that belong to the same item (tabs inside one section). */
  hrefs?: readonly string[];
}

/**
 * Menu item owning this pathname, longest match first so a child route
 * (`/posting/baru/123`) never loses to a shorter neighbour. Null when no item
 * owns the path; the caller falls back to the raw pathname.
 */
export function menuUntuk<T extends MenuCocok>(
  pathname: string,
  items: readonly T[],
): T | null {
  let hasil: T | null = null;
  let panjang = -1;

  for (const item of items) {
    for (const href of [item.href, ...(item.hrefs ?? [])]) {
      if (!cocokRute(pathname, href)) continue;
      if (href.length > panjang) {
        panjang = href.length;
        hasil = item;
      }
    }
  }

  return hasil;
}
