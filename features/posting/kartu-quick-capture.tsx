"use client";

import { useCallback, useState, useSyncExternalStore } from "react";
import { bookmarkletQuickCapture } from "@/lib/impor/prefill";
import { salinKeClipboard } from "@/lib/konten/salin";

function subscribeTanpaPerubahan() {
  return () => {};
}

/** Origin aplikasi, dibaca setelah hidrasi supaya markup server dan klien sama. */
function asalPeramban(): string {
  return typeof window === "undefined" ? "" : window.location.origin;
}

/**
 * Quick Capture (N-8): bookmarklet, bukan ekstensi. User menyeret tombol ini ke
 * bilah bookmark, menjalankannya di halaman produk, lalu kembali ke halaman ini
 * dengan form yang sudah terisi untuk ditinjau.
 */
export function KartuQuickCapture() {
  const asal = useSyncExternalStore(subscribeTanpaPerubahan, asalPeramban, () => "");
  const [hasilSalin, setHasilSalin] = useState<"belum" | "ya" | "gagal">("belum");

  const kode = asal ? bookmarkletQuickCapture(asal) : "";

  /**
   * React mengganti href javascript: dengan error keamanan, sehingga atributnya
   * dipasang langsung lewat ref supaya tautan tetap bisa diseret. Isi kode hanya
   * berasal dari origin aplikasi (bukan input user), jadi tidak ada string asing
   * yang dieksekusi.
   */
  const pasangTautan = useCallback(
    (el: HTMLAnchorElement | null) => {
      if (el && kode) el.setAttribute("href", kode);
    },
    [kode],
  );

  return (
    <section className="rounded-xl border border-surface-border bg-surface p-4 sm:p-6">
      <h2 className="text-base font-semibold">4. Quick Capture (bookmarklet)</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Seret tombol di bawah ke bilah bookmark browser Anda. Saat dibuka di halaman
        produk marketplace, bookmarklet itu mengisi form ini dengan judul, harga, dan
        deskripsi singkat yang tampak di layar — Anda tetap meninjau dan menyimpan
        sendiri di sini.
      </p>

      {kode ? (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <a
            ref={pasangTautan}
            draggable
            onClick={(e) => e.preventDefault()}
            className="inline-flex h-9 cursor-grab items-center rounded-lg border border-primary bg-primary/10 px-4 text-sm font-medium text-primary"
            title="Seret saya ke bilah bookmark"
          >
            Quick Capture → AutoThreads
          </a>
          <button
            type="button"
            onClick={async () => {
              const ok = await salinKeClipboard(kode);
              setHasilSalin(ok ? "ya" : "gagal");
            }}
            className="h-9 rounded-lg border border-surface-border px-3 text-sm font-medium transition-colors hover:bg-muted"
          >
            Salin kode bookmarklet
          </button>
          {hasilSalin !== "belum" ? (
            <span className="text-xs text-muted-foreground" aria-live="polite">
              {hasilSalin === "ya"
                ? "Kode tersalin. Tempel di bilah bookmark kalau browser Anda tidak mendukung seret."
                : "Gagal menyalin. Salin manual dari kotak kode di bawah bila perlu."}
            </span>
          ) : null}
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">
          Bookmarklet dibuat setelah halaman selesai dimuat.
        </p>
      )}

      <details className="mt-3">
        <summary className="cursor-pointer text-xs text-muted-foreground">
          Lihat kode bookmarklet
        </summary>
        <pre className="mt-2 max-h-40 overflow-auto rounded-lg border border-surface-border bg-background p-3 text-[11px] leading-5">
          {kode || "—"}
        </pre>
      </details>

      <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
        <li>• Bookmarklet hanya membaca yang terlihat di layar; tidak ada scraping dari server kami.</li>
        <li>• URL halaman dibersihkan dari query dan hash supaya parameter pelacak tidak ikut terkirim.</li>
        <li>• Tidak ada token, cookie, atau data login yang dikirim di URL.</li>
      </ul>
    </section>
  );
}
