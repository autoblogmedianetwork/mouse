"use client";

import { useState } from "react";
import { FormProdukManual, type SavedProduct } from "./form-produk-manual";
import {
  KATEGORI_PENAWARAN,
  LABEL_KATEGORI_PENAWARAN,
  LABEL_SUMBER_PENAWARAN,
  SUMBER_PENAWARAN,
  penawaranLinkSkema,
  penawaranManualSkema,
  type KategoriPenawaran,
  type SumberPenawaran,
} from "@/lib/penawaran/skema";
import { cn } from "@/lib/utils";

const inputClass =
  "w-full rounded-none border border-surface-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary font-mono text-xs";
const labelClass = "mb-1 block text-xs font-mono uppercase tracking-wider text-muted-foreground";
const errorClass = "mt-1 text-xs text-status-failed font-mono";

export interface PenawaranSaved extends SavedProduct {
  sumber_penawaran?: SumberPenawaran;
  kategori_penawaran?: KategoriPenawaran;
  fitur_keunggulan?: string;
  gambar_url?: string;
  catatan_aturan?: string;
}

export function FormPenawaran({
  onSaved,
  nilaiAwal,
}: {
  onSaved?: (penawaran: PenawaranSaved) => void;
  nilaiAwal?: Partial<SavedProduct>;
}) {
  const [sumber, setSumber] = useState<SumberPenawaran>("marketplace");

  // State Form Manual
  const [manualForm, setManualForm] = useState({
    nama: "",
    link_affiliate: "",
    harga: "",
    fitur: "",
    catatan_aturan: "",
    kategori: "hosting" as KategoriPenawaran,
    gambar: "",
  });
  const [manualError, setManualError] = useState<Record<string, string>>({});

  // State Form Dari Link
  const [linkInputUrl, setLinkInputUrl] = useState("");
  const [loadingAmbil, setLoadingAmbil] = useState(false);
  const [pesanLink, setPesanLink] = useState<{ tipe: "sukses" | "error"; teks: string } | null>(null);
  const [linkForm, setLinkForm] = useState({
    nama: "",
    link_affiliate: "",
    harga: "",
    deskripsi: "",
    catatan_aturan: "",
    kategori: "saas" as KategoriPenawaran,
    gambar: "",
  });
  const [linkError, setLinkError] = useState<Record<string, string>>({});

  // Handle Simpan Manual
  const handleSimpanManual = (e: React.FormEvent) => {
    e.preventDefault();
    setManualError({});

    const parsed = penawaranManualSkema.safeParse(manualForm);
    if (!parsed.success) {
      const errMap: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as string;
        errMap[key] = issue.message;
      }
      setManualError(errMap);
      return;
    }

    const { nama, link_affiliate, harga, fitur, kategori, gambar } = parsed.data;
    const penawaran: PenawaranSaved = {
      id: crypto.randomUUID(),
      nama_internal: nama,
      nama,
      varian: "",
      harga: harga || undefined,
      deskripsi: fitur || nama,
      deskripsi_bersih: fitur || nama,
      url_referensi: link_affiliate,
      saved_at: new Date().toISOString(),
      sumber_penawaran: "manual",
      kategori_penawaran: kategori,
      fitur_keunggulan: fitur,
      gambar_url: gambar || undefined,
      catatan_aturan: manualForm.catatan_aturan.trim() || undefined,
    };

    onSaved?.(penawaran);
  };

  // Handle Ambil Meta Dari Link
  const handleAmbilDariLink = async () => {
    if (!linkInputUrl.trim() || !/^https?:\/\//i.test(linkInputUrl.trim())) {
      setPesanLink({
        tipe: "error",
        teks: "Masukkan URL halaman yang valid (diawali http:// atau https://).",
      });
      return;
    }

    setLoadingAmbil(true);
    setPesanLink(null);

    try {
      const res = await fetch("/api/penawaran/ambil-meta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: linkInputUrl.trim() }),
      });
      const json = await res.json();

      if (json.ok && json.data) {
        setLinkForm((prev) => ({
          ...prev,
          nama: json.data.title || prev.nama,
          deskripsi: json.data.description || prev.deskripsi,
          gambar: json.data.image || prev.gambar,
          link_affiliate: prev.link_affiliate || linkInputUrl.trim(),
        }));
        setPesanLink({
          tipe: "sukses",
          teks: "Data judul dan deskripsi berhasil diekstrak. Silakan periksa atau lengkapi data di bawah.",
        });
      } else {
        setPesanLink({
          tipe: "error",
          teks: json.error || "Gagal mengambil metadata. Silakan isi form di bawah secara manual.",
        });
      }
    } catch {
      setPesanLink({
        tipe: "error",
        teks: "Gagal menghubungi server ekstraksi. Silakan isi form secara manual.",
      });
    } finally {
      setLoadingAmbil(false);
    }
  };

  // Handle Simpan Dari Link
  const handleSimpanLink = (e: React.FormEvent) => {
    e.preventDefault();
    setLinkError({});

    const parsed = penawaranLinkSkema.safeParse({
      url_halaman: linkInputUrl || linkForm.link_affiliate,
      nama: linkForm.nama,
      deskripsi: linkForm.deskripsi,
      link_affiliate: linkForm.link_affiliate,
      harga: linkForm.harga,
      kategori: linkForm.kategori,
      gambar: linkForm.gambar,
    });

    if (!parsed.success) {
      const errMap: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as string;
        errMap[key] = issue.message;
      }
      setLinkError(errMap);
      return;
    }

    const { nama, link_affiliate, harga, deskripsi, kategori, gambar } = parsed.data;
    const penawaran: PenawaranSaved = {
      id: crypto.randomUUID(),
      nama_internal: nama,
      nama,
      varian: "",
      harga: harga || undefined,
      deskripsi: deskripsi || nama,
      deskripsi_bersih: deskripsi || nama,
      url_referensi: link_affiliate,
      saved_at: new Date().toISOString(),
      sumber_penawaran: "link",
      kategori_penawaran: kategori,
      fitur_keunggulan: deskripsi,
      gambar_url: gambar || undefined,
      catatan_aturan: linkForm.catatan_aturan.trim() || undefined,
    };

    onSaved?.(penawaran);
  };

  return (
    <div className="space-y-6">
      {/* Tab Sumber Penawaran */}
      <section className="border border-surface-border bg-surface p-4 sm:p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider font-mono">
              [ 1. SUMBER PENAWARAN ]
            </h2>
            <p className="mt-1 text-xs text-muted-foreground font-mono">
              Pilih tipe penawaran: Marketplace (Shopee), Manual (Hosting/SaaS), atau Dari Link.
            </p>
          </div>
          <div className="flex border border-surface-border bg-muted/40 p-0.5">
            {SUMBER_PENAWARAN.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSumber(s)}
                className={cn(
                  "px-3 py-1.5 text-xs font-mono font-medium transition-colors",
                  sumber === s
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {LABEL_SUMBER_PENAWARAN[s]}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Mode 1: Marketplace */}
      {sumber === "marketplace" && (
        <FormProdukManual
          onSaved={(prod) =>
            onSaved?.({
              ...prod,
              sumber_penawaran: "marketplace",
              kategori_penawaran: "marketplace",
            })
          }
          nilaiAwal={nilaiAwal}
        />
      )}

      {/* Mode 2: Manual (Hosting, SaaS, Kursus, dll) */}
      {sumber === "manual" && (
        <form onSubmit={handleSimpanManual} className="space-y-6" noValidate>
          <section className="border border-surface-border bg-surface p-4 sm:p-6 space-y-4">
            <div>
              <h3 className="text-sm font-semibold font-mono uppercase tracking-wider">
                [ PENAWARAN MANUAL (HOSTING / SAAS / KURSUS) ]
              </h3>
              <p className="mt-0.5 text-xs text-muted-foreground font-mono">
                Isi informasi penawaran affiliate non-marketplace Anda di sini.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className={labelClass}>
                  Nama Penawaran / Program <span className="text-status-failed">*</span>
                </label>
                <input
                  type="text"
                  value={manualForm.nama}
                  onChange={(e) => setManualForm({ ...manualForm, nama: e.target.value })}
                  placeholder="Contoh: Hostinger Web Hosting Premium"
                  className={inputClass}
                />
                {manualError.nama && <p className={errorClass}>{manualError.nama}</p>}
              </div>

              <div>
                <label className={labelClass}>
                  Kategori <span className="text-status-failed">*</span>
                </label>
                <select
                  value={manualForm.kategori}
                  onChange={(e) =>
                    setManualForm({ ...manualForm, kategori: e.target.value as KategoriPenawaran })
                  }
                  className={inputClass}
                >
                  {KATEGORI_PENAWARAN.map((kat) => (
                    <option key={kat} value={kat}>
                      {LABEL_KATEGORI_PENAWARAN[kat]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>Harga / Biaya (Opsional)</label>
                <input
                  type="text"
                  value={manualForm.harga}
                  onChange={(e) => setManualForm({ ...manualForm, harga: e.target.value })}
                  placeholder="Contoh: Mulai Rp 24.900/bln atau $2.99"
                  className={inputClass}
                />
              </div>

              <div className="sm:col-span-2">
                <label className={labelClass}>
                  Link Affiliate <span className="text-status-failed">*</span>
                </label>
                <input
                  type="url"
                  value={manualForm.link_affiliate}
                  onChange={(e) => setManualForm({ ...manualForm, link_affiliate: e.target.value })}
                  placeholder="https://hostinger.com?aff=123"
                  className={inputClass}
                />
                {manualError.link_affiliate && (
                  <p className={errorClass}>{manualError.link_affiliate}</p>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className={labelClass}>Fitur Utama / Keunggulan</label>
                <textarea
                  rows={4}
                  value={manualForm.fitur}
                  onChange={(e) => setManualForm({ ...manualForm, fitur: e.target.value })}
                  placeholder="Tuliskan keunggulan utama (misal: Gratis domain 1 tahun, garansi 30 hari uang kembali, uptime 99.9%, diskon 75% pakai kode promo)."
                  className={inputClass}
                />
              </div>

              <div className="sm:col-span-2">
                <label className={labelClass}>Catatan Aturan Program (Opsional)</label>
                <textarea
                  rows={2}
                  value={manualForm.catatan_aturan}
                  onChange={(e) =>
                    setManualForm({ ...manualForm, catatan_aturan: e.target.value })
                  }
                  placeholder="misal: Dilarang sebut nama brand di headline; wajib cantumkan kupon diskon 20%."
                  className={inputClass}
                />
                <p className="mt-1 text-[11px] text-muted-foreground font-mono">
                  Aturan ini akan muncul sebagai banner pengingat saat Anda menyusun ide dan konten posting.
                </p>
              </div>

              <div className="sm:col-span-2">
                <label className={labelClass}>URL Gambar / Logo (Opsional)</label>
                <input
                  type="url"
                  value={manualForm.gambar}
                  onChange={(e) => setManualForm({ ...manualForm, gambar: e.target.value })}
                  placeholder="https://.../logo.png (boleh dikosongkan)"
                  className={inputClass}
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="h-9 px-5 bg-primary text-primary-foreground font-mono text-xs uppercase font-medium hover:bg-primary-hover transition-colors"
              >
                Simpan Penawaran &gt;&gt;
              </button>
            </div>
          </section>
        </form>
      )}

      {/* Mode 3: Dari Link */}
      {sumber === "link" && (
        <div className="space-y-6">
          <section className="border border-surface-border bg-surface p-4 sm:p-6 space-y-4">
            <div>
              <h3 className="text-sm font-semibold font-mono uppercase tracking-wider">
                [ EKSTRAKSI DATA DARI LINK ]
              </h3>
              <p className="mt-0.5 text-xs text-muted-foreground font-mono">
                Tempelkan tautan halaman web produk untuk mengambil judul dan deskripsi OpenGraph secara otomatis.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="url"
                value={linkInputUrl}
                onChange={(e) => setLinkInputUrl(e.target.value)}
                placeholder="https://hostinger.co.id/web-hosting"
                className={cn(inputClass, "flex-1")}
              />
              <button
                type="button"
                onClick={handleAmbilDariLink}
                disabled={loadingAmbil}
                className="h-9 px-4 bg-muted border border-surface-border font-mono text-xs uppercase font-medium hover:bg-muted/80 disabled:opacity-50"
              >
                {loadingAmbil ? "Mengambil…" : "Ambil Data Link"}
              </button>
            </div>

            {pesanLink && (
              <div
                className={cn(
                  "p-3 border text-xs font-mono",
                  pesanLink.tipe === "sukses"
                    ? "border-status-approved/30 bg-status-approved/10 text-status-approved"
                    : "border-status-failed/30 bg-status-failed/10 text-status-failed",
                )}
              >
                {pesanLink.teks}
              </div>
            )}
          </section>

          {/* Form Hasil Ekstraksi Link (Bisa diisi / diedit user) */}
          <form onSubmit={handleSimpanLink} className="space-y-6" noValidate>
            <section className="border border-surface-border bg-surface p-4 sm:p-6 space-y-4">
              <div>
                <h4 className="text-xs font-semibold font-mono uppercase tracking-wider text-muted-foreground">
                  Konfirmasi &amp; Lengkapi Data Penawaran
                </h4>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className={labelClass}>
                    Nama Penawaran <span className="text-status-failed">*</span>
                  </label>
                  <input
                    type="text"
                    value={linkForm.nama}
                    onChange={(e) => setLinkForm({ ...linkForm, nama: e.target.value })}
                    placeholder="Judul produk/layanan"
                    className={inputClass}
                  />
                  {linkError.nama && <p className={errorClass}>{linkError.nama}</p>}
                </div>

                <div>
                  <label className={labelClass}>
                    Kategori <span className="text-status-failed">*</span>
                  </label>
                  <select
                    value={linkForm.kategori}
                    onChange={(e) =>
                      setLinkForm({ ...linkForm, kategori: e.target.value as KategoriPenawaran })
                    }
                    className={inputClass}
                  >
                    {KATEGORI_PENAWARAN.map((kat) => (
                      <option key={kat} value={kat}>
                        {LABEL_KATEGORI_PENAWARAN[kat]}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Harga / Biaya (Opsional)</label>
                  <input
                    type="text"
                    value={linkForm.harga}
                    onChange={(e) => setLinkForm({ ...linkForm, harga: e.target.value })}
                    placeholder="Contoh: Rp 99.000 (opsional)"
                    className={inputClass}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className={labelClass}>
                    Link Affiliate Anda <span className="text-status-failed">*</span>
                  </label>
                  <input
                    type="url"
                    value={linkForm.link_affiliate}
                    onChange={(e) => setLinkForm({ ...linkForm, link_affiliate: e.target.value })}
                    placeholder="https://affiliate.example.com/ref/123"
                    className={inputClass}
                  />
                  {linkError.link_affiliate && (
                    <p className={errorClass}>{linkError.link_affiliate}</p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className={labelClass}>Deskripsi / Fitur Penawaran</label>
                  <textarea
                    rows={4}
                    value={linkForm.deskripsi}
                    onChange={(e) => setLinkForm({ ...linkForm, deskripsi: e.target.value })}
                    placeholder="Deskripsi atau fitur utama yang diekstrak dari halaman."
                    className={inputClass}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className={labelClass}>Catatan Aturan Program (Opsional)</label>
                  <textarea
                    rows={2}
                    value={linkForm.catatan_aturan}
                    onChange={(e) =>
                      setLinkForm({ ...linkForm, catatan_aturan: e.target.value })
                    }
                    placeholder="misal: Dilarang sebut nama brand di headline; wajib cantumkan kupon diskon 20%."
                    className={inputClass}
                  />
                  <p className="mt-1 text-[11px] text-muted-foreground font-mono">
                    Aturan ini akan muncul sebagai banner pengingat saat Anda menyusun ide dan konten posting.
                  </p>
                </div>

                <div className="sm:col-span-2">
                  <label className={labelClass}>URL Gambar (Opsional)</label>
                  <input
                    type="url"
                    value={linkForm.gambar}
                    onChange={(e) => setLinkForm({ ...linkForm, gambar: e.target.value })}
                    placeholder="https://.../image.png (opsional)"
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="h-9 px-5 bg-primary text-primary-foreground font-mono text-xs uppercase font-medium hover:bg-primary-hover transition-colors"
                >
                  Simpan Penawaran &gt;&gt;
                </button>
              </div>
            </section>
          </form>
        </div>
      )}
    </div>
  );
}
