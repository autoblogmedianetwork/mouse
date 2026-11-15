"use client";

/**
 * Hook seluruh state & logika antrian review (dipecah dari antrian-review.tsx,
 * R6d) — state konten, tab, pilihan massal, konfirmasi, kirim (Fase 7),
 * ekspor/impor, jadwal, dan peta aksi per kartu. UI ada di antrian-review.tsx
 * dan kartu-konten.tsx.
 */
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BATAS_BIAYA_USD_BAWAAN } from "@/lib/ai/biaya";
import type { StatistikBiaya } from "@/lib/ai/statistik";
import { usePosting } from "@/features/posting/use-posting";
import { siapkanDraftDaurUlang } from "@/lib/konten/daur-ulang";
import { eksporCSV, eksporJSON, eksporTXT, gabungKonten, imporJSON } from "@/lib/konten/ekspor";
import { kemasanMultiPlatform } from "@/lib/konten/kemasan-multi-platform";
import { catatRiwayat } from "@/lib/konten/riwayat";
import { hitungSkorShadowban } from "@/lib/konten/skor-shadowban";
import {
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
import type { AksiKartu, Konfirmasi } from "./antrian-bersama";
import { unduh } from "./antrian-bersama";

export function useAntrian() {
  const [konten, setKonten] = useLocalState<Konten[]>("autothreads-konten", []);
  const [pengaturan] = useLocalState<{ sebut_kekurangan: boolean }>("autothreads-pengaturan", {
    sebut_kekurangan: true,
  });
  const [tab, setTab] = useState<TabReview>("perlu_review");
  const [q, setQ] = useState("");
  const [rentang, setRentang] = useState<"semua" | "7d" | "30d">("semua");
  const [terpilih, setTerpilih] = useState<string[]>([]);
  const [bukaId, setBukaId] = useState<string | null>(null);
  const [produkList] = useLocalState("autothreads-products", [] as Array<Record<string, unknown>>);
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
    perProvider: {},
    fallbackPanggilan: 0,
    fallbackTerakhir: null,
    totalTokens: 0,
  });
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
            perProvider: d.perProvider ?? {},
            fallbackPanggilan:
              typeof d.fallbackPanggilan === "number" ? d.fallbackPanggilan : 0,
            fallbackTerakhir: d.fallbackTerakhir ?? null,
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

  const router = useRouter();
  const onDaurUlang = (k: Konten) => {
    const draft = siapkanDraftDaurUlang(k, produkList);
    try {
      window.localStorage.setItem("autothreads-draft-posting", JSON.stringify(draft));
    } catch {
      setPesan("Penyimpanan penuh — draft daur ulang gagal disimpan.");
      return;
    }
    setPesan(`Konten "${k.judul}" dibuka di wizard sebagai daur ulang.`);
    router.push("/posting/baru");
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

  /** Skor shadowban per konten yang tampil di kartu (ide #32). */
  const skorKartu = useMemo(() => {
    const peta = new Map<string, ReturnType<typeof hitungSkorShadowban>>();
    for (const k of hasil) peta.set(k.id, hitungSkorShadowban(k.statuses));
    return peta;
  }, [hasil]);

  /** Kemasan 3 platform (Gelombang 2): utas + caption TikTok + status WA sekaligus. */
  const salinKemasan = (k: Konten) => {
    const kemasan = kemasanMultiPlatform(k);
    void navigator.clipboard.writeText(kemasan.teks);
    setPesan(
      `Kemasan “${k.judul}” disalin: utas Threads, caption TikTok, dan status WhatsApp.`,
    );
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
        ? `${hasil.error} Konten tetap ada di daftar konten dan bisa disalin manual.`
        : (hasil.error ?? "Pengiriman tidak diizinkan."),
    );
  };

  const ekspor = (format: "json" | "txt" | "csv") => {
    const stamp = new Date().toISOString().slice(0, 10);
    if (format === "json") {
      unduh(`autothreads-cadangan-${stamp}.json`, eksporJSON(konten), "application/json");
    } else if (format === "csv") {
      unduh(`autothreads-konten-${stamp}.csv`, eksporCSV(hasil), "text/csv;charset=utf-8");
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
        return [
          salin,
          duplikat,
          { label: "Daur ulang", jalankan: (x: Konten) => onDaurUlang(x) },
          { label: "Arsipkan", jalankan: (x: Konten) => onArsip(x.id) },
          hapus,
        ];
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

  const simpanJadwal = () => {
    if (!jadwalTarget) return;
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
  };

  return {
    // data & turunan
    konten,
    hasil,
    jumlah,
    skorKartu,
    biaya,
    posting,
    // tab & filter
    tab,
    setTab,
    q,
    setQ,
    rentang,
    setRentang,
    // pilihan massal
    terpilih,
    setTerpilih,
    tandaiSiapMassal,
    mintaTolak,
    mintaHapus,
    // kartu
    aksiKartu,
    salinUtas,
    salinKemasan,
    salinSubId,
    // dialog
    bukaId,
    setBukaId,
    konfirmasi,
    setKonfirmasi,
    kirimTarget,
    setKirimTarget,
    sedangKirim,
    jalankanKirim,
    jadwalTarget,
    setJadwalTarget,
    jadwalTanggal,
    setJadwalTanggal,
    simpanJadwal,
    // ekspor/impor
    ekspor,
    impor,
    // pesan
    pesan,
  };
}
