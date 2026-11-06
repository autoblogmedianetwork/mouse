import { cn } from "@/lib/utils";

/**
 * Card (ADR 0013) — the single block shell for the whole app.
 *
 * Replaces the class string that was copied into 54 places ("rounded-xl border
 * border-surface-border bg-surface p-4 sm:p-6"). Border is 2px per UI-Spec
 * section 6; internal separators stay 1px surface-border at the call site.
 * Square by design (ADR 0013): no rounded-* class belongs here. The global
 * !important guard that used to enforce this is gone, so a class added here
 * would actually render.
 *
 * `cn` is a plain join, not tailwind-merge, so two utilities setting the same
 * CSS property would be resolved by stylesheet order instead of class order.
 * That is why tone is a prop rather than a className: `nada="aksen"` is the
 * only supported way to change the border and background.
 */
export function Card({
  className,
  padat = false,
  nada = "netral",
  ...props
}: React.ComponentProps<"div"> & {
  /** Dense shell without padding, for blocks whose child is a full-bleed table. */
  padat?: boolean;
  /** "aksen" gives the block the primary border and tint, for callouts. */
  nada?: "netral" | "aksen";
}) {
  return (
    <div
      className={cn(
        "border-2",
        nada === "aksen" ? "border-primary bg-primary/5" : "border-foreground bg-surface",
        padat ? undefined : "p-4 sm:p-6",
        className,
      )}
      {...props}
    />
  );
}
