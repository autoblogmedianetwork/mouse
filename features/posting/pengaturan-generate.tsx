"use client";

import type { Pengaturan } from "@/lib/ai/schemas";
import { PENGATURAN_AWAL } from "@/lib/ai/schemas";
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
            { value: "bawaan", label: "Bawaan" },
            { value: "pertanyaan", label: "Pertanyaan" },
            { value: "masalah_relatif", label: "Masalah relatable" },
            { value: "pernyataan_mengejutkan", label: "Pernyataan mengejutkan" },
          ]}
        />
        <SelectField
          id="persona"
          label="Persona (arah konten)"
          value={value.persona}
          onChange={(next) => set("persona", next)}
          options={[
            { value: "Bawaan", label: "Bawaan" },
            { value: "Sahabat", label: "Sahabat (santai, satu lawan satu)" },
            { value: "Ahli", label: "Ahli ( informatif, to the point )" },
          ]}
        />
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
        </div>
      </div>
    </section>
  );
}
