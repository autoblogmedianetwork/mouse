"use client";

import type { Pengaturan } from "@/lib/ai/schemas";
import { PENGATURAN_AWAL } from "@/lib/ai/schemas";
import { PERSONA_LIST, ambilPersona } from "@/lib/ai/persona";
import { LABEL_MODE_OUTPUT, MODE_OUTPUT_IDS, batasPlatform } from "@/lib/platforms/batas";
import {
  LABEL_PRESET_THREAD,
  PRESET_THREAD_IDS,
  presetThreadAktif,
  terapkanPresetThread,
} from "@/lib/ai/preset-thread";
import { cn } from "@/lib/utils";

/**
 * Generate settings block (PRD F3 + F3a):
 * jumlah status, panjang per status, instruksi, Anti AI Slop, persona,
 * gaya hook, aturan kepercayaan, letak link.
 */

const fieldClass =
  "w-full rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary";
const labelClass = "mb-1 block text-sm font-medium";

function SelectField<T extends string>({
  id,
  label,
  value,
  options,
  onChange,
}: {
  id: string;
  label: string;
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (next: T) => void;
}) {
  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className={fieldClass}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function ToggleField({
  id,
  label,
  description,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border border-surface-border p-3">
      <div>
        <label htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-4 w-4 accent-[var(--primary)]"
      />
    </div>
  );
}

export function PengaturanGenerate({
  value,
  onChange,
  disabled = false,
}: {
  value: Pengaturan;
  onChange: (next: Pengaturan) => void;
  disabled?: boolean;
}) {
  const set = <K extends keyof Pengaturan>(key: K, next: Pengaturan[K]) =>
    onChange({ ...value, [key]: next });

  return (
    <section
className={cn(
        "rounded-xl border border-surface-border bg-surface p-4 sm:p-6",
        disabled && "opacity-60",
      )}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Pengaturan generate</h2>
        <button
          type="button"
          onClick={() => onChange(PENGATURAN_AWAL)}
          disabled={disabled}
          className="text-xs text-muted-foreground underline-offset-2 hover:underline disabled:opacity-50"
        >
          Kembalikan bawaan
        </button>
      </div>

      <div className="mt-4">
        <span className={labelClass}>Mode output</span>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Mode output">
          {MODE_OUTPUT_IDS.map((mode) => {
            const aktif = value.mode_output === mode;
            return (
              <button
                key={mode}
                type="button"
                disabled={disabled}
                aria-pressed={aktif}
                onClick={() => set("mode_output", mode)}
                className={cn(
                  "h-9 rounded-lg border px-3 text-sm font-medium transition-colors disabled:opacity-50",
                  aktif
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-surface-border bg-surface hover:border-primary",
                )}
              >
                {LABEL_MODE_OUTPUT[mode]}
              </button>
            );
          })}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {value.mode_output === "naskah_video"
            ? "Naskah video: tiga bagian (hook visual 3 detik, fungsi produk, CTA), durasi 30 sampai 60 detik. Pengaturan jumlah dan panjang status tidak dipakai."
            : value.mode_output === "carousel"
              ? "Carousel: susunan slide visual (cover, isi, cta) + caption. Didesain untuk diunduh sebagai gambar PNG atau disalin ke Canva."
              : `Batas ${batasPlatform(value.mode_output)} karakter per status.`}
        </p>
      </div>

      <div className="mt-4">
        <span className={labelClass}>Panjang thread</span>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Panjang thread">
          {PRESET_THREAD_IDS.map((preset) => {
            const aktif = presetThreadAktif(value) === preset;
            return (
              <button
                key={preset}
                type="button"
                disabled={disabled}
                aria-pressed={aktif}
                onClick={() => onChange(terapkanPresetThread(value, preset))}
                className={cn(
                  "h-9 rounded-lg border px-3 text-sm font-medium transition-colors disabled:opacity-50",
                  aktif
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-surface-border bg-surface hover:border-primary",
                )}
              >
                {LABEL_PRESET_THREAD[preset]}
              </button>
            );
          })}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {presetThreadAktif(value)
            ? "Preset ini mengatur jumlah status dan panjang per status di bawah."
            : "Kustom: jumlah dan panjang status diatur sendiri di bawah."}
        </p>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <SelectField
          id="jumlah_status"
          label="Jumlah status per konten"
          value={value.jumlah_status}
          onChange={(next) => set("jumlah_status", next)}
          options={[
            { value: "pendek", label: "Pendek (3-5)" },
            { value: "menengah", label: "Menengah (6-11)" },
            { value: "panjang", label: "Panjang (12+)" },
          ]}
        />
        <SelectField
          id="panjang_status"
          label="Panjang per status"
          value={value.panjang_status}
          onChange={(next) => set("panjang_status", next)}
          options={[
            { value: "singkat", label: "Singkat" },
            { value: "sedang", label: "Sedang" },
            { value: "panjang", label: "Panjang" },
          ]}
        />
        <SelectField
          id="gaya_hook"
          label="Gaya hook pembuka"
          value={value.gaya_hook}
          onChange={(next) => set("gaya_hook", next)}
          options={[
            { value: "bawaan", label: "Bawaan (Otomatis AI)" },
            { value: "curiosity_gap", label: "Curiosity Gap (Fakta Unik)" },
            { value: "before_after", label: "Before-After (Transformasi)" },
            { value: "contrarian", label: "Contrarian (Anti-Mainstream)" },
            { value: "masalah_relatif", label: "Audience Pain (Keluhan Nyata)" },
            { value: "pertanyaan", label: "Pertanyaan Reflektif" },
            { value: "pernyataan_mengejutkan", label: "Pernyataan Mengejutkan" },
          ]}
        />
        <div>
          <SelectField
            id="persona"
            label="Persona (arah konten)"
            value={value.persona}
            onChange={(next) => set("persona", next)}
            // Pilihan datang dari data (lib/ai/persona.ts), bukan hardcode di sini.
            options={PERSONA_LIST.map((persona) => ({
              value: persona.id,
              label: `${persona.ikon} ${persona.judul}`,
            }))}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            {ambilPersona(value.persona).deskripsi_nada}
          </p>
        </div>
        <SelectField
          id="letak_link"
          label="Letak link affiliate"
          value={value.letak_link}
          onChange={(next) => set("letak_link", next)}
          options={[
            { value: "status_terakhir", label: "Di status terakhir" },
            { value: "balasan", label: "Balasan terpisah" },
            { value: "tanpa_link", label: "Tanpa link (konten saja)" },
          ]}
        />
        <div className="sm:col-span-2">
          <label htmlFor="instruksi" className={labelClass}>
            Instruksi tambahan (opsional)
          </label>
          <textarea
            id="instruksi"
            rows={3}
            value={value.instruksi}
            onChange={(e) => set("instruksi", e.target.value)}
            placeholder="mis. Jangan pakai kata 'wajib', sebut varian warna."
            className={fieldClass}
          />
        </div>
        <div className="grid gap-3 sm:col-span-2 sm:grid-cols-2">
          <ToggleField
            id="anti_ai_slop"
            label="Anti AI Slop"
            description="Panjang antarstatus tidak seragam, bentuk tiap status berbeda, tanpa pembuka generik."
            checked={value.anti_ai_slop}
            onChange={(next) => set("anti_ai_slop", next)}
          />
          <ToggleField
            id="aturan_kepercayaan"
            label="Aturan kepercayaan"
            description="Minimal satu status menyebut kekurangan atau batasan produk."
            checked={value.aturan_kepercayaan}
            onChange={(next) => set("aturan_kepercayaan", next)}
          />
          <div className="sm:col-span-2">
            <ToggleField
              id="sertakan_disclosure"
              label="Sertakan disclosure affiliate (#iklan / #affiliate)"
              description="Otomatis menambahkan tag disclosure di status terakhir untuk transparansi kepatuhan affiliate, tetap dalam batas karakter."
              checked={value.sertakan_disclosure ?? true}
              onChange={(next) => set("sertakan_disclosure", next)}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
