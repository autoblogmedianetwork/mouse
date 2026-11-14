"use client";

/**
 * Hook draft alur Buat posting (refactor R3).
 * Memuat seluruh state dan logika (hydrasi, autosave, panggilan AI,
 * sinkron bank konten, tandai siap, salin) yang sebelumnya hidup di
 * alur-buat-posting.tsx. Komponen tahap hanya menerima nilai via props.
 * Logika dipindah utuh — tidak ada perilaku baru.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Analisis, Ide, CarouselResponse } from "@/lib/ai/schemas";
import { decodePrefill } from "@/lib/impor/prefill";
import { type PenawaranSaved } from "./form-penawaran";
import { salinKeClipboard, teksUtasLengkap } from "@/lib/konten/salin";
import { validateStatusList } from "@/lib/statuses/validator-500";
import { batasKarakterMode } from "@/lib/platforms/batas";
import { muatKonten, simpanKonten, upsertKonten } from "@/lib/konten/store";
import {
  muatDraftServer,
  pilihTerbaru,
  simpanDraftServer,
} from "@/lib/supabase/draft-sync";
import { kontenSkema, type Konten } from "@/lib/konten/skema";
import { catatRiwayat } from "@/lib/konten/riwayat";
import { useLocalState } from "@/lib/konten/use-local-state";
import { terapkanDisclosureUtas } from "@/lib/konten/disclosure";
import { cariAturanBerdasarkanUrl, type ProgramAffiliate } from "@/lib/program-affiliate/skema";
import {
  DRAFT_AWAL,
  DRAFT_KEY,
  loadDraft,
  postJson,
  type DraftState,
  type KontenKerja,
  type Langkah,
} from "./draft-posting";

export function useDraftPosting() {
  const [draft, setDraft] = useState<DraftState>(DRAFT_AWAL);
  const [langkah, setLangkah] = useState<Langkah>("produk");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  /** Last error was a 401, so the banner must offer /masuk. */
  const [errorSesi, setErrorSesi] = useState(false);
  const [tersimpanPukul, setTersimpanPukul] = useState<string | null>(null);
  const [pesan, setPesan] = useState<string | null>(null);
  const [programs] = useLocalState<ProgramAffiliate[]>("autothreads-link-programs", []);

  const catatanAturan = useMemo(() => {
    const dariProduk = (draft.produk as PenawaranSaved)?.catatan_aturan?.trim();
    if (dariProduk) return dariProduk;
    return cariAturanBerdasarkanUrl(programs, draft.produk?.url_referensi);
  }, [draft.produk, programs]);

  const dirtyRef = useRef(false);
  const loadedRef = useRef(false);

  const update = useCallback((patch: Partial<DraftState>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
    dirtyRef.current = true;
  }, []);

  /**
   * Sinkronkan konten kerja ke Pustaka (bank konten). Returns the updated
   * working list so callers can persist the new bankIds into the draft.
   */
  const sinkronKeBank = useCallback(
    (daftar: KontenKerja[], statusBank: Konten["status"]): KontenKerja[] => {
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
          // Urutan isi ikut tercatat, supaya performa bisa dibandingkan per kerangka.
          kerangka: draft.pengaturan.kerangka,
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
    },
    [draft.produk, draft.checklist, draft.pengaturan],
  );

  /** Hydrasi draft (lokal + Supabase) dan Quick Capture prefill. */

  /** Hydrasi draft (lokal + Supabase) dan Quick Capture prefill. */
  const siapkanDraft = useCallback(
    (prefill: NonNullable<ReturnType<typeof decodePrefill>> | null) => {
      const d = loadDraft();
      // Hydrasi draft dari localStorage setelah mount (dipanggil dari useEffect di komponen).
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
      // Fase 2-C: tarik draft dari Supabase bila lebih baru dari lokal, supaya
      // draft ikut pindah browser/perangkat. Kalau user sudah mulai mengetik
      // (dirtyRef), hasil server diabaikan supaya edit tidak tertimpa.
      void muatDraftServer().then((server) => {
        if (!server || dirtyRef.current) return;
        const serverDraft = server as unknown as DraftState;
        const hasil = pilihTerbaru(d, serverDraft);
        if (hasil.sumber !== "server" || !hasil.data) return;
        setDraft(hasil.data);
        if (hasil.data.konten.length > 0) {
          setLangkah("preview");
        } else if (hasil.data.produk) {
          setLangkah("analisis");
        }
        if (hasil.data.updatedAt) {
          setTersimpanPukul(
            new Date(hasil.data.updatedAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
          );
        }
      });
    },
    [],
  );

  const simpanDraft = useCallback(() => {
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
      setPesan("Draft tersimpan di browser dan masuk daftar Konten.");
    } catch {
      setPesan("Gagal menyimpan ke localStorage.");
    }
  }, [draft, sinkronKeBank]);

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
        // Fase 2-C: dorong ke Supabase tanpa menunggu (fire-and-forget).
        // Gagal = diam saja; localStorage tetap sumber kebenaran.
        void simpanDraftServer(toSave);
      } catch {
        // storage penuh/di-block: abaikan, draft tetap di memori
      }
    }, 10_000);
    return () => clearInterval(timer);
  }, [draft]);

  const ringkasan = useMemo(() => {
    if (draft.analisis?.ringkasan) return draft.analisis.ringkasan;
    if (draft.analisisManual) return draft.analisisManual;
    return draft.produk?.deskripsi_bersih || draft.produk?.deskripsi || "";
  }, [draft.analisis, draft.analisisManual, draft.produk]);

  /** Fitur untuk prompt AI: hasil analisis dulu, baru fitur penawaran manual. */
  const fiturUntukPrompt = useCallback(
    (analisis: Analisis | null): string[] => {
      if (analisis?.fitur && analisis.fitur.length > 0) return analisis.fitur;
      const p = draft.produk as PenawaranSaved | undefined;
      if (p?.fitur_keunggulan) {
        return p.fitur_keunggulan
          .split(/[\n;]+/)
          .map((s) => s.trim())
          .filter(Boolean);
      }
      return [];
    },
    [draft.produk],
  );

  /* ----------------------------- Tahap: analisis ----------------------------- */

  const jalankanAnalisis = useCallback(async () => {
    if (!draft.produk) return;
    setBusy("analisis");
    setError(null);
    setErrorSesi(false);
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
      setErrorSesi(result.status === 401);
    }
  }, [draft.produk, update]);

  /* ------------------------------- Tahap: ide -------------------------------- */

  const jalankanIde = useCallback(async () => {
    if (!ringkasan) {
      setError("Isi ringkasan dulu (hasil analisis atau tulis manual).");
      return;
    }
    setBusy("ide");
    setError(null);
    setErrorSesi(false);
    const fiturList = fiturUntukPrompt(draft.analisis);

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
      setErrorSesi(result.status === 401);
    }
  }, [draft.analisis, draft.produk, fiturUntukPrompt, ringkasan, update]);

  const toggleIde = useCallback(
    (judul: string) => {
      const dipilih = draft.ideDipilih.includes(judul)
        ? draft.ideDipilih.filter((j) => j !== judul)
        : [...draft.ideDipilih, judul];
      update({ ideDipilih: dipilih });
    },
    [draft.ideDipilih, update],
  );

  /* ------------------------------ Tahap: generate ----------------------------- */

  const jalankanGenerateDengan = useCallback(
    async (terpilih: Ide[], ringkasanAktif: string) => {
      setBusy("generate");
      setError(null);
      setErrorSesi(false);
      setPesan(null);

      const kontenBaru: Array<KontenKerja> = [];
      const gagal: string[] = [];
      // Mode naskah video (prompt 09) dan carousel (prompt 08) memakai rute sendiri.
      const naskahVideo = draft.pengaturan.mode_output === "naskah_video";
      const carouselMode = draft.pengaturan.mode_output === "carousel";

      // Satu job per ide terpilih; satu gagal tidak menghentikan yang lain (PRD 15.1).
      for (const ide of terpilih) {
        const fiturList = fiturUntukPrompt(draft.analisis);

        const body = {
          namaProduk: draft.produk?.nama_internal ?? "Penawaran",
          ringkasan: ringkasanAktif,
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
    },
    [draft.analisis, draft.pengaturan, draft.produk, fiturUntukPrompt, update],
  );

  const jalankanGenerate = useCallback(async () => {
    const terpilih = draft.ideList.filter((i) => draft.ideDipilih.includes(i.judul));
    if (terpilih.length === 0) {
      setError("Pilih minimal satu ide dulu.");
      return;
    }
    await jalankanGenerateDengan(terpilih, ringkasan);
  }, [draft.ideList, draft.ideDipilih, jalankanGenerateDengan, ringkasan]);

  /* --------------------------- R7-A: Buat Semuanya ---------------------------- */

  /**
   * Rantai analisis -> ide -> generate dalam satu tunggu. Tiap tahap disimpan
   * ke draft sebelum lanjut, jadi kalau tahap berikutnya gagal, hasil tahap
   * sebelumnya tidak hilang dan user bisa lanjut manual dari situ.
   */
  const jalankanSemuanya = useCallback(async () => {
    if (!draft.produk) return;
    setError(null);
    setErrorSesi(false);
    setPesan(null);

    // 1) Analisis penawaran
    setBusy("analisis");
    const hasilAnalisis = await postJson<Analisis>("/api/analisis", {
      deskripsi: draft.produk.deskripsi_bersih || draft.produk.deskripsi,
      nama: draft.produk.nama || draft.produk.nama_internal,
      varian: draft.produk.varian,
      harga: draft.produk.harga,
      kategori: (draft.produk as PenawaranSaved)?.kategori_penawaran,
    });
    if (!hasilAnalisis.ok || !hasilAnalisis.data) {
      setBusy(null);
      setError(hasilAnalisis.error ?? "Analisis gagal. Coba langkah per langkah.");
      setErrorSesi(hasilAnalisis.status === 401);
      return;
    }
    const analisis = hasilAnalisis.data;
    update({ analisis, analisisManual: analisis.ringkasan });
    setLangkah("analisis");

    // 2) Ide konten
    setBusy("ide");
    const hasilIde = await postJson<{ ide: Ide[] }>("/api/ide", {
      namaProduk: draft.produk.nama_internal ?? "Penawaran",
      ringkasan: analisis.ringkasan,
      fitur: fiturUntukPrompt(analisis),
      target_audiens: analisis.target_audiens ?? [],
      angle: analisis.angle ?? [],
    });
    if (!hasilIde.ok || !hasilIde.data) {
      setBusy(null);
      setPesan("Analisis selesai dan tersimpan di draft.");
      setError("Analisis berhasil, tapi ide gagal dibuat. Tekan 'Ide konten' untuk coba lagi, atau tulis ide manual.");
      setErrorSesi(hasilIde.status === 401);
      return;
    }
    const ideList = hasilIde.data.ide;
    const ideDipilih = ideList.slice(0, 1).map((i) => i.judul);
    update({ ideList, ideDipilih });
    setLangkah("ide");

    // 3) Generate konten (langsung dengan nilai lokal, tanpa menunggu state)
    const terpilih = ideList.filter((i) => ideDipilih.includes(i.judul));
    await jalankanGenerateDengan(terpilih, analisis.ringkasan);
  }, [draft.produk, fiturUntukPrompt, jalankanGenerateDengan, update]);

  /* ------------------------------ Tahap: preview ------------------------------ */

  const kontenAktif = draft.konten[draft.kontenAktif] ?? null;

  const setKontenAktif = useCallback(
    (statuses: string[]) => {
      const konten = [...draft.konten];
      konten[draft.kontenAktif] = { ...konten[draft.kontenAktif], statuses };
      // Edit setelah "siap posting" membuat konten kembali draft (F0).
      update({ konten, status: draft.status === "siap_posting" ? "draft" : draft.status });
    },
    [draft.konten, draft.kontenAktif, draft.status, update],
  );

  const setKontenAktifCarousel = useCallback(
    (statuses: string[], carousel: CarouselResponse) => {
      const konten = [...draft.konten];
      konten[draft.kontenAktif] = { ...konten[draft.kontenAktif], statuses, carousel };
      update({ konten, status: draft.status === "siap_posting" ? "draft" : draft.status });
    },
    [draft.konten, draft.kontenAktif, draft.status, update],
  );

  // Batas karakter mengikuti mode output: 500 Threads, 280 X, 700 WhatsApp
  // Status, 2200 Caption TikTok; naskah video dan carousel tetap 500
  // (plafon database 2200, ADR 0020).
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

  const tandaiSiap = useCallback(() => {
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
  }, [draft.konten, draft.kontenAktif, semuaChecklist, semuaValid, sinkronKeBank]);

  const salinUtas = useCallback(async () => {
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
  }, [draft.pengaturan.mode_output, draft.status, kontenAktif]);

  return {
    // state
    draft,
    langkah,
    setLangkah,
    busy,
    setBusy,
    error,
    setError,
    errorSesi,
    pesan,
    setPesan,
    tersimpanPukul,
    update,
    simpanDraft,
    ringkasan,
    catatanAturan,
    // hydrasi & prefill
    siapkanDraft,
    // handler AI
    jalankanAnalisis,
    jalankanIde,
    toggleIde,
    jalankanGenerate,
    jalankanSemuanya,
    // preview
    kontenAktif,
    setKontenAktif,
    setKontenAktifCarousel,
    batasKarakter,
    semuaValid,
    semuaChecklist,
    tandaiSiap,
    salinUtas,
  };
}
