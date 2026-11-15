"use client";

/**
 * Panel riset audiens + peluang produk (tahap 1-2 Content Machine).
 *
 * Alur: niche + audiens → `POST /api/audience` (10 masalah, tersimpan) →
 * `POST /api/audience/peluang` (20 kategori, tersimpan). Keduanya dipisah
 * supaya riset tidak hilang saat tahap 2 gagal, dan supaya peluang bisa
 * disusun ulang tanpa membayar ulang riset.
 *
 * Semua keluaran AI berstatus draft: kategori baru menjadi produk setelah
 * user menekan "Buat produk", dan harga/tautan tetap diisi user.
 *
 * R6c: UI dipecah ke bagian-input-riset, bagian-review-pasar, bagian-peluang,
 * bagian-bank-riwayat. File ini menyimpan state & logika fetch saja.
 */
import { useCallback, useEffect, useState } from "react";
import {
  NICHE_AWAL,
  barisKePeluang,
  type Peluang,
  type Riset,
} from "@/lib/riset/skema";
import { daftarPeluang, daftarRiset, jadikanProduk } from "@/lib/riset/store";
import {
  muatBank,
  simpanBank,
  tambahKeBank,
  type ItemBank,
} from "@/lib/riset/bank-masalah";
import {
  muatRiwayat as muatRiwayatRiset,
  simpanRiwayat as simpanRiwayatRiset,
  tambahRiwayat,
  type RiwayatRiset,
} from "@/lib/riset/riwayat-pencarian";
import {
  KEY_BANDING,
  type SnapshotRiset,
} from "@/lib/riset/banding";
import { supabaseSiap } from "@/lib/supabase/klien";
import { BagianInputRiset } from "./bagian-input-riset";
import {
  BagianPelajaranPerforma,
  BagianReviewPasar,
} from "./bagian-review-pasar";
import {
  BagianBandingNiche,
  BagianHasilRiset,
  BagianPeluang,
} from "./bagian-peluang";
import { BagianBankMasalah, BagianRiwayatRiset } from "./bagian-bank-riwayat";

export function PanelRiset() {
  const siap = supabaseSiap();
  const [niche, setNiche] = useState(NICHE_AWAL);
  const [audiens, setAudiens] = useState("");
  const [riwayatRiset, setRiwayatRiset] = useState<RiwayatRiset[]>([]);
  // Fase 3-D: bank masalah yang menumpuk.
  const [bank, setBank] = useState<ItemBank[]>([]);
  const [riset, setRiset] = useState<Riset | null>(null);
  const [peluang, setPeluang] = useState<Peluang[]>([]);
  // Power-up banding niche: maks 2 snapshot peluang tersimpan lokal.
  const [snapshots, setSnapshots] = useState<SnapshotRiset[]>([]);
  const [riwayat, setRiwayat] = useState<Riset[]>([]);
  const [sibuk, setSibuk] = useState<"riset" | "peluang" | null>(null);
  const [galat, setGalat] = useState<{ pesan: string; perluMasuk: boolean } | null>(null);
  const [catatan, setCatatan] = useState<string | null>(null);
  const [produkDiproses, setProdukDiproses] = useState<string | null>(null);

  const muatRiwayat = useCallback(async () => {
    if (!siap) return;
    try {
      setRiwayat(await daftarRiset());
    } catch (e) {
      setGalat({ pesan: e instanceof Error ? e.message : "Riwayat riset gagal dimuat.", perluMasuk: false });
    }
  }, [siap]);

  // Muat awal dilakukan di dalam effect dengan penanda `aktif`, mengikuti
  // pola features/konten/riwayat-supabase.tsx: setState hanya terjadi setelah
  // await, bukan langsung di badan effect.
  useEffect(() => {
    if (!siap) return;
    let aktif = true;
    const jalan = async () => {
      try {
        const data = await daftarRiset();
        if (aktif) setRiwayat(data);
      } catch (e) {
        if (aktif) {
          setGalat({
            pesan: e instanceof Error ? e.message : "Riwayat riset gagal dimuat.",
            perluMasuk: false,
          });
        }
      }
    };
    void jalan();
    return () => {
      aktif = false;
    };
  }, [siap]);

  const susunPeluang = useCallback(async (risetId: string) => {
    setSibuk("peluang");
    try {
      const res = await fetch("/api/audience/peluang", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ risetId }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        peluang?: unknown[];
        error?: string;
      };
      if (!res.ok || !data.ok) {
        // 504 = Vercel memutus karena fungsi melewati batas waktu, bukan
        // salah input: AI biasanya masih memproses. Beri tahu agar user
        // menunggu & mencoba lagi, bukan mengganti niche berkali-kali.
        const pesan =
          res.status === 504
            ? "Penyusunan peluang melewati batas waktu server (504). AI kemungkinan masih selesai di latar; tunggu 1-2 menit lalu klik Susun peluang lagi. Niche & audiens Anda sudah tersimpan, jadi tidak perlu diisi ulang."
            : (data.error ?? `Peluang gagal disusun (HTTP ${res.status}).`);
        setGalat({ pesan, perluMasuk: res.status === 401 });
        return;
      }
      const baris = (data.peluang ?? [])
        .map(barisKePeluang)
        .filter((p): p is Peluang => p !== null);
      setPeluang(baris);
      setCatatan(
        baris.length > 0
          ? `${baris.length} kategori peluang tersimpan. Pilih satu untuk dijadikan produk.`
          : "Peluang tersimpan, tapi tidak ada baris yang bisa dibaca.",
      );
    } catch (e) {
      setGalat({ pesan: e instanceof Error ? e.message : "Peluang gagal disusun.", perluMasuk: false });
    } finally {
      setSibuk(null);
    }
  }, []);

  const jalankanRiset = useCallback(async () => {
    setGalat(null);
    setCatatan(null);
    setPeluang([]);
    setSibuk("riset");
    try {
      const res = await fetch("/api/audience", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ niche, audiens }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        riset?: Riset;
        error?: string;
      };
      if (!res.ok || !data.ok || !data.riset) {
        setGalat({
          pesan: data.error ?? `Riset gagal (HTTP ${res.status}).`,
          perluMasuk: res.status === 401,
        });
        return;
      }
      setRiset(data.riset);
      // Simpan niche+audiens supaya bisa dipilih ulang tanpa mengetik (Level 2).
      const riwayatBaru = tambahRiwayat(muatRiwayatRiset(), { niche, audiens });
      simpanRiwayatRiset(riwayatBaru);
      setRiwayatRiset(riwayatBaru);
      setCatatan("Riset tersimpan. Menyusun peluang produk…");
      await muatRiwayat();
      setSibuk(null);
      await susunPeluang(data.riset.id);
    } catch (e) {
      setGalat({ pesan: e instanceof Error ? e.message : "Riset gagal dijalankan.", perluMasuk: false });
    } finally {
      setSibuk(null);
    }
  }, [audiens, muatRiwayat, niche, susunPeluang]);

  const bukaRiset = useCallback(async (r: Riset) => {
    setGalat(null);
    setCatatan(null);
    setRiset(r);
    setNiche(r.niche);
    setAudiens(r.audiens);
    try {
      const baris = await daftarPeluang(r.id);
      setPeluang(baris);
      if (baris.length === 0) {
        setCatatan("Riset ini belum punya peluang. Tekan “Susun ulang peluang” untuk membuatnya.");
      }
    } catch (e) {
      setGalat({ pesan: e instanceof Error ? e.message : "Peluang gagal dimuat.", perluMasuk: false });
      setPeluang([]);
    }
  }, []);

  const buatProduk = useCallback(
    async (p: Peluang) => {
      if (!riset) return;
      setGalat(null);
      setProdukDiproses(p.id);
      try {
        const hasil = await jadikanProduk(riset, p);
        setPeluang((prev) =>
          prev.map((x) =>
            x.id === p.id ? { ...x, dipilih: true, produk_id: hasil.produkId } : x,
          ),
        );
        setCatatan(
          hasil.baru
            ? `Produk “${p.kategori}” dibuat. Lengkapi harga dan tautan di form produk.`
            : `Produk “${p.kategori}” sudah ada, jadi dipakai ulang.`,
        );
      } catch (e) {
        setGalat({ pesan: e instanceof Error ? e.message : "Produk gagal dibuat.", perluMasuk: false });
      } finally {
        setProdukDiproses(null);
      }
    },
    [riset],
  );

  // Muat snapshot banding saat mount (pola sama: setelah mount agar SSR aman).
  useEffect(() => {
    try {
      const mentah = window.localStorage.getItem(KEY_BANDING);
      if (mentah) {
        const parsed = JSON.parse(mentah) as SnapshotRiset[];
        if (Array.isArray(parsed))
          // eslint-disable-next-line react-hooks/set-state-in-effect -- hidrasi localStorage harus setelah mount agar sama dengan SSR
          setSnapshots(parsed.slice(0, 2));
      }
    } catch {
      // storage rusak: abaikan
    }
  }, []);

  // Muat bank saat mount; pola sama dengan draft (localStorage setelah mount).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrasi localStorage harus setelah mount agar tidak hydration mismatch
    setBank(muatBank());
    setRiwayatRiset(muatRiwayatRiset());
  }, []);

  const simpanKeBank = useCallback(
    (masalah: readonly string[], kategori: string, sumber: "riset" | "review") => {
      setBank((prev) => {
        const hasil = tambahKeBank(prev, masalah, kategori, sumber);
        simpanBank(hasil.bank);
        return hasil.bank;
      });
    },
    [],
  );

  return (
    <div className="space-y-6">
      {/* 1. Input riset */}
      <BagianInputRiset
        niche={niche}
        setNiche={setNiche}
        audiens={audiens}
        setAudiens={setAudiens}
        riwayatRiset={riwayatRiset}
        riset={riset}
        sibuk={sibuk}
        siap={siap}
        galat={galat}
        catatan={catatan}
        jalankanRiset={() => void jalankanRiset()}
        susunPeluang={(id) => void susunPeluang(id)}
      />

      {/* 1a. Rekomendasi dari performa (Fase 3-E): lingkaran riset tertutup */}
      <BagianPelajaranPerforma />

      {/* 1b. Review pasar (Fase 3-C): riset dari data pasar nyata */}
      <BagianReviewPasar niche={niche} audiens={audiens} simpanKeBank={simpanKeBank} />

      {/* 2. Hasil riset */}
      <BagianHasilRiset riset={riset} peluang={peluang} simpanKeBank={simpanKeBank} />

      {/* 2b. Banding niche (power-up Riset): simpan snapshot lalu bandingkan */}
      <BagianBandingNiche snapshots={snapshots} />

      {/* 3. Peluang produk */}
      <BagianPeluang
        riset={riset}
        peluang={peluang}
        niche={niche}
        snapshots={snapshots}
        setSnapshots={setSnapshots}
        buatProduk={(p) => void buatProduk(p)}
        produkDiproses={produkDiproses}
      />

      {/* 3b. Bank masalah (Fase 3-D): aset yang menumpuk */}
      <BagianBankMasalah bank={bank} />

      {/* 4. Riwayat */}
      <BagianRiwayatRiset riwayat={riwayat} risetAktif={riset} bukaRiset={(r) => void bukaRiset(r)} />
    </div>
  );
}
