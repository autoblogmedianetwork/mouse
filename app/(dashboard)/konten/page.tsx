/**
 * Pustaka konten is now Antrian review (UI-Spec 3.9, PRD F10), so /konten only
 * forwards old links. Keeping the route avoids broken bookmarks and old export
 * instructions.
 */
import { redirect } from "next/navigation";

export default function KontenPage() {
  redirect("/antrian");
}
