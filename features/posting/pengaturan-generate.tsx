"use client";

import { PanelAnalisaGaya } from "@/features/pengaturan/panel-analisa-gaya";

import { useState } from "react";

import { Card } from "@/components/card";
import { InfoHint } from "@/components/info-hint";
import type { Pengaturan } from "@/lib/ai/schemas";
import { PENGATURAN_AWAL } from "@/lib/ai/schemas";
import { PERSONA_LIST, ambilPersona } from "@/lib/ai/persona";
import {
  KERANGKA_IDS,
  KETERANGAN_KERANGKA,
  LABEL_KERANGKA,
} from "@/lib/ai/kerangka";
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
 * jumlah status, panjang per status, instruksi, filter bahasa AI, persona,
 * gaya hook, aturan kepercayaan, letak link.
 */

const fieldClass =
  "w-full border border-surface-border bg-surface px-3 py-2 text-badan outline-none focus:border-primary";
const labelClass = "mb-1 block text-badan font-medium";

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
    <div className="flex items-start justify-between gap-4 border border-surface-border p-3">
      <div>
        <label htmlFor={id} className="text-badan font-medium">
          {label}
        </label>
        <p className="mt-0.5 text-meta text-muted-foreground">{description}</p>
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

  // Pengaturan lanjutan dilipat default (Fase 1 task C): pemula cukup melihat
  // mode output, panjang thread, jumlah dan panjang status.
  const [lanjutanTerbuka, setLanjutanTerbuka] = useState(false);

  return (
    <Card className={cn(disabled && "opacity-60")}>
      <div className="flex items-center justify-between">
        <h2 className="text-isi font-semibold">Pengaturan generate</h2>
        <button
          type="button"
          onClick={() => onChange(PENGATURAN_AWAL)}
          disabled={disabled}
          className="text-meta text-muted-foreground underline-offset-2 hover:underline disabled:opacity-50"
        >
          Kembalikan bawaan
        </button>
      </div>

      <div className="mt-4">
        <span className={labelClass}>
          Mode output
          <InfoHint
            text="Bentuk konten yang dihasilkan: utas Threads, posting singkat X, teks WhatsApp Status, caption TikTok, naskah video, atau slide carousel."
            className="ml-1 align-middle"
          />
        </span>
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
                  "h-9 border px-3 text-badan font-medium transition-colors disabled:opacity-50",
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
        <p className="mt-1 text-meta text-muted-foreground">
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
                  "h-9 border px-3 text-badan font-medium transition-colors disabled:opacity-50",
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
        <p className="mt-1 text-meta text-muted-foreground">
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
      </div>


      {/* Persona selalu terlihat: dipakai di SEMUA generate, jadi tidak masuk
          lipatan "pengaturan lanjutan" yang mudah terlewat. */}
      <div className="mt-4 border-2 border-primary/30 p-3">
        <p className="text-badan font-semibold">Persona (gaya bahasa)</p>
        <p className="mt-1 text-meta text-muted-foreground">
          Pilih karakter yang menulis konten. Untuk mengisi &quot;Bapak Sepur&quot;, pilih{" "}
          <strong>Persona bernama</strong> di bawah.
        </p>
        <div className="mt-3">
          <SelectField
            id="persona"
            label="Gaya bahasa (persona)"
            value={value.persona}
            onChange={(next) => {
              if (next === "bernama") {
                let nama = value.persona_nama;
                let gaya = value.persona_gaya;
                try {
                  const raw = window.localStorage.getItem("autothreads-persona-bernama");
                  if (raw) {
                    const p = JSON.parse(raw) as { nama?: string; gaya?: string };
                    if (p?.nama && !nama) nama = p.nama;
                    if (p?.gaya && !gaya) gaya = p.gaya;
                  }
                } catch {
                  // abaikan
                }
                onChange({ ...value, persona: next, persona_nama: nama, persona_gaya: gaya });
              } else {
                set("persona", next);
              }
            }}
            options={PERSONA_LIST.map((persona) => ({
              value: persona.id,
              label: persona.judul,
            }))}
          />
          <p className="mt-1 text-meta text-muted-foreground">
            {ambilPersona(value.persona).deskripsi_nada}
          </p>
        </div>

        {value.persona === "bernama" ? (
          <div className="mt-3 space-y-2 border border-surface-border bg-muted/30 p-3">
            <label className="block text-badan font-medium">
              Nama karakter
              <input
                type="text"
                value={value.persona_nama}
                onChange={(e) => {
                  const v = e.target.value;
                  onChange({ ...value, persona_nama: v });
                  try {
                    window.localStorage.setItem(
                      "autothreads-persona-bernama",
                      JSON.stringify({ nama: v, gaya: value.persona_gaya }),
                    );
                  } catch {
                    // abaikan
                  }
                }}
                className={fieldClass + " mt-1"}
                placeholder="Bapak Sepur"
              />
            </label>
            <label className="block text-badan font-medium">
              Gaya bicara
              <textarea
                value={value.persona_gaya}
                onChange={(e) => {
                  const v = e.target.value;
                  onChange({ ...value, persona_gaya: v });
                  try {
                    window.localStorage.setItem(
                      "autothreads-persona-bernama",
                      JSON.stringify({ nama: value.persona_nama, gaya: v }),
                    );
                  } catch {
                    // abaikan
                  }
                }}
                rows={3}
                className={fieldClass + " mt-1 resize-y"}
                placeholder="Santai, hangat, seperti bapak yang sudah pengalaman, tidak menggurui, jujur soal kekurangan."
              />
              <span className="mt-1 block text-meta text-muted-foreground">
                {value.persona_gaya.length}/300 karakter
              </span>
            </label>
            <details className="border border-surface-border p-3">
              <summary className="cursor-pointer text-badan font-medium text-primary">
                Contek gaya dari post publik &gt;&gt;&gt;
              </summary>
              <div className="mt-3">
                <PanelAnalisaGaya
                  onPakai={(gaya) => {
                    const v = gaya.slice(0, 300);
                    onChange({ ...value, persona_gaya: v });
                    try {
                      window.localStorage.setItem(
                        "autothreads-persona-bernama",
                        JSON.stringify({ nama: value.persona_nama, gaya: v }),
                      );
                    } catch {
                      // abaikan
                    }
                  }}
                />
              </div>
            </details>
          </div>
        ) : null}
      </div>

      <button
        type="button"
        onClick={() => setLanjutanTerbuka((t) => !t)}
        aria-expanded={lanjutanTerbuka}
        className="mt-4 inline-flex h-10 w-full items-center justify-between border-2 border-primary/40 bg-primary/5 px-4 text-badan font-medium text-primary hover:bg-primary/10"
      >
        <span>
          {lanjutanTerbuka ? "▼ Sembunyikan pengaturan lanjutan" : "▶ Buka pengaturan lanjutan"}
        </span>
        <span className="text-meta font-normal text-muted-foreground">
          persona, hook, jumlah status, link
        </span>
      </button>

      {lanjutanTerbuka ? (
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <SelectField
          id="gaya_hook"
          label="Gaya pembuka status"
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
            id="kerangka"
            label="Kerangka penulisan (urutan isi)"
            value={value.kerangka}
            onChange={(next) => set("kerangka", next)}
            // Pilihan dari lib/ai/kerangka.ts, bukan hardcode di sini.
            options={KERANGKA_IDS.map((id) => ({ value: id, label: LABEL_KERANGKA[id] }))}
          />
          <p className="mt-1 text-meta text-muted-foreground">
            {KETERANGAN_KERANGKA[value.kerangka]} Gaya pembuka di atas tetap dipakai untuk status
            pertama.
          </p>
        </div>
      </div>
      ) : null}
    </Card>
  );
}
