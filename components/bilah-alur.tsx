"use client";

/**
 * Bilah langkah alur kerja (Opsi B).
 *
 * Menampilkan empat langkah utama (Hari Ini → Riset → Bikin Konten → Terbit)
 * dengan status: selesai / sekarang / belum. Tujuannya supaya pemakai baru
 * selalu tahu "saya di tahap mana, berikutnya klik apa" tanpa menghafal menu.
 *
 * Status dihitung dari data nyata (bukan tebakan):
 * - Riset selesai bila ada minimal satu riset/peluang tersimpan.
 * - Bikin Konten selesai bila ada minimal satu konten di bank konten.
 * - Terbit selesai bila ada minimal satu konten berstatus terkirim.
 */
import Link from "next/link";
import { useEffect, useState } from "react";
import { LANGKAH_ALUR } from "@/components/nav-config";
import { muatKonten } from "@/lib/konten/store";
import { daftarRiset } from "@/lib/riset/store";
import { muatProduk } from "@/lib/produk/store";

type Status = "selesai" | "sekarang" | "belum";

export function BilahAlur() {
  const [status, setStatus] = useState<Record<number, Status>>({});

  // Langkah 2 (Riset) dianggap selesai bila sudah ada riset di server ATAU
  // sudah ada produk tersimpan. Kalau Supabase lambat/gagal, produk lokal
  // tetap dipakai supaya bilah tidak macet di "belum".
  useEffect(() => {
    let aktif = true;
    const konten = muatKonten();
    const adaKonten = konten.length > 0;
    const adaTerbit = konten.some((k) => k.status === "terkirim");
    const adaProduk = muatProduk().length > 0;

    void (async () => {
      let adaRiset = adaProduk;
      if (!adaRiset) {
        try {
          adaRiset = (await daftarRiset()).length > 0;
        } catch {
          adaRiset = false;
        }
      }
      if (!aktif) return;
      const berikut: Record<number, Status> = {
        1: "selesai",
        2: adaRiset ? "selesai" : "belum",
        3: adaKonten ? "selesai" : "belum",
        4: adaTerbit ? "selesai" : "belum",
      };
      // Langkah pertama yang belum selesai menjadi "sekarang".
      const pertama = [2, 3, 4].find((n) => berikut[n] === "belum");
      if (pertama !== undefined) berikut[pertama] = "sekarang";
      setStatus(berikut);
    })();

    return () => {
      aktif = false;
    };
  }, []);

  if (Object.keys(status).length === 0) return null;

  return (
    <div className="border-2 border-foreground p-3">
      <p className="font-mono text-meta uppercase tracking-meta text-muted-foreground">
        [ ALUR KERJA ]
      </p>
      <ol className="mt-2 grid gap-2 sm:grid-cols-4">
        {LANGKAH_ALUR.map((l) => {
          const s = status[l.nomor] ?? "belum";
          return (
            <li key={l.href}>
              <Link
                href={l.href}
                className={`flex h-full flex-col border p-2 transition-colors ${
                  s === "sekarang"
                    ? "border-primary bg-primary/10"
                    : s === "selesai"
                      ? "border-surface-border bg-muted/40"
                      : "border-surface-border hover:bg-muted"
                }`}
              >
                <span className="flex items-center gap-2">
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center border font-mono text-mikro ${
                      s === "selesai"
                        ? "border-status-ready bg-status-ready text-white"
                        : s === "sekarang"
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-surface-border text-muted-foreground"
                    }`}
                    aria-hidden="true"
                  >
                    {s === "selesai" ? "✓" : l.nomor}
                  </span>
                  <span className="text-badan font-medium">{l.label}</span>
                </span>
                <span className="mt-1 text-meta text-muted-foreground">{l.kapan}</span>
                {s === "sekarang" ? (
                  <span className="mt-1 font-mono text-mikro uppercase text-primary">
                    ← lanjutkan di sini
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
