"use client";

/**
 * Magic-link form (K4) — gerbang Swiss Industrial Print.
 *
 * Bahasa visual: kertas terang, garis tegas 90 derajat (tanpa border-radius),
 * tipografi struktural raksasa dengan clamp(), metadata monospace uppercase,
 * dan penanda ASCII. Warna mengikuti token aplikasi (primary oranye tetap
 * aksen utama; merah khusus galat) supaya halaman tetap satu keluarga dengan
 * dashboard. Mobile diproporsional lewat fluid type dan target sentuh >= 44px.
 *
 * Logika tidak berubah dari versi sebelumnya: membaca `?galat=` dari URL,
 * mengambil sesi aktif, mengirim OTP, dan keluar.
 */
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { klienPeramban, PESAN_ENV_KURANG, supabaseSiap } from "@/lib/supabase/klien";

/** Label form, metadata, dan tombol memakai gaya terminal: mono + uppercase. */
const mikro = "font-mono text-[11px] uppercase tracking-[0.08em]";
const garis = "border-foreground";

const FIELD_CLASS =
  "!rounded-none h-12 w-full border-2 border-foreground bg-background px-3 font-mono text-sm uppercase tracking-[0.05em] outline-none focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-primary sm:h-14 sm:text-base";
const TOMBOL_UTAMA =
  "!rounded-none inline-flex h-12 w-full items-center justify-center gap-2 border-2 border-foreground bg-primary px-4 font-mono text-sm font-semibold uppercase tracking-[0.08em] text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-60 sm:h-14 sm:w-auto sm:justify-start";
const TOMBOL_GHOST =
  "!rounded-none inline-flex h-11 items-center justify-center border-2 border-foreground px-4 font-mono text-xs font-medium uppercase tracking-[0.08em] transition-colors hover:bg-muted";

/** Judul struktural raksasa: mengecil proporsional di mobile lewat clamp. */
const JUDUL = "font-sans font-black uppercase leading-[0.9] tracking-[-0.04em] text-[clamp(2.75rem,11vw,6rem)]";

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
    const normal = email.trim();
    if (normal === "") {
      setGalat("Isi alamat email dulu.");
      return;
    }
    // Validasi sederhana sebelum kirim: gagal dini lebih jelas daripada balikan
    // error Supabase yang teknis.
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(normal)) {
      setGalat("Format email belum benar. Contoh: nama@email.com");
      return;
    }
    setSibuk(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: normal,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setSibuk(false);
    if (error) {
      setGalat(error.message);
      return;
    }
    setPesan(`Tautan login dikirim ke ${normal}. Buka email itu di peramban ini.`);
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
    <section
      aria-labelledby="masuk-judul"
      className={`!rounded-none bg-surface ${garis} border-2`}
    >
      {emailAktif ? (
        /* Sesi aktif: panel status sederhana dengan penanda setor. */ (
          <div className="divide-y divide-surface-border">
            <div className="flex items-center justify-between gap-3 border-b-2 border-foreground px-4 py-3 sm:px-6">
              <span className={mikro}>Status sesi</span>
              <span className={`${mikro} text-status-ready`}>AKTIF ///</span>
            </div>
            <dl className="grid gap-4 px-4 py-5 sm:grid-cols-[auto_1fr] sm:px-6">
              <dt className={mikro}>Masuk sebagai</dt>
              <dd className="font-mono text-sm font-medium break-all">{emailAktif}</dd>
            </dl>
            <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:p-6">
              <button type="button" className={TOMBOL_GHOST} onClick={keluar}>
                Keluar
              </button>
              <Link href="/antrian" className={TOMBOL_GHOST}>
                Buka Antrian review &gt;&gt;&gt;
              </Link>
            </div>
          </div>
        )
      ) : (
        /* Belum masuk: blok struktural dengan judul raksasa. */ (
          <>
            <p className={`${mikro} border-b-2 border-foreground bg-muted px-4 py-2 sm:px-6`}>
              [ AKSES ] HEAVILIATE DASHBOARD &nbsp;·&nbsp; REV 2026.10
            </p>
            <div className="px-4 pt-6 pb-2 sm:px-6">
              <h2 id="masuk-judul" className={JUDUL}>
                MASUK
              </h2>
              <p className="mt-3 max-w-md text-sm text-muted-foreground sm:text-base">
                Satu email, tanpa kata sandi. Tautan sekali pakai dikirim ke kotak masuk Anda dan
                berlaku sebentar.
              </p>
            </div>
            <form
              className="flex flex-col gap-4 border-t-2 border-foreground p-4 sm:p-6"
              onSubmit={(e) => {
                e.preventDefault();
                void kirimTautan();
              }}
            >
              <div>
                <label htmlFor="email" className={`${mikro} mb-2 block`}>
                  &lt; ALAMAT EMAIL &gt;
                </label>
                <input
                  id="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  className={FIELD_CLASS}
                  placeholder="NAMA@EMAIL.COM"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={sibuk}
                />
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <button type="submit" className={TOMBOL_UTAMA} disabled={sibuk}>
                  {sibuk ? "MENGIRIM…" : "KIRIM TAUTAN LOGIN >>>"}
                </button>
                <p className={`${mikro} text-muted-foreground`}>
                  ENTER = kirim &nbsp;·&nbsp; tanpa kata sandi
                </p>
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
              {galatTampil ? (
                <p
                  className={`${mikro} border-2 border-status-failed bg-background px-3 py-2 text-status-failed`}
                  aria-live="assertive"
                  role="alert"
                >
                  ! GALAT: {galatTampil}
                </p>
              ) : null}
              {!siap ? (
                <p className={`${mikro} border-2 border-status-failed px-3 py-2 text-status-failed`}>
                  ! {PESAN_ENV_KURANG}
                </p>
              ) : null}
            </form>
          </>
        )
      )}
    </section>
  );
}
