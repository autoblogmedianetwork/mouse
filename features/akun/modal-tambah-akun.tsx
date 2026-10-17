"use client";

import { useState } from "react";
import {
  normalisasiUsername,
  type AkunSosial,
  type InputAkunBaru,
} from "@/lib/akun/skema";

interface ModalTambahAkunProps {
  terbuka: boolean;
  onTutup: () => void;
  onSimpan: (akun: AkunSosial) => void;
}

export function ModalTambahAkun({
  terbuka,
  onTutup,
  onSimpan,
}: ModalTambahAkunProps) {
  const [platform, setPlatform] = useState<"Threads">("Threads");
  const [username, setUsername] = useState("");
  const [namaTampilan, setNamaTampilan] = useState("");
  const [mode, setMode] = useState<"manual" | "otomatis">("manual");
  const [threadsUserId, setThreadsUserId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [catatan, setCatatan] = useState("");
  const [memuat, setMemuat] = useState(false);
  const [pesanError, setPesanError] = useState<string | null>(null);

  if (!terbuka) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPesanError(null);

    const usernameBersih = normalisasiUsername(username);
    if (!usernameBersih) {
      setPesanError("Username akun wajib diisi.");
      return;
    }

    setMemuat(true);
    try {
      const payload: InputAkunBaru = {
        platform,
        username: usernameBersih,
        nama_tampilan: namaTampilan.trim() || usernameBersih,
        mode,
        threads_user_id: threadsUserId.trim() || undefined,
        access_token: accessToken.trim() || undefined,
        catatan: catatan.trim() || undefined,
      };

      const res = await fetch("/api/akun", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Gagal menghubungkan akun.");
      }

      onSimpan(data.akun);
      onTutup();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan.";
      setPesanError(msg);
    } finally {
      setMemuat(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-xl border border-surface-border bg-surface p-6 shadow-xl animate-in fade-in-50 zoom-in-95">
        <div className="flex items-center justify-between pb-4 border-b border-surface-border">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-semibold">Hubungkan Akun Sosial</h2>
              <p className="text-xs text-muted-foreground">
                Sambungkan akun Threads untuk penerbitan konten affiliate.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onTutup}
            className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {pesanError && (
          <div className="mt-4 rounded-lg border border-status-failed/30 bg-status-failed/10 p-3 text-xs text-status-failed">
            {pesanError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Platform
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPlatform("Threads")}
                className="flex items-center justify-center gap-2 rounded-lg border border-primary bg-primary/10 px-3 py-2 text-sm font-medium text-primary"
              >
                <span>Threads</span>
                <span className="rounded-full bg-primary/20 px-1.5 py-0.2 text-[10px] font-bold">
                  Aktif (MVP)
                </span>
              </button>
              <button
                type="button"
                disabled
                className="flex items-center justify-center gap-2 rounded-lg border border-surface-border bg-muted/40 px-3 py-2 text-sm font-medium text-muted-foreground opacity-60"
              >
                <span>Instagram / X</span>
                <span className="text-[10px] italic">(Segera)</span>
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="modal-username" className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Username / Handle Threads <span className="text-destructive">*</span>
            </label>
            <input
              id="modal-username"
              type="text"
              required
              placeholder="@username_affiliate"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary"
            />
          </div>

          <div>
            <label htmlFor="modal-nama" className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Nama Tampilan (Opsional)
            </label>
            <input
              id="modal-nama"
              type="text"
              placeholder="Contoh: Akun Promo Shopee"
              value={namaTampilan}
              onChange={(e) => setNamaTampilan(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Metode Integrasi
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMode("manual")}
                className={`rounded-lg border p-2.5 text-left text-xs transition-colors ${
                  mode === "manual"
                    ? "border-primary bg-primary/10 text-primary font-medium"
                    : "border-surface-border bg-background text-muted-foreground hover:bg-muted"
                }`}
              >
                <div className="font-semibold">Manual / Verifikasi</div>
                <div className="mt-0.5 text-[11px] opacity-80">
                  Langsung aktif, siap untuk salin & kelola konten.
                </div>
              </button>
              <button
                type="button"
                onClick={() => setMode("otomatis")}
                className={`rounded-lg border p-2.5 text-left text-xs transition-colors ${
                  mode === "otomatis"
                    ? "border-primary bg-primary/10 text-primary font-medium"
                    : "border-surface-border bg-background text-muted-foreground hover:bg-muted"
                }`}
              >
                <div className="font-semibold">Threads API</div>
                <div className="mt-0.5 text-[11px] opacity-80">
                  Kirim otomatis lewat Meta Graph API.
                </div>
              </button>
            </div>
          </div>

          {mode === "otomatis" && (
            <div className="space-y-3 rounded-lg border border-surface-border bg-background/50 p-3.5">
              <div className="flex items-center gap-1.5 text-xs text-primary font-medium">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Kredensial Meta Threads Developer
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-muted-foreground">
                  Threads User ID (Angka)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 17841400000000"
                  value={threadsUserId}
                  onChange={(e) => setThreadsUserId(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-xs outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-muted-foreground">
                  Access Token (Long-lived 60 hari)
                </label>
                <input
                  type="password"
                  placeholder="THQW..."
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-xs outline-none focus:border-primary"
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Token disimpan aman di server dan tidak pernah terekspos ke klien.
              </p>
            </div>
          )}

          <div>
            <label htmlFor="modal-catatan" className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Catatan Internal (Opsional)
            </label>
            <input
              id="modal-catatan"
              type="text"
              placeholder="Catatan niche atau target audiens"
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-surface-border">
            <button
              type="button"
              onClick={onTutup}
              disabled={memuat}
              className="rounded-lg border border-surface-border px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={memuat}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {memuat ? (
                <>
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Menghubungkan…
                </>
              ) : (
                "Hubungkan Akun"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
