"use client";

/**
 * Password door for `/masuk` (ADR 0016).
 *
 * Magic links depend on Supabase delivering email; its built-in mailer only
 * reaches project team members and allows two messages per hour. This form is
 * the fallback that never touches email:
 *
 *   - mode="masuk"  email + kata sandi -> signInWithPassword
 *   - mode="atur"   kata sandi baru     -> updateUser (needs an active session)
 *
 * Styling follows the same Swiss Industrial vocabulary as the magic-link form
 * so the card stays one piece: mono uppercase labels, square 2px borders.
 */
import { useRouter } from "next/navigation";
import { useState } from "react";
import { validasiKataSandi } from "@/lib/auth/kata-sandi";
import { tujuanAman } from "@/lib/auth/tujuan";
import { klienPeramban, PESAN_ENV_KURANG, supabaseSiap } from "@/lib/supabase/klien";

const mikro = "font-mono text-meta uppercase tracking-meta";
const FIELD_CLASS =
  "h-12 w-full border-2 border-foreground bg-background px-3 font-mono text-badan outline-none focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-primary sm:h-14 sm:text-base";
const TOMBOL =
  "inline-flex h-12 items-center justify-center border-2 border-foreground bg-primary px-4 font-mono text-badan font-semibold uppercase tracking-meta text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-60 sm:h-14";

export function FormKataSandi({
  mode,
  tujuan,
}: {
  mode: "masuk" | "atur";
  tujuan?: string;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [sandi, setSandi] = useState("");
  const [ulangi, setUlangi] = useState("");
  const [sibuk, setSibuk] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);
  const [pesan, setPesan] = useState<string | null>(null);
  const siap = supabaseSiap();

  const gagal = (teks: string) => {
    setPesan(null);
    setGalat(teks);
  };

  const kirim = async () => {
    setGalat(null);
    setPesan(null);

    const supabase = klienPeramban();
    if (!supabase) {
      gagal(PESAN_ENV_KURANG);
      return;
    }

    const masalah = validasiKataSandi(sandi);
    if (masalah) {
      gagal(masalah);
      return;
    }

    if (mode === "masuk") {
      const normal = email.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(normal)) {
        gagal("Format email belum benar. Contoh: nama@email.com");
        return;
      }
      setSibuk(true);
      const { error } = await supabase.auth.signInWithPassword({
        email: normal,
        password: sandi,
      });
      setSibuk(false);
      if (error) {
        gagal(
          error.message === "Invalid login credentials"
            ? "Email atau kata sandi tidak cocok."
            : error.message,
        );
        return;
      }
      // Guard server membaca cookie sesi, jadi muat ulang rute tujuan.
      router.replace(tujuanAman(tujuan));
      router.refresh();
      return;
    }

    if (sandi !== ulangi) {
      gagal("Ulangi kata sandi belum sama.");
      return;
    }
    setSibuk(true);
    const { error } = await supabase.auth.updateUser({ password: sandi });
    setSibuk(false);
    if (error) {
      gagal(error.message);
      return;
    }
    setSandi("");
    setUlangi("");
    setPesan("Kata sandi tersimpan. Mulai sekarang bisa masuk tanpa email.");
  };

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        void kirim();
      }}
    >
      {mode === "masuk" ? (
        <div>
          <label htmlFor="ks-email" className={`${mikro} mb-2 block`}>
            &lt; ALAMAT EMAIL &gt;
          </label>
          <input
            id="ks-email"
            type="email"
            inputMode="email"
            autoComplete="username"
            className={FIELD_CLASS}
            placeholder="NAMA@EMAIL.COM"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={sibuk}
          />
        </div>
      ) : null}

      <div>
        <label htmlFor="ks-sandi" className={`${mikro} mb-2 block`}>
          &lt; {mode === "masuk" ? "KATA SANDI" : "KATA SANDI BARU"} &gt;
        </label>
        <input
          id="ks-sandi"
          type="password"
          autoComplete={mode === "masuk" ? "current-password" : "new-password"}
          className={FIELD_CLASS}
          placeholder="MINIMAL 8 KARAKTER, HURUF + ANGKA"
          value={sandi}
          onChange={(e) => setSandi(e.target.value)}
          disabled={sibuk}
        />
      </div>

      {mode === "atur" ? (
        <div>
          <label htmlFor="ks-ulangi" className={`${mikro} mb-2 block`}>
            &lt; ULANGI KATA SANDI &gt;
          </label>
          <input
            id="ks-ulangi"
            type="password"
            autoComplete="new-password"
            className={FIELD_CLASS}
            value={ulangi}
            onChange={(e) => setUlangi(e.target.value)}
            disabled={sibuk}
          />
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button type="submit" className={TOMBOL} disabled={sibuk}>
          {sibuk ? "MEMPROSES…" : mode === "masuk" ? "MASUK >>>" : "SIMPAN KATA SANDI >>>"}
        </button>
        {mode === "masuk" ? (
          <p className={`${mikro} text-muted-foreground`}>Tanpa menunggu email</p>
        ) : null}
      </div>

      {pesan ? (
        <p
          className={`${mikro} border-2 border-foreground bg-muted px-3 py-2 text-status-ready`}
          aria-live="polite"
          role="status"
        >
          + OK: {pesan}
        </p>
      ) : null}
      {galat ? (
        <p
          className={`${mikro} border-2 border-status-failed bg-background px-3 py-2 text-status-failed`}
          aria-live="assertive"
          role="alert"
        >
          ! GALAT: {galat}
        </p>
      ) : null}
      {!siap ? (
        <p className={`${mikro} border-2 border-status-failed px-3 py-2 text-status-failed`}>
          ! {PESAN_ENV_KURANG}
        </p>
      ) : null}
    </form>
  );
}
