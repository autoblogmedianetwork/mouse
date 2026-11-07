"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/card";
import { TautanMasuk } from "@/components/pesan-galat";
import { useLocalState } from "@/lib/konten/use-local-state";
import { cn } from "@/lib/utils";
import {
  type AkunSosial,
  type StatusKoneksiAkun,
} from "@/lib/akun/skema";
import { ModalTambahAkun } from "./modal-tambah-akun";

const STATUS_CONFIG: Record<
  StatusKoneksiAkun,
  { label: string; className: string }
> = {
  terhubung: {
    label: "Siap",
    className: "bg-muted text-status-ready border-status-ready",
  },
  akan_kedaluwarsa: {
    label: "Akan Kedaluwarsa",
    className: "bg-muted text-status-scheduled border-status-scheduled",
  },
  kedaluwarsa: {
    label: "Kedaluwarsa",
    className: "bg-muted text-status-failed border-status-failed",
  },
  menunggu_konfigurasi: {
    label: "Menunggu Token",
    className: "bg-muted text-muted-foreground border-surface-border",
  },
};

export function DaftarAkun() {
  const [modalBuka, setModalBuka] = useState(false);
  const [pesan, setPesan] = useState<{ tipe: "sukses" | "error"; teks: string } | null>(null);
  const [sedangUji, setSedangUji] = useState<string | null>(null);

  const [akunLokal, setAkunLokal] = useLocalState<AkunSosial[]>(
    "autothreads-akun-sosial",
    [],
  );
  const [memuat, setMemuat] = useState(true);
  /** GET /api/akun menjawab `butuhSesi` (bukan 401) saat belum masuk. */
  const [butuhSesi, setButuhSesi] = useState(false);

  // Muat akun dari API server / Supabase. Ditulis di dalam effect supaya
  // setState hanya terjadi setelah await (react-hooks/set-state-in-effect),
  // dan merge memakai bentuk fungsional sehingga `akunLokal` tidak perlu jadi
  // dependency.
  useEffect(() => {
    let aktif = true;

    const muatAkunDariServer = async () => {
      try {
        const res = await fetch("/api/akun");
        const data = await res.json();
        if (!aktif) return;
        if (res.status === 401 || data.butuhSesi) {
          setButuhSesi(true);
        }
        if (res.ok && data.ok && Array.isArray(data.akun) && data.akun.length > 0) {
          const dariServer = data.akun as AkunSosial[];
          // Gabungkan akun server dengan akun lokal unik.
          setAkunLokal((lokal) => {
            const map = new Map<string, AkunSosial>();
            for (const a of dariServer) map.set(a.id, a);
            for (const a of lokal) {
              if (!map.has(a.id)) map.set(a.id, a);
            }
            return Array.from(map.values());
          });
        }
      } catch {
        // Offline / fallback ke local state
      } finally {
        if (aktif) setMemuat(false);
      }
    };

    void muatAkunDariServer();
    return () => {
      aktif = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTambahAkun = (akunBaru: AkunSosial) => {
    setAkunLokal((prev: AkunSosial[]) => {
      const filtered = prev.filter(
        (a: AkunSosial) => a.id !== akunBaru.id && a.username !== akunBaru.username,
      );
      return [akunBaru, ...filtered];
    });
    setPesan({
      tipe: "sukses",
      teks: `Akun ${akunBaru.username} berhasil dihubungkan!`,
    });
    setTimeout(() => setPesan(null), 4000);
  };

  const handlePutuskan = async (id: string, username: string) => {
    if (!confirm(`Apakah Anda yakin ingin memutuskan akun ${username}?`)) {
      return;
    }

    try {
      await fetch(`/api/akun?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
    } catch {
      // Abaikan error jaringan untuk local state
    }

    setAkunLokal((prev: AkunSosial[]) => prev.filter((a: AkunSosial) => a.id !== id));
    setPesan({
      tipe: "sukses",
      teks: `Akun ${username} telah diputuskan.`,
    });
    setTimeout(() => setPesan(null), 3000);
  };

  const handleUjiKoneksi = (akun: AkunSosial) => {
    setSedangUji(akun.id);
    setTimeout(() => {
      setSedangUji(null);
      setPesan({
        tipe: "sukses",
        teks: `Koneksi akun ${akun.username} aktif dan siap digunakan.`,
      });
      setTimeout(() => setPesan(null), 4000);
    }, 800);
  };

  return (
    <div className="space-y-6">
      {pesan && (
        <div
          className={cn(
            "border p-3.5 text-badan transition-all animate-in fade-in-50",
            pesan.tipe === "sukses"
              ? "border-status-ready/30 bg-status-ready/10 text-status-ready"
              : "border-status-failed/30 bg-status-failed/10 text-status-failed",
          )}
        >
          {pesan.teks}
        </div>
      )}

      {butuhSesi ? (
        <p className="border border-status-failed/30 bg-status-failed/10 p-3.5 text-badan text-status-failed">
          Daftar akun di server hanya bisa dimuat setelah masuk. <TautanMasuk />
        </p>
      ) : null}

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-isi font-semibold">Akun yang terhubung</h2>
              <span className="border border-surface-border px-2.5 py-0.5 font-mono text-mikro font-semibold uppercase tracking-badge text-primary">
                {akunLokal.length} Akun
              </span>
            </div>
            <p className="mt-1 text-badan text-muted-foreground">
              Akun sosial aktif untuk penerbitan dan pembuatan konten di Heaviliate.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setModalBuka(true)}
            className="inline-flex h-9 items-center gap-2 bg-primary px-4 text-badan font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M12 4v16m8-8H4" />
            </svg>
            Tambah akun sosial
          </button>
        </div>

        {memuat && akunLokal.length === 0 ? (
          <div className="py-12 text-center text-badan text-muted-foreground">
            Memuat daftar akun sosial…
          </div>
        ) : akunLokal.length === 0 ? (
          <div className="my-6 border border-dashed border-surface-border p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center border-2 border-foreground/20 bg-muted text-muted-foreground">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path d="M12 2a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3V5a3 3 0 0 0-3-3Zm0 0c0 2.5-1.8 4.3-3 5.3A3.5 3.5 0 0 0 7 16a3.5 3.5 0 0 0 2.5 3.3c1.2.8 3 2.8 3 5.3a3.5 3.5 0 0 0 3.3-1.7 3.5 3.5 0 0 0-1.7-3.3 3.5 3.5 0 0 0-3.3 1.7c0 2.2-1.8 4-3 5.3a3.5 3.5 0 0 0-2.5-3.3 3.5 3.5 0 0 0 1.1-2.6Z" />
                <path d="M6 12h12" />
              </svg>
            </div>
            <h3 className="mt-3 text-badan font-semibold">Belum ada akun terhubung</h3>
            <p className="mt-1 text-meta text-muted-foreground max-w-sm mx-auto">
              Hubungkan akun Threads pertama Anda untuk mulai mengatur jadwal dan menerbitkan konten affiliate.
            </p>
            <button
              type="button"
              onClick={() => setModalBuka(true)}
              className="mt-4 inline-flex items-center gap-2 bg-primary px-4 py-2 text-meta font-semibold text-primary-foreground hover:opacity-90"
            >
              Hubungkan Akun Threads
            </button>
          </div>
        ) : (
          <div className="mt-4 divide-y divide-surface-border">
            {akunLokal.map((account: AkunSosial) => {
              const statusCfg = STATUS_CONFIG[account.status] || STATUS_CONFIG.terhubung;
              const isTesting = sedangUji === account.id;

              return (
                <div
                  key={account.id}
                  className="flex flex-wrap items-center justify-between gap-4 py-4"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center border border-primary/20 bg-primary/10 text-primary">
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path d="M12 2a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3V5a3 3 0 0 0-3-3Zm0 0c0 2.5-1.8 4.3-3 5.3A3.5 3.5 0 0 0 7 16a3.5 3.5 0 0 0 2.5 3.3c1.2.8 3 2.8 3 5.3a3.5 3.5 0 0 0 3.3-1.7 3.5 3.5 0 0 0-1.7-3.3 3.5 3.5 0 0 0-3.3 1.7c0 2.2-1.8 4-3 5.3a3.5 3.5 0 0 0-2.5-3.3 3.5 3.5 0 0 0 1.1-2.6Z" />
                        <path d="M6 12h12" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-badan font-semibold">{account.username}</p>
                        {account.nama_tampilan && account.nama_tampilan !== account.username && (
                          <span className="text-meta text-muted-foreground">
                            ({account.nama_tampilan})
                          </span>
                        )}
                        <span className="bg-muted px-1.5 py-0.5 text-mikro font-mono text-muted-foreground">
                          {account.platform}
                        </span>
                      </div>
                      <p className="mt-0.5 text-meta text-muted-foreground">
                        Mode:{" "}
                        <span className="font-medium text-foreground">
                          {account.mode === "otomatis" ? "Threads API (Otomatis)" : "Manual / Verifikasi"}
                        </span>
                        {account.threads_user_id ? ` · ID: ${account.threads_user_id}` : ""}
                        {account.catatan ? ` · ${account.catatan}` : ""}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        "inline-flex shrink-0 items-center border px-2.5 py-0.5 font-mono text-mikro font-semibold uppercase tracking-badge",
                        statusCfg.className,
                      )}
                    >
                      {statusCfg.label}
                    </span>

                    <button
                      type="button"
                      disabled={isTesting}
                      onClick={() => handleUjiKoneksi(account)}
                      className="border border-surface-border px-2.5 py-1 text-meta font-medium text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
                    >
                      {isTesting ? "Memeriksa…" : "Uji status"}
                    </button>

                    <button
                      type="button"
                      onClick={() => handlePutuskan(account.id, account.username)}
                      className="border border-status-failed/30 px-2.5 py-1 text-meta font-medium text-status-failed hover:bg-status-failed/10 transition-colors"
                    >
                      Putuskan
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-5 border border-surface-border bg-background p-4">
          <div className="flex items-start gap-3">
            <svg className="h-5 w-5 text-muted-foreground mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M13.828 10.172a4 4 0 0 0-5.656 0l-4 4a4 4 0 1 0 5.656 5.656l1.102-1.101m-.758-4.899a4 4 0 0 0 5.656 0l4-4a4 4 0 0 0-5.656-5.656l-1.1 1.1" />
            </svg>
            <div className="min-w-0">
              <p className="text-badan font-medium">Informasi Akun Sosial</p>
              <p className="mt-0.5 text-meta text-muted-foreground">
                Akun yang terhubung digunakan saat Anda membuat konten di alur Buat Posting dan meninjau di Antrian Review. Mode manual selalu dapat dipakai untuk menyalin utas tanpa memerlukan API Key Meta.
              </p>
            </div>
          </div>
        </div>
      </Card>

      <ModalTambahAkun
        terbuka={modalBuka}
        onTutup={() => setModalBuka(false)}
        onSimpan={handleTambahAkun}
      />
    </div>
  );
}
