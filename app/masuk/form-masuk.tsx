"use client";

/**
 * Magic-link form (K4). Reads `?galat=` straight from the URL so no state has
 * to be set inside an effect, and shows the current session when one exists.
 *
 * The app still works from localStorage when signed out, so this page explains
 * what login is for instead of blocking the rest of the app.
 */
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { klienPeramban, PESAN_ENV_KURANG, supabaseSiap } from "@/lib/supabase/klien";

const inputClass =
  "w-full rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary";
const btnUtama =
  "inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-60";
const btnGhost = "rounded-lg border border-surface-border px-3 py-1.5 text-xs font-medium hover:bg-muted";

export function FormMasuk() {
  const galatUrl = useSearchParams().get("galat");
  const [email, setEmail] = useState("");
  const [emailAktif, setEmailAktif] = useState<string | null>(null);
  const [pesan, setPesan] = useState<string | null>(null);
  const [galat, setGalat] = useState<string | null>(null);
  const [sibuk, setSibuk] = useState(false);
  const siap = supabaseSiap();

  useEffect(() => {
    const supabase = klienPeramban();
    if (!supabase) return;
    void supabase.auth.getUser().then(({ data }) => {
      setEmailAktif(data.user?.email ?? null);
    });
  }, []);

  const kirimTautan = async () => {
    setGalat(null);
    setPesan(null);
    const supabase = klienPeramban();
    if (!supabase) {
      setGalat(PESAN_ENV_KURANG);
      return;
    }
    if (email.trim() === "") {
      setGalat("Isi alamat email dulu.");
      return;
    }
    setSibuk(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setSibuk(false);
    if (error) {
      setGalat(error.message);
      return;
    }
    setPesan(`Tautan login dikirim ke ${email.trim()}. Buka email itu di peramban ini.`);
  };

  const keluar = async () => {
    const supabase = klienPeramban();
    if (!supabase) return;
    await supabase.auth.signOut();
    setEmailAktif(null);
    setPesan("Anda sudah keluar.");
  };

  const galatTampil = galat ?? galatUrl;

  return (
    <section className="max-w-xl space-y-4 rounded-xl border border-surface-border bg-surface p-4 sm:p-6">
      {!siap ? (
        <p className="text-sm text-status-failed">{PESAN_ENV_KURANG}</p>
      ) : emailAktif ? (
        <div className="space-y-3">
          <p className="text-sm">
            Masuk sebagai <span className="font-medium">{emailAktif}</span>.
          </p>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={btnGhost} onClick={keluar}>
              Keluar
            </button>
            <Link href="/antrian" className={btnGhost}>
              Buka Antrian review
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <label className="block text-sm font-medium" htmlFor="email">
            Alamat email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className={inputClass}
            placeholder="nama@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void kirimTautan();
            }}
          />
          <button type="button" className={btnUtama} onClick={kirimTautan} disabled={sibuk}>
            {sibuk ? "Mengirim…" : "Kirim tautan login"}
          </button>
          <p className="text-xs text-muted-foreground">
            Tidak ada kata sandi. Anda menerima tautan sekali pakai yang berlaku sebentar.
          </p>
        </div>
      )}

      {pesan ? (
        <p className="text-sm text-status-ready" aria-live="polite">
          {pesan}
        </p>
      ) : null}
      {galatTampil ? (
        <p className="text-sm text-status-failed" aria-live="assertive">
          {galatTampil}
        </p>
      ) : null}
    </section>
  );
}
