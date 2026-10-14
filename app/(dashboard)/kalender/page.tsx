"use client";

/**
 * Kalender (Fase 6, UI-Spec 3.4): week view + month table of scheduled content.
 *
 * Data is the real content bank ("terjadwal" status with jadwal_at), not mock
 * days. Scheduling itself happens in Antrian review; this page displays, opens,
 * and moves the schedule:
 *   - klik blok  -> dialog baca-saja berisi utas (tanpa mengubah apa pun)
 *   - drag blok ke hari lain -> konfirmasi, jam tetap
 *   - "Jadwal ulang" -> jalur keyboard/mobile untuk hal yang sama
 *
 * No auto-posting here: Mode manual stays the main path (PRD, AGENTS rule 4).
 */
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import {
  hariMinggu,
  jadwalBulanIni,
  kelompokkanPerHari,
  kontenTerjadwal,
  pindahKeHari,
} from "@/lib/konten/kalender";
import { usePosting } from "@/features/posting/use-posting";
import { catatRiwayat } from "@/lib/konten/riwayat";
import { kontenSkema, type Konten } from "@/lib/konten/skema";
import { pindahJadwal, tandaiGagal, tandaiTerkirim } from "@/lib/konten/store";
import { useLocalState } from "@/lib/konten/use-local-state";
import { cn } from "@/lib/utils";

const inputClass =
  "w-full rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary";
const btnGhost = "h-9 rounded-lg border border-surface-border px-4 text-sm font-medium hover:bg-muted";
const btnUtama =
  "h-9 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover";

function formatJadwal(jadwalAt: string): string {
  const d = new Date(jadwalAt);
  if (!Number.isFinite(d.getTime())) return "—";
  return d.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
}

/**
 * `datetime-local` wants "YYYY-MM-DDTHH:mm" in local time, not a UTC ISO
 * string; tanpa konversi ini nilai input bergeser sekian jam dari jadwal.
 */
function nilaiDatetimeLocal(iso: string): string {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function KalenderPage() {
  const [konten, setKonten] = useLocalState<Konten[]>("autothreads-konten", []);

  /**
   * "Sekarang" bukan bagian dari render: komponen harus idempoten
   * (`react-hooks/purity`), jadi nilainya diisi setelah mount dan disegarkan
   * tiap menit. Selama null, tidak ada jadwal yang ditandai lewat.
   */
  const [sekarang, setSekarang] = useState<number | null>(null);

  const [bukaId, setBukaId] = useState<string | null>(null);
  const [pesan, setPesan] = useState<string | null>(null);
  /** Draf perpindahan hasil drag, selalu dikonfirmasi sebelum disimpan. */
  const [pindah, setPindah] = useState<{
    id: string;
    judul: string;
    dari: string;
    ke: string;
  } | null>(null);
  /** Jalur keyboard/mobile untuk hal yang sama (drag tidak jalan di sentuh). */
  const [ubahTarget, setUbahTarget] = useState<{ id: string; judul: string } | null>(null);
  const [ubahNilai, setUbahNilai] = useState("");
  /** Konten yang menunggu konfirmasi kirim (Fase 7). */
  const [kirimTarget, setKirimTarget] = useState<Konten | null>(null);
  const posting = usePosting();

  useEffect(() => {
    const tik = () => setSekarang(Date.now());
    // requestAnimationFrame (bukan panggilan langsung) supaya efek ini tidak
    // memicu cascading render di badan efek; interval menjaga nilainya segar.
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

  const terjadwal = useMemo(() => kontenTerjadwal(daftar), [daftar]);
  const hari = useMemo(() => hariMinggu(), []);
  const perHari = useMemo(() => kelompokkanPerHari(daftar, hari), [daftar, hari]);
  const bulan = useMemo(() => jadwalBulanIni(daftar), [daftar]);
  const dibuka = bukaId ? daftar.find((k) => k.id === bukaId) ?? null : null;

  const salinUtas = (k: Konten) => {
    void navigator.clipboard.writeText(k.statuses.map((s) => s.trim()).join("\n\n"));
    catatRiwayat({
      konten_judul: k.judul,
      mode: "manual",
      status_akhir: k.status,
      catatan: "Utas disalin dari kalender.",
    });
    setPesan(`Utas "${k.judul}" disalin (${k.statuses.length} status).`);
  };

  const jalankanKirim = async (k: Konten) => {
    const hasil = await posting.kirim(k);
    if (hasil.ok) {
      setKonten((list) => tandaiTerkirim(list, k.id));
      catatRiwayat({
        konten_judul: k.judul,
        mode: hasil.penyedia === "manual" ? "manual" : "auto",
        status_akhir: "terkirim",
        catatan: `Dikirim dari kalender (${hasil.id_terkirim.length} status).`,
      });
      setPesan(`“${k.judul}” terkirim ke Threads dan pindah ke tab Sudah posting.`);
      setBukaId(null);
      return;
    }
    setKonten((list) => tandaiGagal(list, k.id));
    catatRiwayat({
      konten_judul: k.judul,
      mode: "auto",
      status_akhir: "gagal",
      catatan: hasil.error ?? "Pengiriman gagal.",
    });
    setPesan(
      hasil.jatuh_ke_manual
        ? `${hasil.error} Konten tetap ada dan bisa disalin manual.`
        : (hasil.error ?? "Pengiriman tidak diizinkan."),
    );
  };

  const simpanPindah = (id: string, judul: string, ke: string) => {
    const hasil = pindahJadwal(konten, id, ke);
    if (!hasil.ok) {
      setPesan(hasil.alasan ?? "Jadwal tidak bisa dipindah.");
      return;
    }
    setKonten(hasil.list);
    catatRiwayat({
      konten_judul: judul,
      mode: "manual",
      status_akhir: "terjadwal",
      catatan: `Jadwal dipindah ke ${formatJadwal(ke)}.`,
    });
    setPesan(`"${judul}" dipindah ke ${formatJadwal(ke)}.`);
  };

  const lewatDari = (iso: string) => sekarang !== null && Date.parse(iso) < sekarang;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kalender"
        description="Jadwal konten siap posting. Jadwalkan dari Antrian review (tab Disetujui), lalu geser blok ke hari lain untuk memindah jadwal. Mode manual tetap jalur utama sampai Fase 7."
      >
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/antrian"
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-surface-border bg-background px-3 text-sm font-medium transition-colors hover:bg-muted"
          >
            Jadwalkan dari Antrian
          </Link>
          <span className="text-muted-foreground rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium">
            {terjadwal.length} terjadwal
          </span>
        </div>
      </PageHeader>

      {pesan ? (
        <p
          role="status"
          className="rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm text-muted-foreground"
        >
          {pesan}
        </p>
      ) : null}

      {terjadwal.length === 0 ? (
        <EmptyState
          title="Belum ada jadwal"
          description="Tandai konten sebagai siap posting, lalu buka Antrian review dan klik Jadwalkan untuk memilih tanggal dan jam."
          actionLabel="Buka Antrian review"
          actionHref="/antrian"
        />
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {hari.map((h) => {
              const isi = perHari.get(h.kunci) ?? [];
              const terlambat = isi.some((k) => lewatDari(k.jadwal_at ?? ""));
              return (
                <div
                  key={h.kunci}
                  onDragOver={(e) => {
                    // Wajib: tanpa preventDefault browser menolak menerima drop.
                    e.preventDefault();
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    const id = e.dataTransfer.getData("text/plain");
                    const asal = daftar.find((k) => k.id === id);
                    if (!asal?.jadwal_at) return;
                    const baru = pindahKeHari(asal.jadwal_at, h.kunci);
                    if (!baru) {
                      setPesan("Jadwal konten itu tidak bisa dibaca, jadi tidak dipindah.");
                      return;
                    }
                    setPindah({ id, judul: asal.judul, dari: asal.jadwal_at, ke: baru });
                  }}
                  className={cn(
                    "rounded-xl border bg-background p-4 transition-colors",
                    terlambat && isi.length > 0
                      ? "border-status-failed"
                      : isi.length > 0
                        ? "border-status-scheduled bg-muted/20"
                        : "border-border",
                    h.hariIni && "ring-1 ring-primary/40",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                      {h.label}
                      {h.hariIni ? " · hari ini" : ""}
                    </p>
                    <span
                      className={cn(
                        "text-muted-foreground text-[11px] font-medium",
                        isi.length > 0 && "text-foreground",
                      )}
                    >
                      {isi.length > 0 ? `${isi.length} konten` : "—"}
                    </span>
                  </div>

                  {isi.length === 0 ? (
                    <p className="mt-2 text-xs text-muted-foreground">Tidak ada jadwal.</p>
                  ) : (
                    <ul className="mt-2 space-y-2">
                      {isi.map((k) => (
                        <li
                          key={k.id}
                          draggable
                          onDragStart={(e) => e.dataTransfer.setData("text/plain", k.id)}
                          className="cursor-grab rounded-lg border border-surface-border bg-surface p-2.5 active:cursor-grabbing"
                        >
                          <button
                            type="button"
                            onClick={() => setBukaId(k.id)}
                            className="block w-full text-left"
                          >
                            <span className="block truncate text-sm font-medium">{k.judul}</span>
                            <span className="text-muted-foreground block tabular-nums text-xs">
                              {formatJadwal(k.jadwal_at ?? "")}
                              {k.produk_nama ? ` · ${k.produk_nama}` : ""}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </section>

          <p className="text-xs text-muted-foreground">
            Geser blok konten ke kartu hari lain untuk memindah jadwal (jamnya tetap, konfirmasi
            dulu). Di layar sentuh, pakai tombol &quot;Jadwal ulang&quot; pada tabel di bawah.
          </p>

          <section className="rounded-xl border border-surface-border bg-surface p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold">Jadwal bulan ini</h2>
              <span className="text-muted-foreground text-xs">{bulan.length} konten</span>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[54rem] text-sm">
                <caption className="sr-only">Jadwal konten bulan ini</caption>
                <thead>
                  <tr className="border-surface-border text-muted-foreground border-b text-left text-xs uppercase tracking-wide">
                    <th className="py-2 pr-3 font-medium">Konten</th>
                    <th className="py-2 pr-3 font-medium">Jadwal</th>
                    <th className="py-2 pr-3 font-medium">Ide</th>
                    <th className="py-2 pr-3 font-medium">Status</th>
                    <th className="py-2 pr-3 font-medium">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {bulan.map((k) => (
                    <tr key={k.id} className="border-surface-border/60 border-b transition-colors">
                      <td className="py-2 pr-3 font-medium">{k.judul}</td>
                      <td className="py-2 pr-3 tabular-nums">{formatJadwal(k.jadwal_at ?? "")}</td>
                      <td className="text-muted-foreground py-2 pr-3">{k.ide_judul || "—"}</td>
                      <td className="py-2 pr-3">
                        <span className="inline-flex items-center gap-2">
                          <StatusBadge status={k.status} />
                          {lewatDari(k.jadwal_at ?? "") ? (
                            <span className="text-status-failed text-[11px] font-medium uppercase">
                              lewat
                            </span>
                          ) : null}
                        </span>
                      </td>
                      <td className="py-2 pr-3">
                        <div className="flex flex-wrap gap-3">
                          <button
                            type="button"
                            onClick={() => setBukaId(k.id)}
                            className="text-primary text-xs underline-offset-2 hover:underline"
                          >
                            Buka
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setUbahTarget({ id: k.id, judul: k.judul });
                              setUbahNilai(nilaiDatetimeLocal(k.jadwal_at ?? ""));
                            }}
                            className="text-primary text-xs underline-offset-2 hover:underline"
                          >
                            Jadwal ulang
                          </button>
                          <Link
                            href="/antrian"
                            className="text-muted-foreground text-xs underline-offset-2 hover:underline"
                          >
                            Batalkan di Antrian
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <Link href="/posting/baru" className={cn(btnUtama, "inline-flex items-center")}>
                Buat konten baru
              </Link>
              <Link href="/antrian" className={cn(btnGhost, "inline-flex items-center")}>
                Lihat Antrian review
              </Link>
            </div>
          </section>
        </>
      )}

      <section className="rounded-xl border border-surface-border bg-surface p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold">Status fitur</h2>
          <span className="text-muted-foreground text-xs">Fase 6</span>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {[
            {
              label: "Tampilan kalender mingguan",
              desc: "Kartu Senin-Minggu dengan konten terjadwal, hari ini ditandai.",
              selesai: true,
            },
            {
              label: "Jadwal dari Antrian",
              desc: "Tombol Jadwalkan aktif hanya untuk konten siap posting.",
              selesai: true,
            },
            {
              label: "Pindah jadwal",
              desc: "Drag blok ke hari lain dengan konfirmasi, plus tombol Jadwal ulang.",
              selesai: true,
            },
            {
              label: "Analitik per angle, hook, letak link",
              desc: "Tabel A/B ada di halaman Analitik, sumbernya laporan yang diimpor.",
              selesai: true,
            },
            {
              label: "Kirim ke Threads (Fase 7)",
              desc: posting.bisaKirimApi
                ? "Provider Threads API siap. Tombol Kirim sekarang muncul di dialog ini dan di Antrian review."
                : "Belum aktif: isi THREADS_USER_ID dan THREADS_ACCESS_TOKEN di server. Mode manual tetap jalur utama.",
              selesai: posting.bisaKirimApi,
            },
            {
              label: "Antrian otomatis berjeda",
              desc: "Jeda antar posting dan batas harian sudah berlaku; pengirim otomatis penuh menunggu K12.",
              selesai: true,
            },
          ].map((item) => (
            <div
              key={item.label}
              className="border-surface-border bg-background rounded-xl border p-4"
            >
              <p className="flex items-center gap-2 text-sm font-semibold">
                <span
                  aria-hidden
                  className={cn(
                    "inline-block size-2 rounded-full",
                    item.selesai ? "bg-status-ready" : "bg-status-draft",
                  )}
                />
                {item.label}
              </p>
              <p className="text-muted-foreground mt-1 text-xs">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Baca-saja: membuka utas tidak mengubah status atau jadwal apa pun. */}
      {dibuka ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) setBukaId(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="buka-judul"
            className="max-h-[85vh] w-[min(94vw,32rem)] overflow-y-auto rounded-xl border border-surface-border bg-surface p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <h2 id="buka-judul" className="text-base font-semibold">
                {dibuka.judul}
              </h2>
              <StatusBadge status={dibuka.status} />
            </div>
            <p className="text-muted-foreground mt-1 text-xs">
              {formatJadwal(dibuka.jadwal_at ?? "")} · {dibuka.statuses.length} status
              {dibuka.produk_nama ? ` · ${dibuka.produk_nama}` : ""}
            </p>

            <ol className="mt-4 space-y-2">
              {dibuka.statuses.map((s, i) => (
                <li
                  key={`${dibuka.id}-${i}`}
                  className="rounded-lg border border-surface-border bg-background p-3 text-sm whitespace-pre-wrap"
                >
                  <span className="text-muted-foreground mb-1 block text-[11px] uppercase">
                    Status {i + 1} · {s.trim().length} karakter
                  </span>
                  {s}
                </li>
              ))}
            </ol>

            <div className="mt-5 flex flex-wrap items-center justify-end gap-3">
              {posting.bisaKirimApi && lewatDari(dibuka.jadwal_at ?? "") ? (
                <button
                  type="button"
                  onClick={() => setKirimTarget(dibuka)}
                  className="mr-auto text-status-failed text-xs underline-offset-2 hover:underline"
                >
                  Jadwal sudah lewat — kirim sekarang
                </button>
              ) : null}
              <button type="button" onClick={() => setBukaId(null)} className={btnGhost}>
                Tutup
              </button>
              <button
                type="button"
                onClick={() => {
                  salinUtas(dibuka);
                  setBukaId(null);
                }}
                className={btnGhost}
              >
                Salin utas
              </button>
              {posting.bisaKirimApi ? (
                <button
                  type="button"
                  onClick={() => {
                    const izin = posting.izinKirim(dibuka);
                    if (!izin.boleh) {
                      setPesan(`“${dibuka.judul}” belum bisa dikirim: ${izin.alasan}`);
                      return;
                    }
                    setKirimTarget(dibuka);
                  }}
                  className={btnUtama}
                >
                  Kirim sekarang
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {/* Jadwal ulang lewat input: jalur keyboard dan layar sentuh. */}
      {ubahTarget !== null ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) setUbahTarget(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="ubah-judul"
            className="w-[min(94vw,26rem)] rounded-xl border border-surface-border bg-surface p-5"
          >
            <h2 id="ubah-judul" className="text-base font-semibold">
              Jadwal ulang
            </h2>
            <p className="text-muted-foreground mt-2 text-sm">
              Hanya penanda jadwal di kalender. Konten tetap berstatus terjadwal dan bisa dibatalkan
              dari Antrian review.
            </p>
            <p className="mt-3 text-sm font-medium">{ubahTarget.judul}</p>
            <label className="text-muted-foreground mt-3 block text-xs">
              Tanggal dan jam baru
              <input
                type="datetime-local"
                value={ubahNilai}
                onChange={(e) => setUbahNilai(e.target.value)}
                className={cn(inputClass, "mt-1")}
              />
            </label>
            <div className="mt-5 flex justify-end gap-3">
              <button type="button" onClick={() => setUbahTarget(null)} className={btnGhost}>
                Batal
              </button>
              <button
                type="button"
                autoFocus
                onClick={() => {
                  const target = ubahTarget;
                  if (!target) return;
                  const d = new Date(ubahNilai);
                  if (!Number.isFinite(d.getTime())) {
                    setPesan("Tanggal jadwal tidak valid.");
                    setUbahTarget(null);
                    return;
                  }
                  simpanPindah(target.id, target.judul, d.toISOString());
                  setUbahTarget(null);
                }}
                className={btnUtama}
              >
                Simpan jadwal
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Konfirmasi kirim (Fase 7): pengiriman selalu butuh aksi user. */}
      <ConfirmDialog
        open={kirimTarget !== null}
        judul="Kirim ke Threads?"
        pesan={
          kirimTarget
            ? `“${kirimTarget.judul}” dikirim sebagai utas ${kirimTarget.statuses.length} status, berurutan. Status konten berubah jadi terkirim.`
            : ""
        }
        labelKonfirmasi="Kirim sekarang"
        destructive={false}
        onKonfirmasi={() => {
          const target = kirimTarget;
          setKirimTarget(null);
          if (target) void jalankanKirim(target);
        }}
        onBatal={() => setKirimTarget(null)}
      />

      {/* Konfirmasi perpindahan hasil drag (UI-Spec 3.4: dengan konfirmasi). */}
      <ConfirmDialog
        open={pindah !== null}
        judul="Pindah jadwal?"
        pesan={
          pindah
            ? `"${pindah.judul}" dipindah ke ${formatJadwal(pindah.ke)} (jamnya tetap). Status konten tidak berubah.`
            : ""
        }
        labelKonfirmasi="Pindah"
        destructive={false}
        onKonfirmasi={() => {
          if (pindah) simpanPindah(pindah.id, pindah.judul, pindah.ke);
          setPindah(null);
        }}
        onBatal={() => setPindah(null)}
      />
    </div>
  );
}
