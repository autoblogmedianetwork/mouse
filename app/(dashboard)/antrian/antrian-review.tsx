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
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { CostWidget } from "@/components/cost-widget";
import { EmptyState } from "@/components/empty-state";
import { ReviewTabs } from "@/components/review-tabs";
import { StatusBadge } from "@/components/status-badge";
import { BATAS_BIAYA_USD_BAWAAN } from "@/lib/ai/biaya";
import type { StatistikBiaya } from "@/lib/ai/statistik";
import { usePosting } from "@/features/posting/use-posting";
import { RiwayatSupabase } from "@/features/konten/riwayat-supabase";
import { eksporJSON, eksporTXT, gabungKonten, imporJSON } from "@/lib/konten/ekspor";
import { catatRiwayat } from "@/lib/konten/riwayat";
import {
  TAB_REVIEW,
  bisaTandaiSiap,
  filterKonten,
  hitungTab,
  statusDariTab,
  type Konten,
  type TabReview,
} from "@/lib/konten/skema";
import {
  arsipkanKonten,
  batalkanJadwal,
  duplikatKonten,
  jadwalkanKonten,
  tandaiGagal,
  tandaiTerkirim,
} from "@/lib/konten/store";
import { useLocalState } from "@/lib/konten/use-local-state";
import { subIdDefault } from "@/lib/performa/atribusi";
import { cn } from "@/lib/utils";

const inputClass =
  "w-full rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary";
const btnGhost =
  "rounded-lg border border-surface-border px-3 py-1.5 text-xs font-medium hover:bg-muted";

interface Konfirmasi {
  judul: string;
  pesan: string;
  labelKonfirmasi: string;
  destructive?: boolean;
  jalankan: () => void;
}

interface AksiKartu {
  label: string;
  jalankan: (k: Konten) => void;
  destructive?: boolean;
}

function unduh(namaFile: string, isi: string, mime: string) {
  const blob = new Blob([isi], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = namaFile;
  a.click();
  URL.revokeObjectURL(url);
}

export function AntrianReview() {
  const [konten, setKonten] = useLocalState<Konten[]>("autothreads-konten", []);
  const [pengaturan] = useLocalState<{ sebut_kekurangan: boolean }>("autothreads-pengaturan", {
    sebut_kekurangan: true,
  });
  const [tab, setTab] = useState<TabReview>("perlu_review");
  const [q, setQ] = useState("");
  const [rentang, setRentang] = useState<"semua" | "7d" | "30d">("semua");
  const [terpilih, setTerpilih] = useState<string[]>([]);
  const [bukaId, setBukaId] = useState<string | null>(null);
  const [konfirmasi, setKonfirmasi] = useState<Konfirmasi | null>(null);
  const [pesan, setPesan] = useState<string | null>(null);
  const [jadwalTarget, setJadwalTarget] = useState<{ id: string; judul: string } | null>(null);
  const [jadwalTanggal, setJadwalTanggal] = useState("");
  /** Konten yang menunggu konfirmasi kirim (Fase 7, selalu lewat ConfirmDialog). */
  const [kirimTarget, setKirimTarget] = useState<Konten | null>(null);
  const [sedangKirim, setSedangKirim] = useState(false);
  const posting = usePosting();
  const [biaya, setBiaya] = useState<StatistikBiaya>({
    hariIniUsd: null,
    bulanIniUsd: null,
    adaCatatan: false,
    batasUsd: BATAS_BIAYA_USD_BAWAAN,
    persenBulan: 0,
    perFungsi: {},
    totalTokens: 0,
  });
  const fileRef = useRef<HTMLInputElement>(null);

  // Cost source of truth: /api/biaya reads the `generations` table (Fase 5).
  // Failure keeps the widget's "belum ada data" state instead of fake zeros.
  useEffect(() => {
    let hidup = true;
    fetch("/api/biaya")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (hidup && d?.ok) {
          setBiaya({
            hariIniUsd: d.hariIniUsd ?? null,
            bulanIniUsd: d.bulanIniUsd ?? null,
            adaCatatan: Boolean(d.adaCatatan),
            batasUsd: typeof d.batasUsd === "number" ? d.batasUsd : BATAS_BIAYA_USD_BAWAAN,
            persenBulan: typeof d.persenBulan === "number" ? d.persenBulan : 0,
            perFungsi: d.perFungsi ?? {},
            totalTokens: typeof d.totalTokens === "number" ? d.totalTokens : 0,
          });
        }
      })
      .catch(() => {
        // jaringan/API gagal: biarkan state kosong, tanpa angka rekayasa
      });
    return () => {
      hidup = false;
    };
  }, []);

  const jumlah = useMemo(() => hitungTab(konten), [konten]);
  const hasil = useMemo(
    () =>
      filterKonten(konten, { q, status: statusDariTab(tab), rentang }),
    [konten, q, rentang, tab],
  );

  const lakukan = (fn: (list: Konten[]) => Konten[]) => setKonten(fn);

  const ubahStatus = (ids: string[], status: Konten["status"], catatan: string) => {
    const set = new Set(ids);
    const now = new Date().toISOString();
    lakukan((list) =>
      list.map((k) => (set.has(k.id) ? { ...k, status, updated_at: now } : k)),
    );
    setTerpilih([]);
    setPesan(catatan);
  };

  /**
   * Bulk "tandai siap" runs the same gate as Buat posting for every selected
   * content; the ones that fail are skipped and reported, never silently
   * promoted.
   */
  const tandaiSiapMassal = (ids: string[]) => {
    const dipilih = konten.filter((k) => ids.includes(k.id));
    const lolos = dipilih.filter(
      (k) => bisaTandaiSiap(k, pengaturan.sebut_kekurangan).boleh,
    );
    const dilewat = dipilih.length - lolos.length;
    if (lolos.length === 0) {
      setPesan(
        "Tidak ada yang bisa ditandai siap. Lengkapi checklist di Buat posting dulu.",
      );
      return;
    }
    ubahStatus(
      lolos.map((k) => k.id),
      "siap_posting",
      `${lolos.length} konten ditandai siap posting.${
        dilewat > 0 ? ` ${dilewat} konten dilewati karena checklist belum lengkap.` : ""
      }`,
    );
  };

  const mintaTandaiSiap = (id: string) => {
    const k = konten.find((x) => x.id === id);
    if (!k) return;
    const hasil = bisaTandaiSiap(k, pengaturan.sebut_kekurangan);
    if (!hasil.boleh) {
      setPesan(`“${k.judul}” belum bisa ditandai siap: ${hasil.alasan}`);
      return;
    }
    ubahStatus([id], "siap_posting", "Konten ditandai siap posting.");
  };

  const mintaTolak = (ids: string[]) => {
    if (ids.length === 0) return;
    const label = ids.length === 1 ? `“${konten.find((k) => k.id === ids[0])?.judul}”` : `${ids.length} konten`;
    setKonfirmasi({
      judul: ids.length === 1 ? "Tolak konten?" : `Tolak ${ids.length} konten?`,
      pesan: `${label} dipindahkan ke tab Ditolak. Anda bisa memulihkannya kapan saja.`,
      labelKonfirmasi: "Tolak",
      destructive: true,
      jalankan: () =>
        ubahStatus(ids, "ditolak", `${ids.length} konten ditolak.`),
    });
  };

  const mintaHapus = (ids: string[]) => {
    if (ids.length === 0) return;
    const set = new Set(ids);
    setKonfirmasi({
      judul: ids.length === 1 ? "Hapus konten?" : `Hapus ${ids.length} konten?`,
      pesan:
        ids.length === 1
          ? `“${konten.find((k) => k.id === ids[0])?.judul}” akan dihapus permanen. Tindakan ini tidak bisa dibatalkan.`
          : `${ids.length} konten akan dihapus permanen. Tindakan ini tidak bisa dibatalkan.`,
      labelKonfirmasi: "Hapus",
      destructive: true,
      jalankan: () => {
        lakukan((list) => list.filter((k) => !set.has(k.id)));
        setTerpilih([]);
        setPesan(`${ids.length} konten dihapus.`);
      },
    });
  };

  const onArsip = (id: string) => {
    const k = konten.find((x) => x.id === id);
    if (!k) return;
    if (k.arsip) {
      lakukan((list) => arsipkanKonten(list, id, false));
      setPesan("Konten dikembalikan dari arsip.");
      return;
    }
    setKonfirmasi({
      judul: "Arsipkan konten?",
      pesan: `“${k.judul}” dipindahkan ke arsip. Arsip lebih dari 90 hari bisa dibersihkan (K3).`,
      labelKonfirmasi: "Arsipkan",
      jalankan: () => {
        lakukan((list) => arsipkanKonten(list, id, true));
        setPesan("Konten diarsipkan.");
      },
    });
  };

  const onDuplikat = (id: string) => {
    const k = konten.find((x) => x.id === id);
    if (!k) return;
    lakukan((list) => [duplikatKonten(k), ...list]);
    setPesan("Konten diduplikat sebagai draft baru.");
  };

  const salinUtas = (k: Konten) => {
    void navigator.clipboard.writeText(k.statuses.map((s) => s.trim()).join("\n\n"));
    setPesan(`Utas “${k.judul}” disalin ke clipboard.`);
  };

  const salinSubId = (id: string) => {
    void navigator.clipboard.writeText(subIdDefault(id));
    setPesan(`Kode pelacak ${subIdDefault(id)} disalin.`);
  };

  /**
   * Kirim satu konten ke provider posting (Fase 7). Selalu dipicu aksi user:
   * tombol -> konfirmasi -> rute server. Konten yang belum disetujui ditolak di
   * sini dan sekali lagi di server (lib/posting/antrian.ts).
   */
  const mintaKirim = (k: Konten) => {
    const izin = posting.izinKirim(k);
    if (!izin.boleh) {
      setPesan(`“${k.judul}” belum bisa dikirim: ${izin.alasan}`);
      return;
    }
    setKirimTarget(k);
  };

  const jalankanKirim = async (k: Konten) => {
    setSedangKirim(true);
    const hasil = await posting.kirim(k);
    setSedangKirim(false);
    if (hasil.ok) {
      lakukan((list) => tandaiTerkirim(list, k.id));
      catatRiwayat({
        konten_judul: k.judul,
        mode: hasil.penyedia === "manual" ? "manual" : "auto",
        status_akhir: "terkirim",
        catatan:
          hasil.penyedia === "manual"
            ? "Dikirim lewat mode manual (salin utas)."
            : `Terkirim ke Threads (${hasil.id_terkirim.length} status).`,
      });
      setPesan(
        hasil.penyedia === "manual"
          ? `Mode manual: utas “${k.judul}” siap disalin.`
          : `“${k.judul}” terkirim ke Threads (${hasil.id_terkirim.length} status).`,
      );
      return;
    }

    // Gagal API bukan alasan menghapus konten: status jadi `gagal`, utas tetap
    // utuh, dan user diarahkan ke salin manual (ADR 0002).
    lakukan((list) => tandaiGagal(list, k.id));
    catatRiwayat({
      konten_judul: k.judul,
      mode: "auto",
      status_akhir: "gagal",
      catatan: hasil.error ?? "Pengiriman gagal.",
    });
    setPesan(
      hasil.jatuh_ke_manual
        ? `${hasil.error} Konten tetap ada di pustaka dan bisa disalin manual.`
        : (hasil.error ?? "Pengiriman tidak diizinkan."),
    );
  };

  const ekspor = (format: "json" | "txt") => {
    const stamp = new Date().toISOString().slice(0, 10);
    if (format === "json") {
      unduh(`autothreads-cadangan-${stamp}.json`, eksporJSON(konten), "application/json");
    } else {
      unduh(`autothreads-konten-${stamp}.txt`, eksporTXT(hasil), "text/plain");
    }
    setPesan(`Ekspor ${format.toUpperCase()} diunduh.`);
  };

  const impor = async (file: File) => {
    try {
      const teks = await file.text();
      const data = imporJSON(teks);
      setKonten((prev) => gabungKonten(prev, data));
      setPesan(`${data.length} konten diimpor dari cadangan.`);
    } catch (err) {
      setPesan(err instanceof Error ? err.message : "Impor gagal.");
    }
  };

  const aksiKartu = (k: Konten): AksiKartu[] => {
    const salin = { label: "Salin utas", jalankan: salinUtas };
    const buka = { label: "Lihat", jalankan: (x: Konten) => setBukaId(x.id) };
    const kembaliDraft = {
      label: "Kembalikan ke draft",
      jalankan: (x: Konten) => ubahStatus([x.id], "draft", "Konten kembali ke draft."),
    };
    const hapus = {
      label: "Hapus",
      jalankan: (x: Konten) => mintaHapus([x.id]),
      destructive: true,
    };
    const duplikat = { label: "Duplikat", jalankan: (x: Konten) => onDuplikat(x.id) };

    switch (k.status) {
      case "draft":
        return [
          { label: "Tandai siap", jalankan: (x: Konten) => mintaTandaiSiap(x.id) },
          { label: "Tolak", jalankan: (x: Konten) => mintaTolak([x.id]) },
          buka,
          { label: "Arsipkan", jalankan: (x: Konten) => onArsip(x.id) },
          hapus,
        ];
      case "siap_posting":
        return [
          salin,
          { label: "Jadwalkan", jalankan: (x: Konten) => setJadwalTarget({ id: x.id, judul: x.judul }) },
          kembaliDraft,
          { label: "Arsipkan", jalankan: (x: Konten) => onArsip(x.id) },
          hapus,
        ];
      case "terjadwal":
        return [
          // Tombol kirim hanya muncul kalau provider posting siap (aturan 8).
          ...(posting.bisaKirimApi
            ? [{ label: "Kirim sekarang", jalankan: (x: Konten) => mintaKirim(x) }]
            : []),
          {
            label: "Batalkan jadwal",
            jalankan: (x: Konten) => {
              lakukan((list) => batalkanJadwal(list, x.id));
              setPesan("Jadwal dibatalkan. Konten kembali ke siap posting.");
            },
          },
          salin,
          hapus,
        ];
      case "gagal":
        return [
          salin,
          kembaliDraft,
          ...(posting.bisaKirimApi
            ? [{ label: "Coba lagi", jalankan: (x: Konten) => mintaKirim(x) }]
            : []),
          hapus,
        ];
      case "terkirim":
        return [salin, duplikat, { label: "Arsipkan", jalankan: (x: Konten) => onArsip(x.id) }, hapus];
      case "ditolak":
        return [
          {
            label: "Pulihkan ke draft",
            jalankan: (x: Konten) => ubahStatus([x.id], "draft", "Konten dipulihkan ke draft."),
          },
          duplikat,
          hapus,
        ];
      default:
        return [salin, kembaliDraft, hapus];
    }
  };

  const dibuka = bukaId ? konten.find((k) => k.id === bukaId) : null;
  const semuaTerpilih = hasil.length > 0 && hasil.every((k) => terpilih.includes(k.id));

  return (
    <div className="space-y-4">
      {pesan ? (
        <p className="text-sm text-status-ready" aria-live="polite">
          {pesan}
        </p>
      ) : null}

      {/* Header antrian (UI-Spec 3.9): judul, widget biaya, jeda semua */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Antrian review</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Semua konten menunggu tinjauan Anda. Tidak ada yang menjadi siap posting tanpa checklist.
          </p>
        </div>
        <CostWidget
          hariIniUsd={biaya.hariIniUsd}
          bulanIniUsd={biaya.bulanIniUsd}
          adaCatatan={biaya.adaCatatan}
          batasUsd={biaya.batasUsd}
        />
      </div>

      {/* Status provider posting (UI-Spec 3.8): jelas mode apa yang aktif sekarang. */}
      {posting.siap ? (
        <p className="text-xs text-muted-foreground">
          Provider posting:{" "}
          <span className="text-foreground font-medium">
            {posting.bisaKirimApi ? "Threads API siap dipakai" : "manual saja (salin utas)"}
          </span>
          .{" "}
          {posting.bisaKirimApi
            ? "Tombol Kirim sekarang muncul di tab Terjadwal dan Gagal posting."
            : posting.tersedia.find((p) => p.id === "threads_api")?.alasan ??
              "Mode manual selalu tersedia tanpa API."}
        </p>
      ) : null}

      <ReviewTabs
        tabs={TAB_REVIEW.map((t) => ({
          value: t.value,
          label: t.label,
          jumlah: jumlah[t.value],
        }))}
        aktif={tab}
        onSelect={(value) => {
          setTab(value as TabReview);
          setTerpilih([]);
        }}
      />

      {/* Filter dan data cadangan */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="search"
          placeholder="Cari judul atau isi status…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Cari konten"
          className={cn(inputClass, "sm:max-w-xs")}
        />
        <select
          value={rentang}
          onChange={(e) => setRentang(e.target.value as typeof rentang)}
          aria-label="Filter tanggal"
          className={cn(inputClass, "sm:w-40")}
        >
          <option value="semua">Semua tanggal</option>
          <option value="7d">7 hari terakhir</option>
          <option value="30d">30 hari terakhir</option>
        </select>

        <div className="flex flex-wrap gap-2 sm:ml-auto">
          <button type="button" onClick={() => ekspor("json")} className={btnGhost}>
            Ekspor JSON
          </button>
          <button type="button" onClick={() => ekspor("txt")} className={btnGhost}>
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
              if (f) void impor(f);
              e.target.value = "";
            }}
          />
        </div>
      </div>

      {/* Aksi massal (UI-Spec 3.9) */}
      {terpilih.length > 0 ? (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-surface-border bg-surface px-4 py-3">
          <p className="text-sm font-medium">{terpilih.length} konten dipilih</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => tandaiSiapMassal(terpilih)}
              className={cn(btnGhost, "text-status-ready")}
            >
              Tandai siap
            </button>
            <button type="button" onClick={() => mintaTolak(terpilih)} className={btnGhost}>
              Tolak
            </button>
            <button
              type="button"
              onClick={() => mintaHapus(terpilih)}
              className={cn(btnGhost, "text-status-failed")}
            >
              Hapus
            </button>
          </div>
          <button
            type="button"
            onClick={() => setTerpilih([])}
            className={cn(btnGhost, "sm:ml-auto")}
          >
            Bersihkan pilihan
          </button>
        </div>
      ) : null}

      {hasil.length === 0 ? (
        <EmptyState
          title={konten.length === 0 ? "Antrian masih kosong" : "Tidak ada yang cocok"}
          description={
            konten.length === 0
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
                setTerpilih(e.target.checked ? hasil.map((k) => k.id) : [])
              }
              aria-label="Pilih semua konten di tab ini"
              className="h-4 w-4 accent-[var(--primary)]"
            />
            <span className="text-xs text-muted-foreground">
              {semuaTerpilih ? "Batalkan pilihan semua" : "Pilih semua di tab ini"}
            </span>
          </li>

          {hasil.map((k) => (
            <li
              key={k.id}
              className="flex flex-col gap-3 rounded-xl border border-surface-border bg-surface p-4 sm:flex-row"
            >
              <input
                type="checkbox"
                checked={terpilih.includes(k.id)}
                onChange={(e) =>
                  setTerpilih((prev) =>
                    e.target.checked ? [...prev, k.id] : prev.filter((id) => id !== k.id),
                  )
                }
                aria-label={`Pilih ${k.judul}`}
                className="mt-1 h-4 w-4 shrink-0 accent-[var(--primary)]"
              />

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-semibold leading-5">{k.judul}</h3>
                  <StatusBadge status={k.status} />
                  {k.otomatis ? (
                    <span className="rounded-full border border-surface-border px-2 py-0.5 text-xs font-medium text-status-scheduled">
                      Otomatis
                    </span>
                  ) : null}
                </div>

                <p className="mt-1 text-xs text-muted-foreground">
                  {k.produk_nama || "Tanpa produk"} ·{" "}
                  {new Date(k.updated_at).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                  {" · "}
                  {k.statuses.length} status
                  {k.skor !== null ? ` · skor ide ${k.skor}` : ""}
                  {k.letak_link !== "tanpa_link" ? " · link aktif" : ""}
                </p>

                <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                  {k.statuses[0]}
                </p>

                <p className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                  <span>Kode pelacak</span>
                  <span className="font-mono text-foreground">{subIdDefault(k.id)}</span>
                  <button
                    type="button"
                    onClick={() => salinSubId(k.id)}
                    className="underline-offset-2 hover:text-foreground hover:underline"
                    aria-label={`Salin kode pelacak ${k.judul}`}
                  >
                    Salin
                  </button>
                </p>
              </div>

              <div className="flex flex-wrap gap-2 sm:flex-col sm:items-end">
                {aksiKartu(k).map((a) => (
                  <button
                    key={a.label}
                    type="button"
                    onClick={() => a.jalankan(k)}
                    className={cn(btnGhost, a.destructive && "text-status-failed")}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Dialog lihat + salin utas, baca-saja */}
      {dibuka ? (
        <ConfirmDialog
          open
          judul={dibuka.judul}
          pesan={`${dibuka.statuses.length} status · ${
            dibuka.status === "siap_posting" ? "siap posting" : dibuka.status
          }. Menutup dialog ini tidak mengubah apa pun.`}
          labelKonfirmasi="Salin utas"
          destructive={false}
          onKonfirmasi={() => {
            salinUtas(dibuka);
            setBukaId(null);
          }}
          onBatal={() => setBukaId(null)}
        />
      ) : null}

      <ConfirmDialog
        open={konfirmasi !== null}
        judul={konfirmasi?.judul ?? ""}
        pesan={konfirmasi?.pesan ?? ""}
        labelKonfirmasi={konfirmasi?.labelKonfirmasi ?? "Lanjutkan"}
        destructive={konfirmasi?.destructive ?? false}
        onKonfirmasi={() => {
          konfirmasi?.jalankan();
          setKonfirmasi(null);
        }}
        onBatal={() => setKonfirmasi(null)}
      />

      {/* Konfirmasi kirim (Fase 7): tidak ada pengiriman tanpa aksi user. */}
      <ConfirmDialog
        open={kirimTarget !== null}
        judul="Kirim ke Threads?"
        pesan={
          kirimTarget
            ? `“${kirimTarget.judul}” akan dikirim sebagai utas ${kirimTarget.statuses.length} status, berurutan. Setelah terkirim, konten berpindah ke tab Sudah posting.`
            : ""
        }
        labelKonfirmasi={sedangKirim ? "Mengirim…" : "Kirim sekarang"}
        destructive={false}
        onKonfirmasi={() => {
          const target = kirimTarget;
          setKirimTarget(null);
          if (target) void jalankanKirim(target);
        }}
        onBatal={() => setKirimTarget(null)}
      />

      {/* Dialog jadwal (UI-Spec 2.5/3.4): hanya siap_posting, konfirmasi di dalam dialog. */}
      {jadwalTarget !== null ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) setJadwalTarget(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="jadwal-judul"
            className="w-[min(94vw,26rem)] rounded-xl border border-surface-border bg-surface p-5"
          >
            <h2 id="jadwal-judul" className="text-base font-semibold">
              Jadwalkan konten
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Hanya penanda jadwal di kalender (mode manual tetap jalur utama). Konten yang dijadwalkan
              bisa dibatalkan kapan saja dari tab Terjadwal.
            </p>
            <p className="mt-3 text-sm font-medium">{jadwalTarget.judul}</p>
            <label className="mt-3 block text-xs text-muted-foreground">
              Tanggal dan jam
              <input
                type="datetime-local"
                value={jadwalTanggal}
                onChange={(e) => setJadwalTanggal(e.target.value)}
                className={cn(inputClass, "mt-1")}
              />
            </label>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setJadwalTarget(null)}
                className="h-9 rounded-lg border border-surface-border px-4 text-sm font-medium hover:bg-muted"
              >
                Batal
              </button>
              <button
                type="button"
                autoFocus
                onClick={() => {
                  // datetime-local has no zone: append local offset by parsing as local.
                  const d = new Date(jadwalTanggal);
                  const hasil = jadwalkanKonten(konten, jadwalTarget.id, d.toISOString());
                  if (!hasil.ok) {
                    setPesan(hasil.alasan ?? "Jadwal tidak bisa disimpan.");
                    setJadwalTarget(null);
                    return;
                  }
                  setKonten(hasil.list);
                  setPesan(
                    `Jadwal disimpan: ${d.toLocaleString("id-ID", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}. Buka /kalender untuk melihatnya.`,
                  );
                  setJadwalTarget(null);
                }}
                className="h-9 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
              >
                Simpan jadwal
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Riwayat hasil terakhir dari tabel contents Supabase (N-5). */}
      <RiwayatSupabase />
    </div>
  );
}
