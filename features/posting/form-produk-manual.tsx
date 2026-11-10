"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { labelMarketplace } from "@/lib/affiliate/rules";
import { Card } from "@/components/card";
import { MAX_CLEAN_DESCRIPTION_LENGTH, charLength, cleanDescription } from "@/lib/produk/bersihkan-deskripsi";
import { productFormSchema, type ProductFormValues } from "@/lib/produk/skema";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "autothreads-products";

export interface SavedProduct extends ProductFormValues {
  id: string;
  saved_at: string;
  /** Cleaned description (PRD 10.1), computed at save time. */
  deskripsi_bersih: string;
}

function loadSavedProducts(): SavedProduct[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SavedProduct[]) : [];
  } catch {
    return [];
  }
}

const inputClass =
  "w-full border border-surface-border bg-surface px-3 py-2 text-badan outline-none focus:border-primary";
const labelClass = "mb-1 block text-badan font-medium";
const errorClass = "mt-1 text-meta text-status-failed";

export function FormProdukManual({
  onSaved,
  nilaiAwal,
}: {
  /** Called with the product the user just saved. */
  onSaved?: (product: SavedProduct) => void;
  /**
   * Isi awal form, mis. dari Quick Capture (N-8). User tetap harus memeriksa dan
   * menekan "Simpan produk" sendiri; tidak ada penyimpanan otomatis.
   */
  nilaiAwal?: Partial<ProductFormValues>;
}) {
  const [saved, setSaved] = useState<SavedProduct[]>([]);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      nama_internal: "",
      nama: "",
      varian: "",
      harga: "",
      deskripsi: "",
      url_referensi: "",
      ...nilaiAwal,
    },
  });
  // Fase 4-A: marketplace dideteksi dari link yang ditempel user (manual, tanpa API).
  const urlReferensi = useWatch({ control, name: "url_referensi" }) as string | undefined;
  const marketplaceLabel = labelMarketplace(urlReferensi);

  const deskripsiValue = useWatch({ control, name: "deskripsi" }) ?? "";
  const cleaned = useMemo(() => cleanDescription(deskripsiValue), [deskripsiValue]);
  const cleanedLength = useMemo(() => charLength(cleaned), [cleaned]);

  const onSubmit = handleSubmit((values) => {
    const product: SavedProduct = {
      ...values,
      harga: values.harga ? values.harga : undefined,
      deskripsi_bersih: cleaned,
      id: crypto.randomUUID(),
      saved_at: new Date().toISOString(),
    };
    const next = [product, ...loadSavedProducts()];
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setSaved(next);
    setSavedMessage("Produk tersimpan sementara di browser (localStorage).");
    onSaved?.(product);
    reset();
  });

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      {/* Block 2: Produk & link affiliate (UI-Spec 3.2) */}
      <Card>
        <h2 className="text-isi font-semibold">2. Produk &amp; link affiliate</h2>
        <p className="mt-1 text-badan text-muted-foreground">
          Isi manual dulu. Ambil dari link (scraping) default mati sesuai K5.
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="nama_internal" className={labelClass}>
              Nama internal <span className="text-status-failed">*</span>
            </label>
            <input
              id="nama_internal"
              {...register("nama_internal")}
              className={inputClass}
              placeholder="mis. Kaos polos hitam"
              aria-describedby="nama_internal-error"
            />
            {errors.nama_internal ? (
              <p id="nama_internal-error" className={errorClass} role="alert">
                {errors.nama_internal.message}
              </p>
            ) : null}
          </div>

          <div>
            <label htmlFor="nama" className={labelClass}>
              Nama di listing
            </label>
            <input
              id="nama"
              {...register("nama")}
              className={inputClass}
              placeholder="Nama lengkap dari halaman Shopee"
            />
          </div>

          <div>
            <label htmlFor="varian" className={labelClass}>
              Varian
            </label>
            <input
              id="varian"
              {...register("varian")}
              className={inputClass}
              placeholder="mis. Hitam, ukuran L"
            />
          </div>

          <div>
            <label htmlFor="harga" className={labelClass}>
              Harga (Rp)
            </label>
            <input
              id="harga"
              type="number"
              min={0}
              step={1}
              {...register("harga")}
              className={inputClass}
              placeholder="mis. 89000"
            />
            {errors.harga ? (
              <p className={errorClass} role="alert">
                {errors.harga.message}
              </p>
            ) : null}
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="url_referensi" className={labelClass}>
              Link Shopee (referensi)
            </label>
            <input
              id="url_referensi"
              {...register("url_referensi")}
              className={inputClass}
              placeholder="https://s.shopee.co.id/... · https://tokopedia.com/... · https://vt.tokopedia.com/... · https://tiktok.com/..."
            />
            {marketplaceLabel ? (
              <p className="mt-1 text-meta text-muted-foreground">
                Marketplace terdeteksi: <span className="font-medium text-foreground">{marketplaceLabel}</span>
              </p>
            ) : null}
            {errors.url_referensi ? (
              <p className={errorClass} role="alert">
                {errors.url_referensi.message}
              </p>
            ) : null}
          </div>
        </div>
      </Card>

      {/* Block 3: Deskripsi (UI-Spec 3.2) */}
      <Card>
        <h2 className="text-isi font-semibold">3. Deskripsi</h2>
        <p className="mt-1 text-badan text-muted-foreground">
          Salin deskripsi dari listing Shopee. Sistem membersihkan link, hashtag,
          emoji berlebihan, teks berulang, dan memotong 3.000 karakter (PRD 10.1).
        </p>

        <div className="mt-4">
          <label htmlFor="deskripsi" className={labelClass}>
            Deskripsi mentah <span className="text-status-failed">*</span>
          </label>
          <textarea
            id="deskripsi"
            rows={8}
            {...register("deskripsi")}
            className={cn(inputClass, "font-mono text-meta leading-5")}
            aria-describedby="deskripsi-error deskripsi-counter"
          />
          {errors.deskripsi ? (
            <p id="deskripsi-error" className={errorClass} role="alert">
              {errors.deskripsi.message}
            </p>
          ) : null}
        </div>

        <div className="mt-4 border border-surface-border p-3">
          <p className="font-mono text-meta uppercase tracking-meta text-muted-foreground">
            Deskripsi bersih (hasil pembersihan)
          </p>
          <pre className="mt-2 max-h-48 overflow-y-auto font-mono text-meta leading-5 whitespace-pre-wrap break-words">
            {cleaned || "—"}
          </pre>
          <p id="deskripsi-counter" className="mt-2 text-meta text-muted-foreground">
            {cleanedLength} / {MAX_CLEAN_DESCRIPTION_LENGTH} karakter
          </p>
        </div>
      </Card>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex h-10 items-center bg-primary px-5 text-badan font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-60"
        >
          Simpan produk
        </button>
        {savedMessage ? <p className="text-badan text-status-ready">{savedMessage}</p> : null}
      </div>

      {saved.length > 0 ? (
        <Card>
          <h2 className="text-isi font-semibold">
            Produk tersimpan ({saved.length})
          </h2>
          <ul className="mt-3 divide-y divide-surface-border">
            {saved.map((product) => (
              <li key={product.id} className="flex items-center justify-between py-2 text-badan">
                <span>{product.nama_internal}</span>
                <span className="text-meta text-muted-foreground">
                  {new Date(product.saved_at).toLocaleString("id-ID")}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-meta text-muted-foreground">
            Sementara disimpan di localStorage. Pindah ke tabel Supabase setelah
            project Supabase terhubung (prasyarat P3).
          </p>
        </Card>
      ) : null}
    </form>
  );
}
