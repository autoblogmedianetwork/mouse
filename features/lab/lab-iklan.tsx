"use client";

/**
 * Lab Iklan — menghitung balik modal, menulis iklan Meta, dan menyiapkan
 * landing page untuk menampung klik.
 *
 * Aturan bentuk (hasil critique 28 Nov):
 * - Judul mengikuti pola bagian Lab lain: kalimat biasa, tanpa emoji.
 * - Tidak ada istilah Inggris yang tidak perlu; pengguna afiliator pemula.
 * - Angka dihitung saat diketik, bukan setelah menekan tombol.
 * - Sudut siku dan warna memakai token (ADR 0013), bukan palet mentah.
 */
import { useMemo, useState } from "react";
import { Card } from "@/components/card";
import { cn } from "@/lib/utils";
import { inputClass, btnPrimary, btnGhost, TombolSalin, PesanGalat, panggilAI } from "./lab-bersama";
import { type IklanParams, estimateIklan } from "@/lib/advertising/iklan-calculator";

const rupiah = (nilai: number): string =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(nilai);

/* ------------------------------------------------------------------ kalkulator -- */

export function BagianKalkulator() {
  const [params, setParams] = useState<IklanParams>({ commission: 5, cpc: 2000, budget: 200000 });

  // Dihitung saat diketik. Kalau angkanya belum masuk akal, yang tampil adalah
  // alasannya — bukan angka lama yang sudah tidak berlaku.
  const hasil = useMemo(() => {
    try {
      return { ok: true as const, data: estimateIklan(params) };
    } catch (e) {
      return { ok: false as const, pesan: e instanceof Error ? e.message : "Angka belum valid." };
    }
  }, [params]);

  return (
    <Card>
      <h2 className="text-isi font-semibold">Kalkulator balik modal</h2>
      <p className="mt-1 text-badan text-muted-foreground">
        Perkiraan berapa penjualan yang dibutuhkan agar biaya iklan tertutup komisi. Angkanya
        berubah saat kamu mengetik.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <label className="block text-meta font-medium">
          Komisi per penjualan (%)
          <input
            type="number"
            min={0.1}
            max={100}
            step={0.1}
            value={params.commission}
            onChange={(e) => setParams((p) => ({ ...p, commission: Number(e.target.value) || 0 }))}
            className={cn(inputClass, "mt-1")}
          />
        </label>

        <label className="block text-meta font-medium">
          Biaya per klik (Rp)
          <input
            type="number"
            min={100}
            step={100}
            value={params.cpc}
            onChange={(e) => setParams((p) => ({ ...p, cpc: Number(e.target.value) || 0 }))}
            className={cn(inputClass, "mt-1")}
          />
        </label>

        <label className="block text-meta font-medium">
          Budget harian (Rp)
          <input
            type="number"
            min={1000}
            step={1000}
            value={params.budget}
            onChange={(e) => setParams((p) => ({ ...p, budget: Number(e.target.value) || 0 }))}
            className={cn(inputClass, "mt-1")}
          />
        </label>
      </div>

      {hasil.ok ? (
        <div className="mt-4 space-y-3 border-t border-surface-border pt-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="border border-surface-border p-3">
              <p className="text-meta uppercase tracking-badge text-muted-foreground">
                Penjualan dibutuhkan
              </p>
              <p className="mt-1 text-isi font-bold tabular-nums">{hasil.data.salesNeeded}</p>
              <p className="text-meta text-muted-foreground">per siklus budget</p>
            </div>
            <div className="border border-surface-border p-3">
              <p className="text-meta uppercase tracking-badge text-muted-foreground">
                Klik dibutuhkan
              </p>
              <p className="mt-1 text-isi font-bold tabular-nums">
                {hasil.data.clicksNeeded.toLocaleString("id-ID")}
              </p>
              <p className="text-meta text-muted-foreground">dengan asumsi tiap klik jadi</p>
            </div>
            <div className="border border-surface-border p-3">
              <p className="text-meta uppercase tracking-badge text-muted-foreground">
                Biaya per penjualan
              </p>
              <p className="mt-1 text-isi font-bold tabular-nums">
                {rupiah(Math.round(hasil.data.costPerSale))}
              </p>
              <p className="text-meta text-muted-foreground">harus di bawah untung per barang</p>
            </div>
          </div>

          <div className="border border-warning/40 bg-warning/10 p-3 text-meta">
            <p className="font-medium">Aturan Shopee Affiliate yang berlaku untuk iklan</p>
            <ul className="mt-1 list-disc space-y-1 pl-4">
              <li>Iklan berbayar hanya di media sosial (Facebook, Instagram, TikTok, Pinterest) dari akun yang terdaftar.</li>
              <li>Tidak boleh menyebut nama marketplace di kreatif, dan mereknya wajib jadi kata kunci negatif.</li>
              <li>Wajib bertanda #publi. Komisi bisa hangus kalau pesanan tidak bisa dilacak.</li>
            </ul>
          </div>
        </div>
      ) : (
        <p className="mt-3 text-badan text-status-failed" aria-live="polite">
          {hasil.pesan}
        </p>
      )}
    </Card>
  );
}

/* -------------------------------------------------------- generator iklan Meta -- */

export interface VarianIklan {
  judul: string;
  isi: string;
  cta: string;
}

function teksVarian(v: VarianIklan): string {
  return `${v.judul}\n\n${v.isi}\n\nTombol: ${v.cta}`;
}

export function GeneratorIklanMeta() {
  const [produk, setProduk] = useState("");
  const [harga, setHarga] = useState("");
  const [komisi, setKomisi] = useState("5");
  const [varian, setVarian] = useState<VarianIklan[]>([]);
  const [memuat, setMemuat] = useState(false);
  const [galat, setGalat] = useState("");
  const [tersalin, setTersalin] = useState("");

  const generate = async () => {
    const produkBersih = produk.trim();
    if (produkBersih.length < 3) {
      setGalat("Isi nama atau deskripsi produk minimal 3 karakter.");
      return;
    }
    setMemuat(true);
    setGalat("");
    const res = await panggilAI<{ varian: VarianIklan[] }>("/api/marketing/iklan-meta", {
      produk: produkBersih,
      harga: harga.trim() || undefined,
      komisiPersen: parseFloat(komisi) || 5,
    });
    setMemuat(false);
    if (!res.ok || !res.data?.varian) {
      setVarian([]);
      setGalat(res.error ?? "Iklan gagal dibuat.");
      return;
    }
    setVarian(res.data.varian);
  };

  const salinSemua = async () => {
    try {
      await navigator.clipboard.writeText(varian.map(teksVarian).join("\n\n---\n\n"));
      setTersalin("Ketiga varian tersalin.");
    } catch {
      setTersalin("Gagal menyalin. Salin satu per satu.");
    }
    setTimeout(() => setTersalin(""), 3000);
  };

  return (
    <Card>
      <h2 className="text-isi font-semibold">Pembuat iklan Meta</h2>
      <p className="mt-1 text-badan text-muted-foreground">
        Tiga varian iklan dalam suara Pak Slem: santai, tanpa clickbait, tanpa menyebut nama
        marketplace, dan bertanda #publi. Salin lalu tempel sendiri di Ads Manager — Heaviliate
        tidak mengirim iklan.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <label className="sm:col-span-2 block text-meta font-medium">
          Nama atau deskripsi produk
          <input
            value={produk}
            onChange={(e) => setProduk(e.target.value)}
            placeholder="Tumbler stainless 750 ml"
            className={cn(inputClass, "mt-1")}
          />
        </label>

        <label className="block text-meta font-medium">
          Harga jual (boleh dikosongkan)
          <input
            value={harga}
            onChange={(e) => setHarga(e.target.value)}
            placeholder="185000"
            className={cn(inputClass, "mt-1")}
          />
        </label>

        <label className="block text-meta font-medium">
          Komisi (%)
          <input
            type="number"
            min={1}
            max={100}
            value={komisi}
            onChange={(e) => setKomisi(e.target.value)}
            className={cn(inputClass, "mt-1")}
          />
        </label>
      </div>

      <button type="button" onClick={generate} disabled={memuat} className={cn(btnPrimary, "mt-4")}>
        {memuat ? "Menulis…" : "Buat 3 varian iklan"}
      </button>
      <PesanGalat pesan={galat} />

      {varian.length > 0 ? (
        <div className="mt-4 space-y-4 border-t border-surface-border pt-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-meta font-medium">Siap ditempel di Ads Manager:</p>
            <button type="button" onClick={() => void salinSemua()} className={btnGhost}>
              Salin semua varian
            </button>
          </div>
          {tersalin ? (
            <p className="text-meta text-muted-foreground" aria-live="polite">
              {tersalin}
            </p>
          ) : null}

          {varian.map((v, i) => (
            <div key={i} className="border border-surface-border p-4">
              <div className="flex items-center justify-between">
                <p className="text-isi font-semibold">Varian {i + 1}</p>
                <TombolSalin teks={teksVarian(v)} />
              </div>

              <div className="mt-3 space-y-2">
                <div>
                  <span className="text-meta uppercase tracking-badge text-muted-foreground">
                    Judul iklan
                  </span>
                  <p className="mt-1 text-badan">{v.judul}</p>
                </div>
                <div>
                  <span className="text-meta uppercase tracking-badge text-muted-foreground">
                    Isi iklan
                  </span>
                  <p className="mt-1 whitespace-pre-wrap text-badan">{v.isi}</p>
                </div>
                <div>
                  <span className="text-meta uppercase tracking-badge text-muted-foreground">
                    Teks tombol
                  </span>
                  <p className="mt-1 text-badan font-medium">{v.cta}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </Card>
  );
}

/* ------------------------------------------------------------ wizard landing -- */

interface DataLandingPage {
  slug: string;
  hero: string;
  judul: string;
  subjudul: string;
  cta: string;
  deskripsi: string;
  tautan: string;
}

/** Alamat halaman dibuat dari judul; pengguna tetap boleh mengubahnya. */
function buatSlug(teks: string): string {
  return teks
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function WizardLandingPage() {
  const [data, setData] = useState<DataLandingPage>({
    slug: "",
    hero: "",
    judul: "",
    subjudul: "",
    cta: "Cek produknya",
    deskripsi: "",
    tautan: "",
  });
  const [slugOtomatis, setSlugOtomatis] = useState(true);
  const [konfirmasiTimpa, setKonfirmasiTimpa] = useState(false);
  const [memuat, setMemuat] = useState(false);
  const [galat, setGalat] = useState("");
  const [hasilLanding, setHasilLanding] = useState<
    { slug: string; url: string; tersimpan: boolean; html: string } | null
  >(null);

  const ubahJudul = (judul: string) =>
    setData((d) => ({ ...d, judul, slug: slugOtomatis ? buatSlug(judul) : d.slug }));

  const buat = async (timpa: boolean) => {
    const slugBersih = buatSlug(data.slug);
    if (slugBersih.length < 2) {
      setGalat("Alamat halaman minimal 2 huruf. Isi judul dulu.");
      return;
    }
    setMemuat(true);
    setGalat("");
    const res = await panggilAI<
      | { success: true; url: string; tersimpan: boolean; html: string }
      | { sudah_ada: true; slug: string }
    >("/api/marketing/landing-page", { ...data, slug: slugBersih, timpa });
    setMemuat(false);

    if (!res.ok || !res.data) {
      setHasilLanding(null);
      setGalat(res.error ?? "Halaman gagal dibuat.");
      return;
    }
    if ("sudah_ada" in res.data) {
      setKonfirmasiTimpa(true);
      return;
    }
    setKonfirmasiTimpa(false);
    setHasilLanding({
      slug: slugBersih,
      url: res.data.url,
      tersimpan: res.data.tersimpan,
      html: res.data.html,
    });
  };

  const unduh = () => {
    if (!hasilLanding) return;
    const blob = new Blob([hasilLanding.html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${hasilLanding.slug}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <h2 className="text-isi font-semibold">Landing page untuk iklan</h2>
      <p className="mt-1 text-badan text-muted-foreground">
        Satu halaman sederhana untuk menampung klik iklan. Halamannya dibuat sebagai berkas HTML
        yang bisa kamu host sendiri — Heaviliate tidak menerbitkannya.
      </p>

      <div className="mt-4 grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <label className="block text-meta font-medium">
            Judul utama
            <input
              value={data.judul}
              onChange={(e) => ubahJudul(e.target.value)}
              placeholder="Pagi hari makin rapi dengan tumbler ini"
              className={cn(inputClass, "mt-1")}
            />
          </label>

          <label className="block text-meta font-medium">
            Kalimat pendukung
            <input
              value={data.subjudul}
              onChange={(e) => setData((d) => ({ ...d, subjudul: e.target.value }))}
              placeholder="Stainless 750 ml, tahan panas 12 jam"
              className={cn(inputClass, "mt-1")}
            />
          </label>

          <label className="block text-meta font-medium">
            Cerita singkat
            <textarea
              value={data.deskripsi}
              onChange={(e) => setData((d) => ({ ...d, deskripsi: e.target.value }))}
              rows={4}
              placeholder="Kenapa produk ini layak dibeli..."
              className={cn(inputClass, "mt-1 resize-y")}
            />
          </label>

          <label className="block text-meta font-medium">
            Tautan afiliasi (tujuan tombol)
            <input
              value={data.tautan}
              onChange={(e) => setData((d) => ({ ...d, tautan: e.target.value }))}
              placeholder="https://s.shopee.co.id/..."
              className={cn(inputClass, "mt-1")}
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-meta font-medium">
              Teks tombol
              <input
                value={data.cta}
                onChange={(e) => setData((d) => ({ ...d, cta: e.target.value }))}
                placeholder="Cek produknya"
                className={cn(inputClass, "mt-1")}
              />
            </label>

            <label className="block text-meta font-medium">
              Alamat halaman
              <input
                value={data.slug}
                onChange={(e) => {
                  setSlugOtomatis(false);
                  setData((d) => ({ ...d, slug: e.target.value }));
                }}
                placeholder="tumbler-stroberi"
                className={cn(inputClass, "mt-1")}
              />
            </label>
          </div>

          <p className="text-meta text-muted-foreground">
            Gambar produk tidak diminta di sini — taruh gambarnya di hosting sendiri, lalu isi
            alamatnya kalau perlu.
          </p>

          {konfirmasiTimpa ? (
            <div className="border border-warning/40 bg-warning/10 p-3 text-meta">
              <p className="font-medium">
                Halaman dengan alamat “{buatSlug(data.slug)}” sudah ada.
              </p>
              <p className="mt-1">
                Menimpanya akan mengganti berkas lama. Iklan yang sudah memakai alamat itu akan
                menampilkan isi baru.
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void buat(true)}
                  disabled={memuat}
                  className={btnPrimary}
                >
                  {memuat ? "Menimpa…" : "Timpa halaman lama"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setKonfirmasiTimpa(false);
                    setSlugOtomatis(false);
                    setData((d) => ({ ...d, slug: `${buatSlug(d.slug)}-2` }));
                  }}
                  className={btnGhost}
                >
                  Pakai alamat lain
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => void buat(false)}
              disabled={memuat}
              className={btnPrimary}
            >
              {memuat ? "Membuat…" : "Buat halaman"}
            </button>
          )}
          <PesanGalat pesan={galat} />
          <p className="text-meta text-muted-foreground">
            Di hosting yang read-only (mis. Vercel) berkas tidak bisa ditulis; tombol unduh muncul
            sebagai gantinya.
          </p>
        </div>

        <div className="border border-surface-border bg-muted p-4">
          <p className="mb-2 text-meta uppercase tracking-badge text-muted-foreground">
            Tampilan halamannya
          </p>
          <article className="space-y-3">
            <div className="aspect-video w-full bg-muted-foreground/20" />
            <h3 className="text-isi font-bold">{data.judul || "Judul belum diisi"}</h3>
            <p className="text-meta text-muted-foreground">{data.subjudul}</p>
            <p className="whitespace-pre-wrap text-badan">{data.deskripsi}</p>
            <span className={cn(btnPrimary, "pointer-events-none")}>{data.cta}</span>
            <p className="text-meta text-muted-foreground">#publi</p>
          </article>
        </div>
      </div>

      {hasilLanding ? (
        <div className="mt-4 border border-status-ready/40 bg-status-ready/5 p-3 text-meta">
          {hasilLanding.tersimpan ? (
            <>
              Halaman dibuat di <code className="font-mono">/{hasilLanding.slug}</code> — pakai
              alamat ini sebagai tujuan iklan atau masukkan ke link bio.
            </>
          ) : (
            <div className="space-y-2">
              <p>
                Halaman dibuat, tapi server ini read-only sehingga berkas tidak bisa ditulis.
                Unduh HTML-nya lalu host sendiri.
              </p>
              <button type="button" onClick={unduh} className={btnPrimary}>
                Unduh {hasilLanding.slug}.html
              </button>
            </div>
          )}
        </div>
      ) : null}
    </Card>
  );
}

/* ------------------------------------------------------------------ orkestrator -- */

export function BagianLabIklan() {
  return (
    <div className="space-y-6">
      <p className="text-meta text-muted-foreground">
        Beriklan berbayar: hitung dulu apakah komisi menutup biaya klik, tulis iklannya, baru
        siapkan halaman tujuan. Semua langkah berhenti di bahan yang kamu kirim sendiri.
      </p>
      <BagianKalkulator />
      <GeneratorIklanMeta />
      <WizardLandingPage />
    </div>
  );
}
