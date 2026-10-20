"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Analisis, Ide, Pengaturan } from "@/lib/ai/schemas";
import { FORMAT_LABELS, PENGATURAN_AWAL } from "@/lib/ai/schemas";
import { normalkanPersonaId } from "@/lib/ai/persona";
import { salinKeClipboard, teksUtasLengkap } from "@/lib/konten/salin";
import { decodePrefill, nilaiFormDariPrefill } from "@/lib/impor/prefill";
import { KartuQuickCapture } from "./kartu-quick-capture";
import { TombolSuaraNarasi } from "./tombol-suara-narasi";
import { TombolRenderVideo } from "./tombol-render-video";
import { PanduanFotoCandid } from "./panduan-foto-candid";
import type { ContentStatus } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { cn } from "@/lib/utils";
import { FormPenawaran, type PenawaranSaved } from "./form-penawaran";
import { type SavedProduct } from "./form-produk-manual";
import { PengaturanGenerate } from "./pengaturan-generate";
import { StatusEditor } from "./status-editor";
import { ThreadsPreview } from "./threads-preview";
import { CarouselSlideEditor } from "./carousel-slide-editor";
import type { CarouselResponse } from "@/lib/ai/schemas";
import { ChecklistGate, type ChecklistId } from "./checklist-gate";
import { ActionBar } from "./action-bar";
import { charLength, validateStatusList } from "@/lib/statuses/validator-500";
import { batasKarakterMode } from "@/lib/platforms/batas";
import { muatKonten, simpanKonten, upsertKonten } from "@/lib/konten/store";
import { CHECKLIST_AWAL } from "@/lib/konten/checklist";
import { kontenSkema, type Konten } from "@/lib/konten/skema";
import { catatRiwayat } from "@/lib/konten/riwayat";
import { buatIdeManual } from "@/lib/konten/ide-manual";
import { useLocalState } from "@/lib/konten/use-local-state";
import { terapkanDisclosureUtas } from "@/lib/konten/disclosure";
import { cariAturanBerdasarkanUrl, type ProgramAffiliate } from "@/lib/program-affiliate/skema";

/**
 * Alur bertahap Buat posting (PRD F0 checkpoint per tahap):
 * Penawaran → Analisis → Ide → Generate → Preview/Edit/Salin.
 * Semua output berstatus draft sampai user menekan "Tandai siap posting".
 */

type Langkah = "produk" | "analisis" | "ide" | "generate" | "preview";

const LANGKAH_LIST: Array<{ id: Langkah; label: string }> = [
  { id: "produk", label: "1. Penawaran" },
  { id: "analisis", label: "2. Analisis" },
  { id: "ide", label: "3. Ide" },
  { id: "generate", label: "4. Generate" },
  { id: "preview", label: "5. Preview & salin" },
];

const DRAFT_KEY = "autothreads-draft-posting";

interface KontenKerja {
  ide: Ide;
  statuses: string[];
  carousel?: CarouselResponse;
  /** ID of the matching entry in the content bank (Pustaka), if saved. */
  bankId?: string;
}

interface DraftState {
  produk: SavedProduct | null;
  analisis: Analisis | null;
  analisisManual: string;
  ideList: Ide[];
  ideDipilih: string[];
  pengaturan: Pengaturan;
  konten: KontenKerja[];
  kontenAktif: number;
  checklist: Record<ChecklistId, boolean>;
  status: ContentStatus;
  updatedAt: string;
}

const DRAFT_AWAL: DraftState = {
  produk: null,
  analisis: null,
  analisisManual: "",
  ideList: [],
  ideDipilih: [],
  pengaturan: PENGATURAN_AWAL,
  konten: [],
  kontenAktif: 0,
  checklist: CHECKLIST_AWAL,
  status: "draft",
  updatedAt: "",
};

function loadDraft(): DraftState {
  if (typeof window === "undefined") return DRAFT_AWAL;
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    if (!raw) return DRAFT_AWAL;
    const parsed = JSON.parse(raw) as Partial<DraftState>;
    // Draf lama menyimpan label persona ("Bawaan", "Sahabat", "Ahli");
    // normalkanPersonaId mengubahnya ke id supaya pilihan di form tidak kosong.
    const pengaturan: Pengaturan = {
      ...PENGATURAN_AWAL,
      ...(parsed.pengaturan ?? {}),
      persona: normalkanPersonaId(parsed.pengaturan?.persona),
    };
    return {
      ...DRAFT_AWAL,
      ...parsed,
      pengaturan,
      checklist: { ...CHECKLIST_AWAL, ...parsed.checklist },
    };
  } catch {
    return DRAFT_AWAL;
  }
}

interface ApiResult<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

async function postJson<T>(url: string, body: unknown): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = (await res.json()) as ApiResult<T>;
    return json;
  } catch {
    return { ok: false, error: "Jaringan bermasalah. Coba lagi." };
  }
}

const cardClass = "rounded-xl border border-surface-border bg-surface p-4 sm:p-6";
const primaryBtn =
  "inline-flex h-10 items-center rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-60";
const ghostBtn =
  "inline-flex h-10 items-center rounded-lg border border-surface-border px-5 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-60";

export function AlurBuatPosting({ prefillKode }: { prefillKode?: string } = {}) {
  // Quick Capture (N-8): parameter `prefill` dibaca murni saat render. Nilai
  // yang tidak valid menjadi null, jadi tidak ada isian setengah jadi.
  const prefill = useMemo(() => decodePrefill(prefillKode), [prefillKode]);
  const nilaiAwalProduk = useMemo(
    () => (prefill ? nilaiFormDariPrefill(prefill) : undefined),
    [prefill],
  );

  const [draft, setDraft] = useState<DraftState>(DRAFT_AWAL);
  const [langkah, setLangkah] = useState<Langkah>("produk");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tersimpanPukul, setTersimpanPukul] = useState<string | null>(null);
  const [pesan, setPesan] = useState<string | null>(null);
  const [programs] = useLocalState<ProgramAffiliate[]>("autothreads-link-programs", []);

  const catatanAturan = useMemo(() => {
    const dariProduk = (draft.produk as PenawaranSaved)?.catatan_aturan?.trim();
    if (dariProduk) return dariProduk;
    return cariAturanBerdasarkanUrl(programs, draft.produk?.url_referensi);
  }, [draft.produk, programs]);

  const bannerAturan = catatanAturan ? (
    <div className="flex items-start gap-3 rounded-none border border-amber-500/40 bg-amber-500/10 p-3.5 text-xs text-amber-700 dark:text-amber-300 font-mono">
      <span className="text-base leading-none">⚠️</span>
      <div>
        <p className="font-semibold uppercase tracking-wider">
          Pengingat Aturan Program Affiliate:
        </p>
        <p className="mt-1 leading-relaxed">{catatanAturan}</p>
      </div>
    </div>
  ) : null;
  // Form ide manual (PRD F1): selalu tersedia walau panggilan AI gagal.
  const [judulManual, setJudulManual] = useState("");
  const [deskripsiManual, setDeskripsiManual] = useState("");
  const [formatManual, setFormatManual] = useState<(typeof FORMAT_LABELS)[number]>("Problem-Solution");
  const dirtyRef = useRef(false);
  const loadedRef = useRef(false);

  // Muat draft tersimpan saat mount (autosave lokal, Supabase belum terhubung).
  useEffect(() => {
    const d = loadDraft();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrasi draft dari localStorage harus terjadi setelah mount; init langsung di useState akan bikin hydration mismatch
    setDraft(d);
    if (prefill) {
      // Quick Capture (N-8): user datang untuk meninjau hasil tangkapan, jadi
      // mulai dari tahap produk walau ada draft tersimpan.
      setLangkah("produk");
    } else if (d.produk || d.analisis || d.konten.length > 0) {
      setLangkah(d.konten.length > 0 ? "preview" : d.produk ? "analisis" : "produk");
      if (d.updatedAt) {
        setTersimpanPukul(new Date(d.updatedAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }));
      }
    }
    loadedRef.current = true;
  }, [prefill]);

  const update = useCallback((patch: Partial<DraftState>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
    dirtyRef.current = true;
  }, []);

  // Autosave tiap 10 detik jika ada perubahan (UI-Spec 5.3).
  useEffect(() => {
    if (!loadedRef.current) return;
    const timer = setInterval(() => {
      if (!dirtyRef.current) return;
      dirtyRef.current = false;
      const updatedAt = new Date().toISOString();
      const toSave = { ...draft, updatedAt };
      try {
        window.localStorage.setItem(DRAFT_KEY, JSON.stringify(toSave));
        setTersimpanPukul(
          new Date(updatedAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
        );
      } catch {
        // storage penuh/di-block: abaikan, draft tetap di memori
      }
    }, 10_000);
    return () => clearInterval(timer);
  }, [draft]);

  // Simpan draft manual juga menurunkan status siap posting kembali ke draft
  // jika konten diedit (Fase 3 exit criteria).
  const simpanDraft = () => {
    const updatedAt = new Date().toISOString();
    const kontenBaru = sinkronKeBank(draft.konten, "draft");
    const next = { ...draft, konten: kontenBaru, updatedAt, status: "draft" as const };
    try {
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify(next));
      setTersimpanPukul(
        new Date(updatedAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
      );
      setDraft(next);
      dirtyRef.current = false;
      setPesan("Draft tersimpan di browser dan masuk Pustaka konten.");
    } catch {
      setPesan("Gagal menyimpan ke localStorage.");
    }
  };

  const ringkasan = useMemo(() => {
    if (draft.analisis?.ringkasan) return draft.analisis.ringkasan;
    if (draft.analisisManual) return draft.analisisManual;
    return draft.produk?.deskripsi_bersih || draft.produk?.deskripsi || "";
  }, [draft.analisis, draft.analisisManual, draft.produk]);

  /**
   * Sinkronkan konten kerja ke Pustaka (bank konten). Returns the updated
   * working list so callers can persist the new bankIds into the draft.
   */
  const sinkronKeBank = (
    daftar: KontenKerja[],
    statusBank: Konten["status"],
  ): KontenKerja[] => {
    let bank = muatKonten();
    const now = new Date().toISOString();
    const hasil = daftar.map((k) => {
      const statuses = k.statuses.map((s) => s.trim()).filter((s) => s.length > 0);
      if (statuses.length === 0) return k;
      const lama = k.bankId ? bank.find((b) => b.id === k.bankId) : undefined;
      const entry = kontenSkema.parse({
        id: lama?.id ?? crypto.randomUUID(),
        judul: k.ide.judul,
        produk_nama: draft.produk?.nama_internal ?? "",
        ide_judul: k.ide.judul,
        statuses,
        status: statusBank,
        // Stored so Antrian review (F10) can run the checklist gate on bulk
        // "tandai siap" without trusting the current draft state.
        checklist: draft.checklist,
        otomatis: false,
        letak_link: draft.pengaturan.letak_link,
        // Recorded so Analitik can compare hook styles (Fase 6).
        gaya_hook: draft.pengaturan.gaya_hook,
        link_produk: draft.produk?.url_referensi ?? "",
        arsip: lama?.arsip ?? false,
        arsip_at: lama?.arsip_at ?? null,
        klik_manual: lama?.klik_manual ?? 0,
        komisi_manual: lama?.komisi_manual ?? 0,
        created_at: lama?.created_at ?? now,
        updated_at: now,
      });
      bank = upsertKonten(bank, entry);
      return { ...k, bankId: entry.id };
    });
    simpanKonten(bank);
    return hasil;
  };

  /* ----------------------------- Tahap: analisis ----------------------------- */

  const jalankanAnalisis = async () => {
    if (!draft.produk) return;
    setBusy("analisis");
    setError(null);
    const result = await postJson<Analisis>("/api/analisis", {
      deskripsi: draft.produk.deskripsi_bersih || draft.produk.deskripsi,
      nama: draft.produk.nama || draft.produk.nama_internal,
      varian: draft.produk.varian,
      harga: draft.produk.harga,
      kategori: (draft.produk as PenawaranSaved)?.kategori_penawaran,
    });
    setBusy(null);
    if (result.ok && result.data) {
      update({ analisis: result.data, analisisManual: result.data.ringkasan });
      setLangkah("analisis");
    } else {
      setError(result.error ?? "Analisis gagal.");
    }
  };

  /* ------------------------------- Tahap: ide -------------------------------- */

  const jalankanIde = async () => {
    if (!ringkasan) {
      setError("Isi ringkasan dulu (hasil analisis atau tulis manual).");
      return;
    }
    setBusy("ide");
    setError(null);
    const fiturList =
      draft.analisis?.fitur && draft.analisis.fitur.length > 0
        ? draft.analisis.fitur
        : (draft.produk as PenawaranSaved)?.fitur_keunggulan
          ? (draft.produk as PenawaranSaved)
              .fitur_keunggulan!.split(/[\n;]+/)
              .map((s) => s.trim())
              .filter(Boolean)
          : [];

    const result = await postJson<{ ide: Ide[] }>("/api/ide", {
      namaProduk: draft.produk?.nama_internal ?? "Penawaran",
      ringkasan,
      fitur: fiturList,
      target_audiens: draft.analisis?.target_audiens ?? [],
      angle: draft.analisis?.angle ?? [],
    });
    setBusy(null);
    if (result.ok && result.data) {
      update({
        ideList: result.data.ide,
        ideDipilih: result.data.ide.slice(0, 1).map((i) => i.judul),
      });
    } else {
      setError("AI sedang tidak tersedia. Silakan tulis ide manual.");
    }
  };

  const toggleIde = (judul: string) => {
    const dipilih = draft.ideDipilih.includes(judul)
      ? draft.ideDipilih.filter((j) => j !== judul)
      : [...draft.ideDipilih, judul];
    update({ ideDipilih: dipilih });
  };

  /** Tambah satu ide buatan tangan; langsung terpilih supaya alur bisa lanjut. */
  const tambahIdeManual = () => {
    const hasil = buatIdeManual({
      judul: judulManual,
      deskripsi: deskripsiManual,
      format_label: formatManual,
    });
    if (!hasil.ok) {
      setError(hasil.error);
      return;
    }
    if (draft.ideList.some((i) => i.judul === hasil.ide.judul)) {
      setError("Ide dengan judul itu sudah ada di daftar.");
      return;
    }
    update({
      ideList: [...draft.ideList, hasil.ide],
      ideDipilih: [...draft.ideDipilih, hasil.ide.judul],
    });
    setJudulManual("");
    setDeskripsiManual("");
    setError(null);
    setPesan(`Ide "${hasil.ide.judul}" ditambahkan dan ikut terpilih.`);
  };

  /* ------------------------------ Tahap: generate ----------------------------- */

  const jalankanGenerate = async () => {
    const terpilih = draft.ideList.filter((i) => draft.ideDipilih.includes(i.judul));
    if (terpilih.length === 0) {
      setError("Pilih minimal satu ide dulu.");
      return;
    }
    setBusy("generate");
    setError(null);
    setPesan(null);

    const kontenBaru: Array<KontenKerja> = [];
    const gagal: string[] = [];
    // Mode naskah video (prompt 09) dan carousel (prompt 08) memakai rute sendiri.
    const naskahVideo = draft.pengaturan.mode_output === "naskah_video";
    const carouselMode = draft.pengaturan.mode_output === "carousel";

    // Satu job per ide terpilih; satu gagal tidak menghentikan yang lain (PRD 15.1).
    for (const ide of terpilih) {
      const fiturList =
        draft.analisis?.fitur && draft.analisis.fitur.length > 0
          ? draft.analisis.fitur
          : (draft.produk as PenawaranSaved)?.fitur_keunggulan
            ? (draft.produk as PenawaranSaved)
                .fitur_keunggulan!.split(/[\n;]+/)
                .map((s) => s.trim())
                .filter(Boolean)
            : [];

      const body = {
        namaProduk: draft.produk?.nama_internal ?? "Penawaran",
        ringkasan,
        fitur: fiturList,
        ide,
        pengaturan: draft.pengaturan,
        link: draft.produk?.url_referensi || undefined,
        kategori: (draft.produk as PenawaranSaved)?.kategori_penawaran,
      };
      if (carouselMode) {
        const carouselBody = {
          ...body,
          handle: "@" + (draft.produk?.nama_internal || "affiliate"),
          jumlahSlide:
            draft.pengaturan.jumlah_status === "pendek"
              ? 4
              : draft.pengaturan.jumlah_status === "panjang"
                ? 7
                : 5,
        };
        const result = await postJson<CarouselResponse>("/api/carousel", carouselBody);
        if (result.ok && result.data) {
          const carousel = result.data;
          const statuses = [
            carousel.caption,
            ...carousel.slides.map((s) => {
              const head = s.headline || s.judul || "";
              const bodyText = s.isi || "";
              return s.kicker ? `[${s.kicker}] ${head}\n${bodyText}`.trim() : `${head}\n${bodyText}`.trim();
            }),
          ];
          kontenBaru.push({ ide, statuses, carousel });
        } else {
          gagal.push(ide.judul);
        }
        continue;
      }
      if (naskahVideo) {
        const result = await postJson<{
          hook_visual: string;
          fungsi_produk: string;
          cta: string;
        }>("/api/naskah-video", body);
        if (result.ok && result.data) {
          const { hook_visual, fungsi_produk, cta } = result.data;
          kontenBaru.push({ ide, statuses: [hook_visual, fungsi_produk, cta] });
        } else {
          gagal.push(ide.judul);
        }
        continue;
      }
      const result = await postJson<{ statuses: string[] }>("/api/generate", body);
      if (result.ok && result.data) {
        const statusesHasil = draft.pengaturan.sertakan_disclosure
          ? terapkanDisclosureUtas(
              result.data.statuses,
              batasKarakterMode(draft.pengaturan.mode_output),
              true,
            )
          : result.data.statuses;
        kontenBaru.push({ ide, statuses: statusesHasil });
      } else {
        gagal.push(ide.judul);
      }
    }

    setBusy(null);
    if (kontenBaru.length > 0) {
      update({ konten: kontenBaru, kontenAktif: 0, status: "draft" });
      setLangkah("preview");
    }
    if (gagal.length > 0) {
      setError(
        kontenBaru.length > 0
          ? `${gagal.length} konten gagal: ${gagal.join(", ")}. Bisa dicoba ulang.`
          : `Generate gagal: ${gagal.join(", ")}. Bisa ditulis manual di editor.`,
      );
      if (kontenBaru.length === 0) {
        // Fallback manual: user tetap bisa menulis status sendiri.
        update({
          konten: terpilih.map((ide) => ({ ide, statuses: [""] })),
          kontenAktif: 0,
          status: "draft",
        });
        setLangkah("preview");
      }
    }
  };

  /* ------------------------------ Tahap: preview ------------------------------ */

  const kontenAktif = draft.konten[draft.kontenAktif] ?? null;

  const setKontenAktif = (statuses: string[]) => {
    const konten = [...draft.konten];
    konten[draft.kontenAktif] = { ...konten[draft.kontenAktif], statuses };
    // Edit setelah "siap posting" membuat konten kembali draft (F0).
    update({ konten, status: draft.status === "siap_posting" ? "draft" : draft.status });
  };

  const setKontenAktifCarousel = (statuses: string[], carousel: CarouselResponse) => {
    const konten = [...draft.konten];
    konten[draft.kontenAktif] = { ...konten[draft.kontenAktif], statuses, carousel };
    update({ konten, status: draft.status === "siap_posting" ? "draft" : draft.status });
  };

  // Batas karakter mengikuti mode output: 500 untuk Threads, 280 untuk X,
  // dan 500 untuk naskah video (mengikuti constraint database).
  const batasKarakter = batasKarakterMode(draft.pengaturan.mode_output);

  const semuaValid = useMemo(() => {
    if (!kontenAktif || kontenAktif.statuses.length === 0) return false;
    const cleaned = kontenAktif.statuses.map((s) => s.trim()).filter((s) => s.length > 0);
    if (cleaned.length !== kontenAktif.statuses.length) return false;
    if (draft.pengaturan.mode_output === "carousel") {
      return Boolean(kontenAktif.carousel?.slides && kontenAktif.carousel.slides.length >= 3);
    }
    return validateStatusList(kontenAktif.statuses, batasKarakter).ok;
  }, [kontenAktif, batasKarakter, draft.pengaturan.mode_output]);

  const semuaChecklist = useMemo(() => {
    const items = draft.pengaturan.aturan_kepercayaan
      ? Object.values(draft.checklist)
      : Object.entries(draft.checklist)
          .filter(([id]) => id !== "kekurangan")
          .map(([, v]) => v);
    return items.every(Boolean);
  }, [draft.checklist, draft.pengaturan.aturan_kepercayaan]);

  const tandaiSiap = () => {
    if (!semuaValid || !semuaChecklist) return;
    const kontenBaru = sinkronKeBank(draft.konten, "siap_posting");
    setDraft((prev) => ({ ...prev, konten: kontenBaru, status: "siap_posting" }));
    dirtyRef.current = true;
    catatRiwayat({
      konten_judul: kontenBaru[draft.kontenAktif]?.ide.judul ?? "Konten",
      mode: "manual",
      status_akhir: "siap_posting",
      catatan: "Ditandai siap posting lewat checklist",
    });
    setPesan("Konten ditandai siap posting.");
  };

  const salinUtas = async () => {
    if (!kontenAktif) return;
    if (draft.pengaturan.mode_output === "carousel" && kontenAktif.carousel) {
      const buffer: string[] = [];
      buffer.push(`=== CAROUSEL: ${kontenAktif.ide.judul.toUpperCase()} ===\n`);
      kontenAktif.carousel.slides.forEach((s, i) => {
        buffer.push(`--- SLIDE ${i + 1} (${s.peran.toUpperCase()}) ---`);
        if (s.kicker) buffer.push(`[Label]: ${s.kicker}`);
        if (s.headline || s.judul) buffer.push(`[Judul]: ${s.headline || s.judul}`);
        if (s.isi) buffer.push(`[Penjelasan]: ${s.isi}`);
        buffer.push("");
      });
      buffer.push("=== CAPTION ===");
      buffer.push(kontenAktif.carousel.caption);
      const berhasil = await salinKeClipboard(buffer.join("\n"));
      if (!berhasil) {
        setPesan("Gagal menyalin. Izinkan akses clipboard lalu coba lagi.");
        return;
      }
      catatRiwayat({
        konten_judul: kontenAktif.ide.judul,
        mode: "manual",
        status_akhir: draft.status === "siap_posting" ? "siap_posting" : "draft",
        catatan: `Carousel disalin (${kontenAktif.carousel.slides.length} slide)`,
      });
      setPesan("Seluruh slide carousel dan caption berhasil disalin.");
      return;
    }
    // Teks disusun dan disalin lewat helper bersama (lib/konten/salin.ts) supaya
    // hasilnya sama dengan tombol salin per status.
    const berhasil = await salinKeClipboard(teksUtasLengkap(kontenAktif.statuses));
    if (!berhasil) {
      setPesan("Gagal menyalin. Izinkan akses clipboard lalu coba lagi.");
      return;
    }
    catatRiwayat({
      konten_judul: kontenAktif.ide.judul,
      mode: "manual",
      status_akhir: draft.status === "siap_posting" ? "siap_posting" : "draft",
      catatan: `Utas lengkap disalin (${kontenAktif.statuses.length} status)`,
    });
    setPesan(`Utas lengkap disalin (${kontenAktif.statuses.length} status).`);
  };

  /* --------------------------------- Render ---------------------------------- */

  const indexLangkah = LANGKAH_LIST.findIndex((l) => l.id === langkah);

  return (
    <div className="space-y-6">
      {/* Indeks langkah */}
      <nav aria-label="Tahap" className="flex flex-wrap gap-2">
        {LANGKAH_LIST.map((l, i) => {
          const aktif = l.id === langkah;
          const bisaKe =
            i <= indexLangkah ||
            (Boolean(draft.produk) && (l.id === "analisis" || l.id === "ide"));
          return (
            <button
              key={l.id}
              type="button"
              disabled={!bisaKe}
              onClick={() => bisaKe && setLangkah(l.id)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors sm:text-sm font-mono",
                aktif
                  ? "border-primary bg-primary text-primary-foreground font-semibold"
                  : bisaKe
                    ? "border-surface-border bg-surface hover:bg-muted"
                    : "border-surface-border bg-surface text-muted-foreground opacity-50",
              )}
            >
              {l.label}
            </button>
          );
        })}
      </nav>

      {error ? (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 rounded-none border border-status-failed/40 bg-status-failed/10 px-4 py-3 text-sm font-mono"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-xs underline-offset-2 hover:underline uppercase"
          >
            [ Tutup ]
          </button>
        </div>
      ) : null}

      {pesan ? (
        <p className="text-sm font-mono text-status-ready" aria-live="polite">
          {pesan}
        </p>
      ) : null}

      {/* ------------------------------ Tahap 1: penawaran --------------------------- */}
      {langkah === "produk" ? (
        <div className="space-y-6">
          {prefill ? (
            <div className="border border-primary/40 bg-primary/5 px-4 py-3 text-sm font-mono">
              <p className="font-medium text-xs uppercase">[ DATA DARI QUICK CAPTURE ]</p>
              <p className="mt-1 text-muted-foreground text-xs">
                Isian di bawah diambil dari halaman yang Anda tandai
                {prefill.sumber ? ` di ${prefill.sumber}` : ""}. Periksa dan lengkapi
                dulu; penawaran baru tersimpan setelah Anda menekan “Simpan penawaran”.
              </p>
            </div>
          ) : null}
          <FormPenawaran
            nilaiAwal={nilaiAwalProduk}
            onSaved={(penawaran) => {
              update({
                produk: penawaran,
                analisisManual:
                  penawaran.deskripsi_bersih || penawaran.deskripsi || penawaran.nama_internal,
                status: "draft",
              });
              setPesan("Penawaran tersimpan. Silakan pilih 'Lanjut ke analisis' atau 'Lewati ke ide'.");
            }}
          />
          <KartuQuickCapture />
          {draft.produk ? (
            <div className={cardClass}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground">
                    [ PENAWARAN AKTIF ]
                  </h2>
                  <p className="mt-1 text-sm font-medium">
                    {draft.produk.nama_internal}
                    {draft.produk.harga ? ` (${draft.produk.harga})` : ""}
                  </p>
                  {draft.produk.url_referensi ? (
                    <p className="text-xs font-mono text-muted-foreground truncate max-w-md mt-0.5">
                      {draft.produk.url_referensi}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    className="h-9 px-4 border border-surface-border bg-muted/60 hover:bg-muted text-xs font-mono uppercase font-medium transition-colors"
                    onClick={() => {
                      if (!draft.analisisManual) {
                        update({
                          analisisManual:
                            draft.produk?.deskripsi_bersih ||
                            draft.produk?.deskripsi ||
                            draft.produk?.nama_internal ||
                            "",
                        });
                      }
                      setLangkah("ide");
                    }}
                  >
                    Lewati ke ide &gt;&gt;
                  </button>
                  <button
                    type="button"
                    className="h-9 px-4 bg-primary text-primary-foreground text-xs font-mono uppercase font-semibold hover:bg-primary-hover transition-colors"
                    onClick={() => setLangkah("analisis")}
                  >
                    Lanjut ke analisis &gt;&gt;
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* ----------------------------- Tahap 2: analisis -------------------------- */}
      {langkah === "analisis" ? (
        <div className="space-y-6">
          <section className={cardClass}>
            <h2 className="text-base font-semibold">Analisis penawaran</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Hasil AI bersifat draft dan bisa dikoreksi sebelum lanjut (PRD 10.3).
            </p>

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={jalankanAnalisis}
                disabled={busy !== null || !draft.produk}
                className={primaryBtn}
              >
                {busy === "analisis" ? "Menganalisis…" : "Analisis penawaran"}
              </button>
              {busy === "analisis" ? (
                <button type="button" onClick={() => setBusy(null)} className={ghostBtn}>
                  Batalkan
                </button>
              ) : null}
            </div>

            {!draft.produk ? (
              <p className="mt-3 text-sm text-status-failed">
                Isi penawaran di tahap 1 dulu.
              </p>
            ) : null}
          </section>

          {draft.analisis ? (
            <section className={cardClass}>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Hasil analisis</h3>
                <span className="text-xs text-muted-foreground">
                  Confidence: {draft.analisis.confidence}
                </span>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6">
                {draft.analisis.ringkasan}
              </p>
              <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Fitur
                  </dt>
                  <dd className="mt-1 list-inside list-disc text-sm">
                    {draft.analisis.fitur.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Target audiens
                  </dt>
                  <dd className="mt-1 list-inside list-disc text-sm">
                    {draft.analisis.target_audiens.map((a) => (
                      <li key={a}>{a}</li>
                    ))}
                  </dd>
                </div>
              </dl>
              {draft.analisis.klaim_perlu_cek.length > 0 ? (
                <p className="mt-4 rounded-lg border border-status-failed/40 bg-status-failed/10 p-3 text-xs">
                  Klaim yang perlu dicek: {draft.analisis.klaim_perlu_cek.join("; ")}
                </p>
              ) : null}
            </section>
          ) : null}

          <section className={cardClass}>
            <label htmlFor="analisis-manual" className="mb-1 block text-sm font-medium">
              Ringkasan (bisa dikoreksi atau ditulis manual)
            </label>
            <textarea
              id="analisis-manual"
              rows={4}
              value={draft.analisisManual}
              onChange={(e) => update({ analisisManual: e.target.value })}
              placeholder="Tulis ringkasan produk sendiri jika AI tidak tersedia."
              className="w-full rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </section>

          <div className="flex flex-wrap items-center gap-3">
            <button type="button" onClick={() => setLangkah("produk")} className={ghostBtn}>
              Kembali
            </button>
            <button
              type="button"
              onClick={() => {
                if (!draft.analisisManual && draft.produk) {
                  update({
                    analisisManual:
                      draft.produk.deskripsi_bersih ||
                      draft.produk.deskripsi ||
                      draft.produk.nama_internal,
                  });
                }
                setError(null);
                setLangkah("ide");
              }}
              className={ghostBtn}
            >
              Lewati analisis &gt;&gt;
            </button>
            <button
              type="button"
              onClick={() => {
                if (!ringkasan.trim()) {
                  if (draft.produk?.deskripsi_bersih || draft.produk?.deskripsi) {
                    update({
                      analisisManual:
                        draft.produk.deskripsi_bersih || draft.produk.deskripsi,
                    });
                  } else {
                    setError("Isi ringkasan penawaran dulu sebelum lanjut ke ide.");
                    return;
                  }
                }
                setError(null);
                setLangkah("ide");
              }}
              className={primaryBtn}
            >
              Lanjut ke ide konten &gt;&gt;
            </button>
          </div>
        </div>
      ) : null}

      {/* ------------------------------- Tahap 3: ide ----------------------------- */}
      {langkah === "ide" ? (
        <div className="space-y-6">
          {bannerAturan}
          <section className={cardClass}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold">Ide konten</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  AI membuat 10 ide. Pilih satu atau beberapa (PRD F2).
                </p>
              </div>
              <button
                type="button"
                onClick={jalankanIde}
                disabled={busy !== null}
                className={primaryBtn}
              >
                {busy === "ide" ? "Membuat ide…" : "Buat 10 ide"}
              </button>
            </div>
          </section>

          {draft.ideList.length > 0 ? (
            <>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => update({ ideDipilih: draft.ideList.map((i) => i.judul) })}
                  className="text-sm underline-offset-2 hover:underline"
                >
                  Pilih semua
                </button>
                <button
                  type="button"
                  onClick={() => update({ ideDipilih: [] })}
                  className="text-sm underline-offset-2 hover:underline"
                >
                  Batalkan semua
                </button>
                <span className="ml-auto text-sm text-muted-foreground">
                  {draft.ideDipilih.length} dipilih
                </span>
              </div>

              <ul className="grid gap-3 sm:grid-cols-2">
                {draft.ideList.map((ide) => {
                  const dipilih = draft.ideDipilih.includes(ide.judul);
                  return (
                    <li key={ide.judul}>
                      <label
                        className={cn(
                          "flex h-full cursor-pointer flex-col rounded-xl border p-4 transition-colors",
                          dipilih
                            ? "border-primary bg-primary/5"
                            : "border-surface-border bg-surface hover:bg-muted/50",
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-sm font-semibold leading-5">{ide.judul}</span>
                          <input
                            type="checkbox"
                            checked={dipilih}
                            onChange={() => toggleIde(ide.judul)}
                            className="mt-1 h-4 w-4 accent-[var(--primary)]"
                          />
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">{ide.deskripsi}</p>
                        <p className="mt-2 text-xs">
                          <span className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground">
                            {ide.format_label}
                          </span>
                        </p>
                        <p className="mt-2 text-xs text-muted-foreground">
                          Jembatan: {ide.jembatan}
                        </p>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </>
          ) : (
            <EmptyState
              title="Belum ada ide"
              description="Tekan “Buat 10 ide” untuk menghasilkan ide dari hasil analisis. Kalau AI tidak tersedia atau sedang gagal, tulis idemu sendiri di kartu Ide manual di bawah — alur tetap bisa lanjut sampai tahap edit."
            />
          )}

          {/* Ide manual: PRD F1 — input manual tidak pernah dihapus, AI hanya pelengkap. */}
          <section className={cardClass}>
            <h2 className="text-base font-semibold">Ide manual</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Tanpa AI pun alur tetap berjalan: tulis idemu di sini, lanjut, lalu ketik
              statusnya sendiri di editor.
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto]">
              <input
                id="ide-manual-judul"
                type="text"
                value={judulManual}
                onChange={(e) => setJudulManual(e.target.value)}
                placeholder="Judul ide, mis. 5 alasan tas kanvas awet"
                className="w-full rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
              />
              <select
                id="ide-manual-format"
                value={formatManual}
                onChange={(e) =>
                  setFormatManual(e.target.value as (typeof FORMAT_LABELS)[number])
                }
                aria-label="Label format ide"
                className="rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
              >
                {FORMAT_LABELS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>
            <input
              id="ide-manual-deskripsi"
              type="text"
              value={deskripsiManual}
              onChange={(e) => setDeskripsiManual(e.target.value)}
              placeholder="Deskripsi singkat (opsional)"
              className="mt-3 w-full rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
            />
            <div className="mt-3">
              <button type="button" onClick={tambahIdeManual} className={ghostBtn}>
                Tambah ide
              </button>
            </div>
          </section>

          <div className="flex gap-3">
            <button type="button" onClick={() => setLangkah("analisis")} className={ghostBtn}>
              Kembali
            </button>
            <button
              type="button"
              onClick={() => {
                if (draft.ideDipilih.length === 0) {
                  setError("Pilih minimal satu ide.");
                  return;
                }
                setError(null);
                setLangkah("generate");
              }}
              className={primaryBtn}
            >
              Lanjut ke pengaturan
            </button>
          </div>
        </div>
      ) : null}

      {/* ----------------------------- Tahap 4: generate -------------------------- */}
      {langkah === "generate" ? (
        <div className="space-y-6">
          {bannerAturan}
          <PengaturanGenerate
            value={draft.pengaturan}
            onChange={(pengaturan) => update({ pengaturan })}
            disabled={busy !== null}
          />

          <section className={cardClass}>
            <p className="text-sm text-muted-foreground">
              Akan membuat <strong className="text-foreground">{draft.ideDipilih.length}</strong>{" "}
              konten (satu per ide terpilih). Semua hasil berstatus draft.
            </p>
            {draft.pengaturan.mode_output === "naskah_video" ? (
              <p className="mt-2 rounded-lg border border-surface-border p-3 text-xs text-muted-foreground">
                Mode naskah video: tiap konten berisi tiga bagian — hook visual
                (3 detik), fungsi produk, dan CTA — dengan durasi total 30 sampai
                60 detik.
              </p>
            ) : draft.pengaturan.mode_output === "carousel" ? (
              <p className="mt-2 rounded-lg border border-surface-border p-3 text-xs text-muted-foreground">
                Mode Carousel: tiap konten disusun menjadi slide visual (cover, isi, cta) dan caption.
                Hasil slide bisa langsung diunduh sebagai gambar PNG atau disalin teksnya ke Canva.
              </p>
            ) : null}
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={jalankanGenerate}
                disabled={busy !== null}
                className={primaryBtn}
              >
                {busy === "generate"
                  ? "Generate berjalan…"
                  : `Generate ${draft.ideDipilih.length} konten`}
              </button>
              <button type="button" onClick={() => setLangkah("ide")} className={ghostBtn}>
                Kembali
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {/* ------------------------------ Tahap 5: preview -------------------------- */}
      {langkah === "preview" ? (
        draft.konten.length === 0 ? (
          <div className="space-y-4">
            <EmptyState
              title="Belum ada konten"
              description="Generate konten di tahap 4. Untuk menulis manual, gunakan tombol di bawah."
            />
            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  if (draft.konten.length === 0 && draft.ideList.length > 0) {
                    update({
                      konten: draft.ideList
                        .filter((i) => draft.ideDipilih.includes(i.judul))
                        .map((ide) => ({ ide, statuses: [""] })),
                      kontenAktif: 0,
                    });
                  }
                  setLangkah("preview");
                }}
                className={primaryBtn}
              >
                Tulis status manual
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {bannerAturan}
            {/* Tab konten bila ada lebih dari satu */}
            {draft.konten.length > 1 ? (
              <div className="flex flex-wrap gap-2">
                {draft.konten.map((k, i) => (
                  <button
                    key={k.ide.judul}
                    type="button"
                    onClick={() => update({ kontenAktif: i })}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs transition-colors",
                      i === draft.kontenAktif
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-surface-border bg-surface hover:bg-muted",
                    )}
                  >
                    {i + 1}. {k.ide.judul}
                  </button>
                ))}
              </div>
            ) : null}

            {draft.pengaturan.mode_output === "carousel" ? (
              <CarouselSlideEditor
                slides={
                  kontenAktif?.carousel?.slides ?? [
                    {
                      urutan: 1,
                      peran: "cover",
                      kicker: "PILIHAN TERBAIK",
                      headline: kontenAktif?.ide.judul ?? "Review Produk",
                      isi: "",
                    },
                    {
                      urutan: 2,
                      peran: "isi",
                      kicker: null,
                      headline: "Keunggulan Utama",
                      isi: kontenAktif?.statuses[1] ?? "Penjelasan detail produk...",
                    },
                    {
                      urutan: 3,
                      peran: "cta",
                      kicker: null,
                      headline: "Cek Link Produk",
                      isi: "Tautan pembelian tersedia di bio atau komentar.",
                    },
                  ]
                }
                caption={kontenAktif?.carousel?.caption ?? kontenAktif?.statuses[0] ?? ""}
                hashtag={kontenAktif?.carousel?.hashtag ?? []}
                produkNama={draft.produk?.nama || draft.produk?.nama_internal || "Produk Pilihan"}
                fotoUrl={(draft.produk as PenawaranSaved)?.gambar_url || ""}
                handleAkun={draft.produk?.nama_internal || ""}
                onChangeSlides={(newSlides) => {
                  const nextCarousel: CarouselResponse = {
                    slides: newSlides,
                    caption: kontenAktif?.carousel?.caption ?? kontenAktif?.statuses[0] ?? "",
                    hashtag: kontenAktif?.carousel?.hashtag ?? [],
                    klaim_perlu_cek: kontenAktif?.carousel?.klaim_perlu_cek ?? [],
                  };
                  const newStatuses = [
                    nextCarousel.caption,
                    ...newSlides.map((s) => {
                      const head = s.headline || s.judul || "";
                      const bodyText = s.isi || "";
                      return s.kicker
                        ? `[${s.kicker}] ${head}\n${bodyText}`.trim()
                        : `${head}\n${bodyText}`.trim();
                    }),
                  ];
                  setKontenAktifCarousel(newStatuses, nextCarousel);
                }}
                onChangeCaption={(newCaption) => {
                  if (!kontenAktif) return;
                  const currentCarousel = kontenAktif.carousel ?? {
                    slides: [],
                    caption: "",
                    hashtag: [],
                    klaim_perlu_cek: [],
                  };
                  const nextCarousel: CarouselResponse = {
                    ...currentCarousel,
                    caption: newCaption,
                  };
                  const newStatuses = [newCaption, ...kontenAktif.statuses.slice(1)];
                  setKontenAktifCarousel(newStatuses, nextCarousel);
                }}
                onChangeHashtag={(newHashtag) => {
                  if (!kontenAktif) return;
                  const currentCarousel = kontenAktif.carousel ?? {
                    slides: [],
                    caption: "",
                    hashtag: [],
                    klaim_perlu_cek: [],
                  };
                  const nextCarousel: CarouselResponse = {
                    ...currentCarousel,
                    hashtag: newHashtag,
                  };
                  setKontenAktifCarousel(kontenAktif.statuses, nextCarousel);
                }}
              />
            ) : (
              <div className="grid gap-6 lg:grid-cols-5">
                <div className="space-y-6 lg:col-span-3">
                  <StatusEditor
                    statuses={kontenAktif?.statuses ?? []}
                    onChange={setKontenAktif}
                    batas={batasKarakter}
                  />
                  <ChecklistGate
                    nilai={draft.checklist}
                    onChange={(id, checked) =>
                      update({ checklist: { ...draft.checklist, [id]: checked } })
                    }
                    aturanKepercayaanAktif={draft.pengaturan.aturan_kepercayaan}
                  />
                </div>
                <div className="lg:col-span-2">
                  <ThreadsPreview
                    statuses={kontenAktif?.statuses ?? []}
                    linkProduk={draft.produk?.url_referensi || undefined}
                    letakLink={draft.pengaturan.letak_link}
                    batas={batasKarakter}
                  />
                  <p className="mt-3 text-xs text-muted-foreground">
                    Total{" "}
                    {kontenAktif?.statuses.reduce((sum, s) => sum + charLength(s), 0) ?? 0} karakter
                    di {kontenAktif?.statuses.length ?? 0} status.
                  </p>
                  <TombolSuaraNarasi statuses={kontenAktif?.statuses ?? []} />
                  <TombolRenderVideo
                    statuses={kontenAktif?.statuses ?? []}
                    produkNama={draft.produk?.nama || draft.produk?.nama_internal || "Produk Pilihan"}
                  />
                  <PanduanFotoCandid
                    produk={{
                      nama_internal: draft.produk?.nama_internal,
                      nama: draft.produk?.nama ?? null,
                      varian: draft.produk?.varian ?? null,
                      fitur: draft.analisis?.fitur ?? null,
                      target_audiens: draft.analisis?.target_audiens ?? null,
                    }}
                  />
                </div>
              </div>
            )}

            <ActionBar
              status={draft.status}
              semuaChecklist={semuaChecklist}
              semuaValid={semuaValid}
              tersimpanPukul={tersimpanPukul}
              busy={busy !== null}
              onSimpanDraft={simpanDraft}
              onTandaiSiap={tandaiSiap}
              onSalin={salinUtas}
            />
          </div>
        )
      ) : null}
    </div>
  );
}
