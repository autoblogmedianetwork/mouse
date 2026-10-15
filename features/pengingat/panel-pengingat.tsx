"use client";

/**
 * Panel pengingat dashboard (feedback Claude #2): menampilkan pengingat jadwal
 * posting dan draft terbengkalai. Logika penilaiannya murni di
 * lib/konten/pengingat.ts (bertes); panel hanya menyediakan data dan tombol
 * aksi per item.
 *
 * Dismiss disimpan via useLocalState ({ id: "YYYY-MM-DD" } di kunci
 * autothreads-pengingat-ditutup): item hanya sembunyi di hari yang sama, jadi
 * besok pengingatnya muncul kembali tanpa menumpuk state.
 */
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  evaluasiPengingat,
  filterTertutup,
  kunciHariIni,
  kunciHariLalu,
  type PengingatItem,
} from "@/lib/konten/pengingat";
import { kontenSkema, type Konten } from "@/lib/konten/skema";
import { useLocalState } from "@/lib/konten/use-local-state";
import { cn } from "@/lib/utils";

const DITUTUP_KEY = "autothreads-pengingat-ditutup";
/** Token dismiss dipangkas setelah sekian hari supaya storage tidak menumpuk. */
const SIMPAN_DITUTUP_HARI = 7;

const GAYA_JENIS: Record<PengingatItem["jenis"], string> = {
  jadwal_lewat: "text-status-failed",
  jadwal_hari_ini: "text-status-scheduled",
  jadwal_minggu_ini: "text-status-scheduled",
  draft_pustaka: "text-muted-foreground",
  draft_kerja: "text-muted-foreground",
};

const LABEL_JENIS: Record<PengingatItem["jenis"], string> = {
  jadwal_lewat: "Jadwal lewat",
  jadwal_hari_ini: "Jadwal hari ini",
  jadwal_minggu_ini: "Terjadwal",
  draft_pustaka: "Draft terbengkalai",
  draft_kerja: "Draft terbengkalai",
};

export function PanelPengingat() {
  const [konten] = useLocalState<Konten[]>("autothreads-konten", []);
  const [draft] = useLocalState<{
    updatedAt?: string;
    konten?: Array<{ statuses?: string[] }>;
  }>("autothreads-draft-posting", {});
  const [ditutup, setDitutup] = useLocalState<Record<string, string>>(DITUTUP_KEY, {});

  /**
   * "Sekarang" diisi setelah mount lewat rAF dan disegarkan tiap menit — pola
   * yang sama dengan halaman Kalender: komponen tetap idempoten saat render
   * dan tidak ada mismatch hidrasi (panel belum tampil sebelum mount).
   */
  const [sekarang, setSekarang] = useState<number | null>(null);
  useEffect(() => {
    const tik = () => setSekarang(Date.now());
    const frame = window.requestAnimationFrame(tik);
    const timer = window.setInterval(tik, 60_000);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearInterval(timer);
    };
  }, []);

  const daftar = useMemo(
    () =>
      konten.flatMap((k) => {
        const hasil = kontenSkema.safeParse(k);
        return hasil.success ? [hasil.data] : [];
      }),
    [konten],
  );

  const draftKerja = useMemo(() => {
    const punyaIsi = (draft?.konten?.length ?? 0) > 0;
    return { updatedAt: draft?.updatedAt, punyaIsi };
  }, [draft]);

  const items = useMemo(() => {
    if (sekarang === null) return [];
    const semua = evaluasiPengingat({ konten: daftar, draftKerja, sekarang });
    return filterTertutup(semua, ditutup, kunciHariIni(new Date(sekarang)));
  }, [daftar, draftKerja, ditutup, sekarang]);

  const tutup = (id: string, hariIniKey: string) => {
    setDitutup((prev) => {
      const next = { ...prev, [id]: hariIniKey };
      // Pangkas token dismissal yang sudah melewati masa simpan supaya
      // localStorage tidak menumpuk data yang tidak dipakai lagi.
      const batas = kunciHariLalu(hariIniKey, SIMPAN_DITUTUP_HARI);
      if (batas) {
        for (const [key, tgl] of Object.entries(prev)) {
          if (tgl < batas) delete next[key];
        }
      }
      return next;
    });
  };

  if (sekarang === null || items.length === 0) return null;

  return (
    <section
      aria-label="Pengingat"
      className="rounded-xl border border-primary/30 bg-primary/5 p-4 sm:p-6"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold">Pengingat</h2>
        <span className="text-xs text-muted-foreground">
          {items.length} perlu perhatian · muncul lagi besok jika ditutup
        </span>
      </div>
      <ul className="mt-3 divide-y divide-surface-border">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex flex-wrap items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
          >
            <div className="min-w-0">
              <p
                className={cn(
                  "text-[11px] font-medium uppercase tracking-wide",
                  GAYA_JENIS[item.jenis],
                )}
              >
                {LABEL_JENIS[item.jenis]}
              </p>
              <p className="truncate text-sm font-medium">{item.judul}</p>
              <p className="text-xs text-muted-foreground">{item.detail}</p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <button
                type="button"
                onClick={() => tutup(item.id, kunciHariIni(new Date(sekarang)))}
                className="text-xs text-muted-foreground underline-offset-2 hover:underline"
              >
                Tutup
              </button>
              <Link
                href={item.href}
                className="inline-flex h-8 items-center rounded-lg border border-surface-border bg-surface px-3 text-sm font-medium transition-colors hover:bg-muted"
              >
                {item.labelAksi}
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
