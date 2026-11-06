/**
 * Kalender route entry.
 *
 * The screen itself is a client component (drag-and-drop, localStorage content
 * store), and a client component cannot await the server guard. So the guard
 * stays here, on the server, and only renders the client body once a session
 * exists (ADR 0014).
 */
import { wajibSesiHalaman } from "@/lib/supabase/server";
import KalenderKlien from "./kalender-klien";

export const metadata = { title: "Kalender" };

export default async function KalenderPage() {
  await wajibSesiHalaman("/kalender");

  return <KalenderKlien />;
}
