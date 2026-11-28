"use client";

/**
 * ThreadsOtomatis — panel koneksi Threads API + antrean titip kirim
 * (Fase 7, ADR 0023). Persetujuan ganda: konten lolos checklist lalu
 * dititipkan eksplisit; kill switch satu klik; token tidak pernah
 * ditampilkan. Tanpa env server, panel menampilkan petunjuk pemasangan.
 */
import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/card";
import { StatusBadge } from "@/components/status-badge";

const tombol =
  "inline-flex h-11 sm:h-9 items-center border border-surface-border px-3 text-meta font-medium hover:bg-muted disabled:opacity-40";
const tombolUtama =
  "inline-flex h-11 sm:h-9 items-center bg-primary px-4 text-badan font-medium text-primary-foreground hover:opacity-90 disabled:opacity-40";

interface Antrean {
  id: string;
  judul: string;
  teks: string;
  jadwal_pada: string;
  status: string;
  pesan_galat: string | null;
}

interface Status {
  terkonfigurasi: boolean;
  terhubung: boolean;
  akun: { username: string; threadsUserId: string; tokenKedaluwarsa: string | null } | null;
  antrean: Antrean[];
}

export function ThreadsOtomatis() {
  const [status, setStatus] = useState<Status | null>(null);
  const [pesan, setPesan] = useState<string | null>(null);
  const [sibuk, setSibuk] = useState(false);

  const muat = useCallback(async () => {
    const res = await fetch("/api/threads/status");
    const j = (await res.json()) as Status & { ok: boolean };
    setStatus({ terkonfigurasi: j.terkonfigurasi, terhubung: j.terhubung, akun: j.akun, antrean: j.antrean });
  }, []);

  useEffect(() => {
    void muat();
    const params = new URLSearchParams(window.location.search);
    if (params.get("threads_ok")) setPesan("Akun Threads terhubung. Kiriman otomatis siap digunakan.");
    if (params.get("threads_galat")) setPesan(`Gagal menyambungkan: ${params.get("threads_galat")}`);
  }, [muat]);

  const putuskan = async () => {
    setSibuk(true);
    await fetch("/api/threads/putus", { method: "POST" });
    setPesan("Koneksi Threads diputus. Token dihapus dari server.");
    await muat();
    setSibuk(false);
  };

  const batalkanSemua = async () => {
    setSibuk(true);
    const res = await fetch("/api/threads/batalkan-semua", { method: "POST" });
    const j = (await res.json()) as { ok: boolean; dibatalkan?: number };
    setPesan(`Kill switch: ${j.dibatalkan ?? 0} kiriman terjadwal dibatalkan. Tidak ada yang akan terkirim otomatis.`);
    await muat();
    setSibuk(false);
  };

  const prosesSekarang = async () => {
    setSibuk(true);
    const res = await fetch("/api/threads/proses-jadwal", { method: "GET" });
    const j = (await res.json()) as { ok: boolean; sukses?: number; gagal?: number; alasan?: string };
    setPesan(
      j.ok && j.alasan === undefined
        ? `Proses selesai: ${j.sukses ?? 0} terkirim, ${j.gagal ?? 0} gagal.`
        : `Belum bisa memproses: ${j.alasan ?? "coba lagi"}`,
    );
    await muat();
    setSibuk(false);
  };

  const sambungkan = () => {
    window.location.href = "/api/threads/authorize";
  };

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-isi font-semibold">Kirim otomatis ke Threads (Fase 7)</h2>
          <p className="mt-1 text-badan text-muted-foreground">
            Jalur resmi Meta (Threads API). Persetujuan ganda: konten harus lolos checklist,
            lalu kamu menitipkannya lewat tombol Jadwalkan di Antrian. Kill switch selalu tersedia.
          </p>
        </div>
        {status?.terhubung ? <StatusBadge status="terkirim" /> : null}
      </div>

      {pesan ? (
        <p role="status" className="mt-3 border border-surface-border bg-muted/40 px-3 py-2 text-badan">
          {pesan}
        </p>
      ) : null}

      {status && !status.terkonfigurasi ? (
        <div className="mt-4 border border-surface-border bg-muted/40 p-3 text-badan text-muted-foreground">
          <p className="font-medium text-foreground">Belum dikonfigurasi di server (aman — tidak ada yang bisa terkirim).</p>
          <ol className="mt-2 list-decimal space-y-1 pl-5">
            <li>Buat Meta app di developers.facebook.com dengan use case &quot;Access the Threads API&quot;.</li>
            <li>Tambahkan redirect URI: <code className="bg-muted px-1 font-mono text-meta">https://DOMAINMU/auth/threads/callback</code></li>
            <li>Isi env di Vercel: <code className="bg-muted px-1 font-mono text-meta">THREADS_APP_ID</code>, <code className="bg-muted px-1 font-mono text-meta">THREADS_APP_SECRET</code>, <code className="bg-muted px-1 font-mono text-meta">CRON_SECRET</code>, <code className="bg-muted px-1 font-mono text-meta">SUPABASE_SERVICE_ROLE_KEY</code>.</li>
            <li>Jalankan migrasi 0016 di Supabase, lalu muat ulang halaman ini.</li>
          </ol>
        </div>
      ) : null}

      {status?.terkonfigurasi && !status.terhubung ? (
        <div className="mt-4">
          <button type="button" className={tombolUtama} onClick={sambungkan} disabled={sibuk}>
            Sambungkan akun Threads
          </button>
          <p className="mt-2 text-meta text-muted-foreground">
            Kamu akan diminta login Threads dan menyetujui izin posting. Token disimpan
            terenkripsi dan bisa diputus kapan pun di sini.
          </p>
        </div>
      ) : null}

      {status?.terhubung && status.akun ? (
        <div className="mt-4 space-y-4">
          <dl className="grid gap-2 text-badan sm:grid-cols-[auto_1fr]">
            <dt className="font-mono text-meta uppercase tracking-meta text-muted-foreground">Akun</dt>
            <dd>@{status.akun.username || status.akun.threadsUserId}</dd>
            <dt className="font-mono text-meta uppercase tracking-meta text-muted-foreground">Token</dt>
            <dd>
              berlaku sampai{" "}
              {status.akun.tokenKedaluwarsa
                ? new Date(status.akun.tokenKedaluwarsa).toLocaleDateString("id-ID")
                : "—"}{" "}
              (60 hari; sambungkan ulang bila kedaluwarsa)
            </dd>
          </dl>

          <div className="flex flex-wrap gap-2">
            <button type="button" className={tombol} onClick={prosesSekarang} disabled={sibuk}>
              Proses sekarang
            </button>
            <button type="button" className={tombol} onClick={sambungkan} disabled={sibuk}>
              Sambungkan ulang
            </button>
            <button
              type="button"
              className="inline-flex h-11 sm:h-9 items-center border border-status-failed/60 px-3 text-meta font-medium text-status-failed hover:bg-status-failed/10 disabled:opacity-40"
              onClick={batalkanSemua}
              disabled={sibuk}
            >
              Kill switch: batalkan semua jadwal
            </button>
            <button
              type="button"
              className="inline-flex h-11 sm:h-9 items-center border border-status-failed/60 px-3 text-meta font-medium text-status-failed hover:bg-status-failed/10 disabled:opacity-40"
              onClick={putuskan}
              disabled={sibuk}
            >
              Putuskan koneksi
            </button>
          </div>

          <div>
            <h3 className="text-badan font-semibold">Antrean titip kirim</h3>
            {status.antrean.length === 0 ? (
              <p className="mt-1 text-meta text-muted-foreground">
                Kosong. Titipkan dari Antrian: buka dialog jadwal, centang &quot;kirim otomatis&quot;.
              </p>
            ) : (
              <ul className="mt-2 divide-y divide-surface-border border border-surface-border">
                {status.antrean.map((b) => (
                  <li key={b.id} className="flex items-start justify-between gap-3 p-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-badan font-medium">{b.judul || "(tanpa judul)"}</p>
                      <p className="truncate text-meta text-muted-foreground">
                        {new Date(b.jadwal_pada).toLocaleString("id-ID")} · {b.teks.slice(0, 60)}
                        {b.teks.length > 60 ? "…" : ""}
                      </p>
                      {b.pesan_galat ? (
                        <p className="text-meta text-status-failed">{b.pesan_galat}</p>
                      ) : null}
                    </div>
                    <StatusBadge status={b.status === "terjadwal" ? "terjadwal" : b.status === "terkirim" ? "terkirim" : "gagal"} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </Card>
  );
}
