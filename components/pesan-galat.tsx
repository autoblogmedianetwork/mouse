"use client";

/**
 * Session-expiry affordance for API errors (ADR 0014).
 *
 * Route handlers answer 401 with JSON, so an expired session used to surface as
 * a sentence the user could not act on. `perluMasuk` adds a direct link to
 * /masuk?tujuan=<halaman ini>, and the magic link brings the user back to the
 * page they were on.
 *
 * Kept presentational: callers own the box (border, background, spacing) so the
 * same link fits a plain error line and a custom banner.
 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { tautanMasuk } from "@/lib/auth/tujuan";
import { cn } from "@/lib/utils";

export function TautanMasuk({ tujuan }: { tujuan?: string }) {
  const pathname = usePathname();

  return (
    <Link
      href={tautanMasuk(tujuan ?? pathname)}
      className="font-medium text-primary underline underline-offset-2 hover:text-primary-hover"
    >
      Masuk untuk melanjutkan →
    </Link>
  );
}

export function PesanGalat({
  pesan,
  perluMasuk = false,
  nada = "galat",
  className,
}: {
  pesan: string;
  /** True when the server answered 401: the sentence alone cannot be acted on. */
  perluMasuk?: boolean;
  /** "netral" for informational states such as "belum ada sesi". */
  nada?: "galat" | "netral";
  className?: string;
}) {
  return (
    <p
      role="alert"
      className={cn(
        "text-badan",
        nada === "galat" ? "text-status-failed" : "text-muted-foreground",
        className,
      )}
    >
      {pesan}
      {perluMasuk ? (
        <>
          {" "}
          <TautanMasuk />
        </>
      ) : null}
    </p>
  );
}
