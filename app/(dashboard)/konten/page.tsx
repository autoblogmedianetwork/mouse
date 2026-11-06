/**
 * Pustaka konten is now Antrian review (UI-Spec 3.9, PRD F10), so /konten only
 * forwards old links. Keeping the route avoids broken bookmarks and old export
 * instructions.
 */
import { redirect } from "next/navigation";
import { wajibSesiHalaman } from "@/lib/supabase/server";

export default async function KontenPage() {
  await wajibSesiHalaman("/konten");
  redirect("/antrian");
}
