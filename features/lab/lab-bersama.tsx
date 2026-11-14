"use client";

/**
 * Helper bersama halaman Lab (refactor R6). Dipindah utuh dari
 * lab-klien.tsx: kelas tombol, pembungkus panggilan API, tombol salin,
 * dan pesan galat.
 */
import { useState } from "react";

export const inputClass =
  "w-full border border-surface-border bg-surface px-3 py-2 text-badan outline-none focus:border-primary";
export const btnPrimary =
  "inline-flex h-9 items-center bg-primary px-4 text-badan font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-50";
export const btnGhost = "border border-surface-border px-3 py-1.5 text-meta font-medium hover:bg-muted";

export interface Balasan<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

export async function panggilAI<T>(url: string, body: unknown): Promise<Balasan<T>> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      data?: T;
      error?: string;
    };
    if (!res.ok || !json.ok) {
      return { ok: false, error: json.error ?? `Permintaan gagal (${res.status}).` };
    }
    return { ok: true, data: json.data };
  } catch {
    return { ok: false, error: "Tidak bisa menghubungi server. Cek koneksi lalu coba lagi." };
  }
}

export function TombolSalin({ teks }: { teks: string }) {
  const [status, setStatus] = useState<"idle" | "ok" | "gagal">("idle");
  return (
    <button
      type="button"
      onClick={() => {
        void (async () => {
          try {
            await navigator.clipboard.writeText(teks);
            setStatus("ok");
          } catch {
            setStatus("gagal");
          }
          setTimeout(() => setStatus("idle"), 2000);
        })();
      }}
      className={btnGhost}
    >
      {status === "ok" ? "Tersalin" : status === "gagal" ? "Salin manual" : "Salin"}
    </button>
  );
}

export function PesanGalat({ pesan }: { pesan: string }) {
  if (!pesan) return null;
  return (
    <p className="mt-3 text-badan text-status-failed" aria-live="polite">
      {pesan}
    </p>
  );
}
