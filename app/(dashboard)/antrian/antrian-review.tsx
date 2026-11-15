"use client";

/**
 * Antrian review (UI-Spec 3.9, PRD F10): the old Pustaka konten grid, now
 * organised by status tab with per-tab counts, an "Otomatis" label for content
 * made by the semi/auto work mode, and bulk actions that still run the
 * checklist gate per content (PRD F0: nothing becomes siap_posting without a
 * verified user action).
 *
 * Data lives in localStorage until Supabase connects (P3); the shapes already
 * match `contents` in docs/skema-database.md.
 *
 * R6d: state & logika pindah ke use-antrian.ts; kartu ke kartu-konten.tsx;
 * dialog jadwal ke dialog-jadwal.tsx. File ini tinggal tata letak.
 */
import { useEffect, useRef } from "react";
import { Card } from "@/components/card";
import { TautanMasuk } from "@/components/pesan-galat";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { CostWidget } from "@/components/cost-widget";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { ReviewTabs } from "@/components/review-tabs";
import { LampuShadowban } from "@/features/antrian/lampu-shadowban";
import { RiwayatSupabase } from "@/features/konten/riwayat-supabase";
import { hitungSkorShadowban } from "@/lib/konten/skor-shadowban";
import { TAB_REVIEW, type TabReview } from "@/lib/konten/skema";
import { cn } from "@/lib/utils";
import { DialogJadwal } from "./dialog-jadwal";
import { KartuKonten } from "./kartu-konten";
import { btnGhost, inputClass } from "./antrian-bersama";
import { useAntrian } from "./use-antrian";

export function AntrianReview() {
  const a = useAntrian();
  const fileRef = useRef<HTMLInputElement>(null);
  const dialogJadwalRef = useRef<HTMLDialogElement>(null);

  // Dialog jadwal memakai <dialog> native: focus trap + Esc gratis.
  useEffect(() => {
    const d = dialogJadwalRef.current;
    if (!d) return;
    if (a.jadwalTarget && !d.open) d.showModal();
    if (!a.jadwalTarget && d.open) d.close();
  }, [a.jadwalTarget]);

  const dibuka = a.bukaId ? a.konten.find((k) => k.id === a.bukaId) : null;
  const semuaTerpilih =
    a.hasil.length > 0 && a.hasil.every((k) => a.terpilih.includes(k.id));

  return (
    <div className="space-y-4">
      {a.pesan ? (
        <p
          className={
            a.posting.perluMasuk ? "text-badan text-status-failed" : "text-badan text-status-ready"
          }
          aria-live="polite"
        >
          {a.pesan}
          {a.posting.perluMasuk ? (
            <>
              {" "}
              <TautanMasuk tujuan="/antrian" />
            </>
          ) : null}
        </p>
      ) : null}

      {/* Header antrian (UI-Spec 3.9): judul, widget biaya, jeda semua */}
      <PageHeader
        title="Antrian"
        description="Semua konten menunggu tinjauan Anda. Tidak ada yang menjadi siap posting tanpa checklist."
      >
        <CostWidget
          hariIniUsd={a.biaya.hariIniUsd}
          bulanIniUsd={a.biaya.bulanIniUsd}
          adaCatatan={a.biaya.adaCatatan}
          batasUsd={a.biaya.batasUsd}
          perProvider={a.biaya.perProvider}
          fallbackPanggilan={a.biaya.fallbackPanggilan}
          fallbackTerakhir={a.biaya.fallbackTerakhir}
        />
      </PageHeader>

      {/* Status provider posting (UI-Spec 3.8): jelas mode apa yang aktif sekarang. */}
      {a.posting.siap ? (
        <p className="text-meta text-muted-foreground">
          Provider posting:{" "}
          <span className="text-foreground font-medium">
            {a.posting.bisaKirimApi ? "Threads API siap dipakai" : "manual saja (salin utas)"}
          </span>
          .{" "}
          {a.posting.bisaKirimApi
            ? "Tombol Kirim sekarang muncul di tab Terjadwal dan Gagal posting."
            : a.posting.tersedia.find((p) => p.id === "threads_api")?.alasan ??
              "Mode manual selalu tersedia tanpa API."}
        </p>
      ) : null}

      <ReviewTabs
        tabs={TAB_REVIEW.map((t) => ({
          value: t.value,
          label: t.label,
          jumlah: a.jumlah[t.value],
        }))}
        aktif={a.tab}
        onSelect={(value) => {
          a.setTab(value as TabReview);
          a.setTerpilih([]);
        }}
      />

      {/* Filter dan data cadangan */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="search"
          placeholder="Cari judul atau isi status…"
          value={a.q}
          onChange={(e) => a.setQ(e.target.value)}
          aria-label="Cari konten"
          className={cn(inputClass, "sm:max-w-xs")}
        />
        <select
          value={a.rentang}
          onChange={(e) => a.setRentang(e.target.value as typeof a.rentang)}
          aria-label="Filter tanggal"
          className={cn(inputClass, "sm:w-40")}
        >
          <option value="semua">Semua tanggal</option>
          <option value="7d">7 hari terakhir</option>
          <option value="30d">30 hari terakhir</option>
        </select>

        <div className="flex flex-wrap gap-2 sm:ml-auto">
          <button type="button" onClick={() => a.ekspor("csv")} className={btnGhost}>
            Ekspor CSV
          </button>
          <button type="button" onClick={() => a.ekspor("json")} className={btnGhost}>
            Ekspor JSON
          </button>
          <button type="button" onClick={() => a.ekspor("txt")} className={btnGhost}>
            Ekspor TXT
          </button>
          <button type="button" onClick={() => fileRef.current?.click()} className={btnGhost}>
            Impor JSON
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            aria-label="File cadangan JSON"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void a.impor(f);
              e.target.value = "";
            }}
          />
        </div>
      </div>

      {/* Aksi massal (UI-Spec 3.9) */}
      {a.terpilih.length > 0 ? (
        <Card padat className="flex flex-wrap items-center gap-3 px-4 py-3">
          <p className="text-badan font-medium">{a.terpilih.length} konten dipilih</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => a.tandaiSiapMassal(a.terpilih)}
              className={cn(btnGhost, "text-status-ready")}
            >
              Tandai siap
            </button>
            <button type="button" onClick={() => a.mintaTolak(a.terpilih)} className={btnGhost}>
              Tolak
            </button>
            <button
              type="button"
              onClick={() => a.mintaHapus(a.terpilih)}
              className={cn(btnGhost, "text-status-failed")}
            >
              Hapus
            </button>
          </div>
          <button
            type="button"
            onClick={() => a.setTerpilih([])}
            className={cn(btnGhost, "sm:ml-auto")}
          >
            Bersihkan pilihan
          </button>
        </Card>
      ) : null}

      {a.hasil.length === 0 ? (
        <EmptyState
          title={a.konten.length === 0 ? "Antrian masih kosong" : "Tidak ada yang cocok"}
          description={
            a.konten.length === 0
              ? "Konten dari Buat posting masuk ke tab Perlu review sebagai draft sampai Anda menandainya siap."
              : "Ubah kata kunci atau filter tanggal untuk melihat konten lain."
          }
          actionLabel="Buka Buat posting"
          actionHref="/posting/baru"
        />
      ) : (
        <ul className="space-y-3">
          <li className="flex items-center gap-3 px-1">
            <input
              type="checkbox"
              checked={semuaTerpilih}
              onChange={(e) =>
                a.setTerpilih(e.target.checked ? a.hasil.map((k) => k.id) : [])
              }
              aria-label="Pilih semua konten di tab ini"
              className="h-4 w-4 accent-[var(--primary)]"
            />
            <span className="text-meta text-muted-foreground">
              {semuaTerpilih ? "Batalkan pilihan semua" : "Pilih semua di tab ini"}
            </span>
          </li>

          {a.hasil.map((k) => (
            <li key={k.id}>
              <KartuKonten
                k={k}
                dipilih={a.terpilih.includes(k.id)}
                onToggle={(id, centang) =>
                  a.setTerpilih((prev) =>
                    centang ? [...prev, id] : prev.filter((x) => x !== id),
                  )
                }
                aksi={a.aksiKartu(k)}
                skor={a.skorKartu.get(k.id)}
                onSalinKemasan={a.salinKemasan}
                onSalinSubId={a.salinSubId}
              />
            </li>
          ))}
        </ul>
      )}

      {/* Dialog lihat + salin utas, baca-saja */}
      {dibuka ? (
        <>
          {/* Lampu merah sebelum salin (ide #32): temuan tampil di dialog. */}
          <ConfirmDialog
            open
            judul={dibuka.judul}
            pesan={`${dibuka.statuses.length} status · ${
              dibuka.status === "siap_posting" ? "siap posting" : dibuka.status
            }. Menutup dialog ini tidak mengubah apa pun.`}
            labelKonfirmasi="Salin utas"
            destructive={false}
            onKonfirmasi={() => {
              a.salinUtas(dibuka);
              a.setBukaId(null);
            }}
            onBatal={() => a.setBukaId(null)}
          />
          <LampuShadowban hasil={hitungSkorShadowban(dibuka.statuses)} />
        </>
      ) : null}

      <ConfirmDialog
        open={a.konfirmasi !== null}
        judul={a.konfirmasi?.judul ?? ""}
        pesan={a.konfirmasi?.pesan ?? ""}
        labelKonfirmasi={a.konfirmasi?.labelKonfirmasi ?? "Lanjutkan"}
        destructive={a.konfirmasi?.destructive ?? false}
        onKonfirmasi={() => {
          a.konfirmasi?.jalankan();
          a.setKonfirmasi(null);
        }}
        onBatal={() => a.setKonfirmasi(null)}
      />

      {/* Konfirmasi kirim (Fase 7): tidak ada pengiriman tanpa aksi user. */}
      <ConfirmDialog
        open={a.kirimTarget !== null}
        judul="Kirim ke Threads?"
        pesan={
          a.kirimTarget
            ? `“${a.kirimTarget.judul}” akan dikirim sebagai utas ${a.kirimTarget.statuses.length} status, berurutan. Setelah terkirim, konten berpindah ke tab Sudah posting.`
            : ""
        }
        labelKonfirmasi={a.sedangKirim ? "Mengirim…" : "Kirim sekarang"}
        destructive={false}
        onKonfirmasi={() => {
          const target = a.kirimTarget;
          a.setKirimTarget(null);
          if (target) void a.jalankanKirim(target);
        }}
        onBatal={() => a.setKirimTarget(null)}
      />

      {/* Dialog jadwal (UI-Spec 2.5/3.4): hanya siap_posting, konfirmasi di dalam dialog. */}
      {a.jadwalTarget !== null ? (
        <DialogJadwal
          judul={a.jadwalTarget.judul}
          tanggal={a.jadwalTanggal}
          setTanggal={a.setJadwalTanggal}
          refDialog={dialogJadwalRef}
          onBatal={() => a.setJadwalTarget(null)}
          onSimpan={a.simpanJadwal}
        />
      ) : null}

      {/* Riwayat hasil terakhir dari tabel contents Supabase (N-5). */}
      <RiwayatSupabase />
    </div>
  );
}
