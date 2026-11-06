"use client";

/**
 * Sidebar session indicator (ADR 0014): who is signed in, and one way out.
 *
 * The email arrives as a prop from the dashboard layout, which reads it from
 * the verified JWT — no extra client request and no unverified user object.
 * Signing out clears the Supabase cookies, then refreshes so every server
 * component re-runs its guard.
 */
import { useRouter } from "next/navigation";
import { useState } from "react";
import { klienPeramban } from "@/lib/supabase/klien";

const mikro = "font-mono text-meta uppercase tracking-meta";

export function ShellPengguna({ email }: { email: string | null }) {
  const router = useRouter();
  const [sibuk, setSibuk] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);

  const keluar = async () => {
    const supabase = klienPeramban();
    if (!supabase) return;
    setSibuk(true);
    setGalat(null);
    const { error } = await supabase.auth.signOut();
    setSibuk(false);
    if (error) {
      setGalat("Gagal keluar. Coba lagi.");
      return;
    }
    router.replace("/masuk");
    router.refresh();
  };

  return (
    <div className="mt-2">
      <p className="text-meta break-all text-foreground">{email ?? "Sesi aktif"}</p>
      <button
        type="button"
        onClick={() => void keluar()}
        disabled={sibuk}
        className={`${mikro} mt-2 inline-flex h-9 w-full items-center justify-center border-2 border-foreground px-3 font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-60`}
      >
        {sibuk ? "Keluar…" : "Keluar"}
      </button>
      {galat ? (
        <p aria-live="assertive" role="alert" className={`${mikro} mt-2 text-status-failed`}>
          ! {galat}
        </p>
      ) : null}
    </div>
  );
}
