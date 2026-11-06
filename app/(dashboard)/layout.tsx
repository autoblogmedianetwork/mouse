import { headers } from "next/headers";
import { AppShell } from "@/components/app-shell";
import { wajibSesiHalaman } from "@/lib/supabase/server";

/**
 * Optimistic guard: keeps the shell and the page from rendering for a visitor
 * without a session, and hands the email to the sidebar. Every page repeats the
 * check with its own path as the destination (ADR 0014) — a layout does not
 * re-render on navigation, so it cannot be the only gate.
 *
 * `x-pathname` is set by proxy.ts; without it the fallback destination is the
 * dashboard, which is still a safe internal path.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = (await headers()).get("x-pathname") ?? "/";
  const sesi = await wajibSesiHalaman(pathname);

  return <AppShell email={sesi.email}>{children}</AppShell>;
}
