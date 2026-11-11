"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Card } from "@/components/card";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { LampuShadowban } from "@/features/antrian/lampu-shadowban";
import {
  KEY_FOKUS_SELESAI,
  catatHariSelesai,
  hitungStreak,
  kunciHariLokal,
  pilihFokus,
  tujuhHariTerakhir,
} from "@/lib/konten/fokus";
import type { Konten } from "@/lib/konten/skema";
import { hitungSkorShadowban } from "@/lib/konten/skor-shadowban";
import { tandaiTerkirim } from "@/lib/konten/store";
import { useLocalState } from "@/lib/konten/use-local-state";
import { cn } from "@/lib/utils";

const NAMA_HARI = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

/**
 * Mode fokus harian: daftar pendek konten yang bisa dikerjakan sekarang,
 * tombol salin + tandai selesai, dan streak hari kerja. Data tetap di
 * localStorage; menandai selesai memakai jalur `tandaiTerkirim` yang sama.
 */
export function FokusHarian() {
  const [konten, setKonten] = useLocalState<Konten[]>("autothreads-konten", []);
  const [hariSelesai, setHariSelesai] = useLocalState<string[]>(KEY_FOKUS_SELESAI, []);
  const [pesan, setPesan] = useState("");

  const hariIni = kunciHariLokal(new Date());
  const daftar = useMemo(() => pilihFokus(konten, new Date()), [konten]);
  const streak = useMemo(() => hitungStreak(hariSelesai, hariIni), [hariSelesai, hariIni]);
  const pekan = useMemo(() => tujuhHariTerakhir(hariSelesai, hariIni), [hariSelesai, hariIni]);
  const sudahHariIni = hariSelesai.includes(hariIni);
  // Skor shadowban per konten (ide #32): dihitung saat render, tanpa API.
  const skorShadowban = useMemo(
    () => new Map(daftar.map(({ konten: k }) => [k.id, hitungSkorShadowban(k.statuses)])),
    [daftar],
  );

  const salin = (k: Konten) => {
    void (async () => {
      try {
        await navigator.clipboard.writeText(k.statuses.map((s) => s.trim()).join("\n\n"));
        setPesan(`Utas “${k.judul}” disalin. Tinggal tempel di Threads.`);
      } catch {
        setPesan("Clipboard ditolak browser. Salin manual dari halaman Antrian.");
      }
    })();
  };

  const selesai = (k: Konten) => {
    setKonten((list) => tandaiTerkirim(list, k.id));
    setHariSelesai((prev) => catatHariSelesai(prev, kunciHariLokal(new Date())));
    setPesan(`“${k.judul}” selesai. Satu langkah lagi untuk hari ini.`);
  };

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-mono text-meta uppercase tracking-meta text-muted-foreground">
              Rentetan hari kerja
            </p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">
              {streak} hari
              {sudahHariIni ? " · hari ini aman" : streak > 0 ? " · lanjutkan hari ini" : ""}
            </p>
          </div>
          <div className="flex items-end gap-1.5" aria-label="Tujuh hari terakhir">
            {pekan.map((p) => {
              const tgl = new Date(`${p.hari}T00:00:00`);
              return (
                <div key={p.hari} className="flex flex-col items-center gap-1">
                  <span
                    className={cn(
                      "h-6 w-6 border",
                      p.selesai
                        ? "border-primary bg-primary"
                        : p.hari === hariIni
                          ? "border-primary"
                          : "border-surface-border bg-muted/40",
                    )}
                    title={`${p.hari}${p.selesai ? " · selesai" : ""}`}
                  />
                  <span className="text-mikro text-muted-foreground">
                    {NAMA_HARI[tgl.getDay()]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {pesan ? (
        <p className="text-badan text-status-ready" aria-live="polite">
          {pesan}
        </p>
      ) : null}

      {daftar.length === 0 ? (
        <EmptyState
          title="Belum ada yang siap dikerjakan"
          description="Mode fokus menampilkan konten yang jadwalnya hari ini dan konten berstatus siap posting. Tandai satu konten siap di Antrian, atau buat konten baru."
          actionLabel="Buka Konten"
          actionHref="/antrian"
        />
      ) : (
        <ol className="space-y-3">
          {daftar.map(({ konten: k, alasan }) => (
            <li key={k.id}>
              <Card padat className="p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-badan font-semibold">{k.judul}</h2>
                  <StatusBadge status={k.status} />
                  <span className="border border-surface-border px-2 py-0.5 text-meta text-muted-foreground">
                    {alasan === "jadwal_hari_ini" ? "Jadwal hari ini" : "Siap posting"}
                  </span>
                </div>
                <p className="mt-1 text-meta text-muted-foreground">
                  {k.produk_nama || "Tanpa produk"} · {k.statuses.length} status
                </p>
                <p className="mt-2 line-clamp-3 text-badan">{k.statuses[0]}</p>

                <div className="mt-3">
                  <LampuShadowban hasil={skorShadowban.get(k.id) ?? hitungSkorShadowban([])} />
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => salin(k)}
                    className="inline-flex h-9 items-center bg-primary px-4 text-badan font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
                  >
                    Salin utas
                  </button>
                  <button
                    type="button"
                    onClick={() => selesai(k)}
                    className="border border-surface-border px-3 py-1.5 text-meta font-medium hover:bg-muted"
                  >
                    Tandai selesai
                  </button>
                  <Link
                    href="/antrian"
                    className="border border-surface-border px-3 py-1.5 text-meta font-medium hover:bg-muted"
                  >
                    Lihat di Antrian
                  </Link>
                </div>
              </Card>
            </li>
          ))}
        </ol>
      )}

      <p className="text-meta text-muted-foreground">
        Menandai selesai memindahkan konten ke status terkirim dan mencatat hari ini ke streak.
        Streak dihitung dari hari berturut-turut yang punya minimal satu konten selesai.
      </p>
    </div>
  );
}
