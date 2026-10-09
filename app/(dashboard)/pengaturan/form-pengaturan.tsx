"use client";

import { z } from "zod";
import { useLocalState } from "@/lib/konten/use-local-state";

/**
 * Pengaturan (UI-Spec 3.8 / PRD F6): profil, AI, scraping (default mati),
 * aturan konten, data (retensi 90 hari sesuai K3).
 * Saved locally until Supabase auth lands (P3).
 */

export const pengaturanSkemaApp = z.object({
  nama: z.string().max(80).default(""),
  email: z.string().max(200).default(""),
  batas_biaya_bulanan: z.number().min(0).default(50_000),
  percakapan_baru: z.boolean().default(true),
  scraping_aktif: z.boolean().default(false),
  sebut_kekurangan: z.boolean().default(true),
  anti_ai_slop: z.boolean().default(true),
  gaya_hook_default: z.enum(["pertanyaan", "masalah_relatif", "pernyataan_mengejutkan", "bawaan"]).default("bawaan"),
  retensi_hari: z.number().int().min(7).default(90),
});

export type PengaturanApp = z.infer<typeof pengaturanSkemaApp>;

const inputClass =
  "w-full rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary";

function Section({ judul, deskripsi, children }: { judul: string; deskripsi: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-surface-border bg-surface p-4 sm:p-6">
      <h2 className="text-base font-semibold">{judul}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{deskripsi}</p>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Toggle({
  id,
  label,
  deskripsi,
  checked,
  onChange,
  disabled = false,
}: {
  id: string;
  label: string;
  deskripsi: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border border-surface-border p-3">
      <div>
        <label htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
        <p className="mt-0.5 text-xs text-muted-foreground">{deskripsi}</p>
      </div>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-4 w-4 accent-[var(--primary)] disabled:opacity-50"
      />
    </div>
  );
}

export function FormPengaturan() {
  const [value, setValue] = useLocalState<PengaturanApp>("autothreads-pengaturan", {
    nama: "",
    email: "",
    batas_biaya_bulanan: 50_000,
    percakapan_baru: true,
    scraping_aktif: false,
    sebut_kekurangan: true,
    anti_ai_slop: true,
    gaya_hook_default: "bawaan",
    retensi_hari: 90,
  });

  return (
    <div className="space-y-4">
      <Section judul="Profil dan akun" deskripsi="Identitas akun. Login magic link aktif setelah Supabase terhubung (P3).">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="p-nama" className="mb-1 block text-sm font-medium">
              Nama
            </label>
            <input
              id="p-nama"
              value={value.nama}
              onChange={(e) => setValue({ ...value, nama: e.target.value })}
              placeholder="Nama Anda"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="p-email" className="mb-1 block text-sm font-medium">
              Email
            </label>
            <input
              id="p-email"
              type="email"
              value={value.email}
              onChange={(e) => setValue({ ...value, email: e.target.value })}
              placeholder="nama@email.com"
              className={inputClass}
            />
          </div>
        </div>
      </Section>

      <Section
        judul="AI"
        deskripsi="Model tunggal di MVP sesuai keputusan docs/ai-provider.md. API key tetap di server."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="p-model" className="mb-1 block text-sm font-medium">
              Model
            </label>
            <input id="p-model" value="Gemini 2.5 Flash-Lite" readOnly className={`${inputClass} text-muted-foreground`} />
          </div>
          <div>
            <label htmlFor="p-batas" className="mb-1 block text-sm font-medium">
              Batas biaya bulanan (Rp)
            </label>
            <input
              id="p-batas"
              type="number"
              min={0}
              step={10000}
              value={value.batas_biaya_bulanan}
              onChange={(e) =>
                setValue({ ...value, batas_biaya_bulanan: Math.max(0, Number(e.target.value) || 0) })
              }
              className={inputClass}
            />
          </div>
          <div className="sm:col-span-2">
            <Toggle
              id="p-percakapan"
              label="Mulai di percakapan AI baru"
              deskripsi="Default aktif: setiap generate dimulai dari percakapan baru agar konten tidak tercampur."
              checked={value.percakapan_baru}
              onChange={(next) => setValue({ ...value, percakapan_baru: next })}
            />
          </div>
        </div>
      </Section>

      <Section
        judul="Scraping"
        deskripsi="Default mati (K5). Membaca halaman Shopee berisiko melanggar ToS — input manual selalu tersedia."
      >
        <Toggle
          id="p-scraping"
          label="Aktifkan pembacaan link Shopee"
          deskripsi="Jika gagal atau diblokir, sistem kembali ke input manual tanpa menghentikan alur. Batas: beberapa permintaan per hari, hasil di-cache."
          checked={value.scraping_aktif}
          onChange={(next) => setValue({ ...value, scraping_aktif: next })}
        />
        {!value.scraping_aktif ? (
          <p className="mt-2 text-xs text-muted-foreground">
            Saat ini nonaktif. Form input manual selalu berfungsi penuh.
          </p>
        ) : null}
      </Section>

      <Section judul="Aturan konten" deskripsi="Default untuk pengaturan generate di halaman Buat posting.">
        <div className="grid gap-3">
          <Toggle
            id="p-kekurangan"
            label="Wajib sebut kekurangan produk"
            deskripsi="Minimal satu status dalam tiap batch menyebut batasan produk secara jujur (F3a)."
            checked={value.sebut_kekurangan}
            onChange={(next) => setValue({ ...value, sebut_kekurangan: next })}
          />
          <Toggle
            id="p-slop"
            label="Anti AI Slop"
            deskripsi="Panjang antarstatus tidak seragam, bentuk tiap status berbeda."
            checked={value.anti_ai_slop}
            onChange={(next) => setValue({ ...value, anti_ai_slop: next })}
          />
          <div>
            <label htmlFor="p-hook" className="mb-1 block text-sm font-medium">
              Gaya hook default
            </label>
            <select
              id="p-hook"
              value={value.gaya_hook_default}
              onChange={(e) =>
                setValue({
                  ...value,
                  gaya_hook_default: e.target.value as PengaturanApp["gaya_hook_default"],
                })
              }
              className={inputClass}
            >
              <option value="bawaan">Bawaan</option>
              <option value="pertanyaan">Pertanyaan</option>
              <option value="masalah_relatif">Masalah relatable</option>
              <option value="pernyataan_mengejutkan">Pernyataan mengejutkan</option>
            </select>
          </div>
        </div>
      </Section>

      <Section judul="Data" deskripsi="Periode retensi arsip. Penghapusan otomatis berjalan sebagai job terpisah (Fase 5).">
        <div className="max-w-xs">
          <label htmlFor="p-retensi" className="mb-1 block text-sm font-medium">
            Retensi arsip (hari)
          </label>
          <input
            id="p-retensi"
            type="number"
            min={7}
            step={1}
            value={value.retensi_hari}
            onChange={(e) =>
              setValue({ ...value, retensi_hari: Math.max(7, Number(e.target.value) || 90) })
            }
            className={inputClass}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Keputusan K3: 90 hari sejak konten diarsipkan.
          </p>
        </div>
      </Section>
    </div>
  );
}
