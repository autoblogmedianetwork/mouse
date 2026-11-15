/**
 * Bagian 1: input niche & audiens + kartu persona + chip preset (Fase 3-B).
 * Dipecah dari panel-riset.tsx (R6c) — state preset kini lokal di sini karena
 * hanya dipakai untuk menyusun teks audiens.
 */
import { useState } from "react";
import { Card } from "@/components/card";
import { PesanGalat } from "@/components/pesan-galat";
import { PemilihChip } from "@/components/pemilih-chip";
import {
  AUDIENS_CONTOH,
  NICHE_AWAL,
  type Riset,
} from "@/lib/riset/skema";
import {
  KARTU_PERSONA,
  PILIHAN_GENDER,
  PILIHAN_MINAT,
  PILIHAN_PERILAKU,
  PILIHAN_USIA,
  bangunDeskripsiAudiens,
  type PilihanAudiens,
} from "@/lib/riset/preset";
import type { RiwayatRiset } from "@/lib/riset/riwayat-pencarian";
import { PESAN_ENV_KURANG } from "@/lib/supabase/klien";
import { btnGhost, btnUtama, inputClass } from "./riset-bersama";

interface Props {
  niche: string;
  setNiche: (v: string) => void;
  audiens: string;
  setAudiens: (v: string) => void;
  riwayatRiset: RiwayatRiset[];
  riset: Riset | null;
  sibuk: "riset" | "peluang" | null;
  siap: boolean;
  galat: { pesan: string; perluMasuk: boolean } | null;
  catatan: string | null;
  jalankanRiset: () => void;
  susunPeluang: (risetId: string) => void;
}

export function BagianInputRiset({
  niche,
  setNiche,
  audiens,
  setAudiens,
  riwayatRiset,
  riset,
  sibuk,
  siap,
  galat,
  catatan,
  jalankanRiset,
  susunPeluang,
}: Props) {
  // Fase 3-B: pilihan preset (kartu persona + chip ala Meta Ads) — lokal.
  const [usiaPilih, setUsiaPilih] = useState<string | null>(null);
  const [genderPilih, setGenderPilih] = useState<string | null>(null);
  const [minatPilih, setMinatPilih] = useState<string[]>([]);
  const [perilakuPilih, setPerilakuPilih] = useState<string[]>([]);

  const toggleDari =
    (setter: React.Dispatch<React.SetStateAction<string[]>>) => (nilai: string) =>
      setter((prev) =>
        prev.includes(nilai) ? prev.filter((x) => x !== nilai) : [...prev, nilai],
      );

  const pilihan: PilihanAudiens = {
    usia: usiaPilih ?? undefined,
    gender: genderPilih ?? undefined,
    minat: minatPilih,
    perilaku: perilakuPilih,
  };
  const pratinjauPreset = bangunDeskripsiAudiens(pilihan);

  return (
    <Card>
      <h2 className="text-isi font-semibold">1. Niche &amp; audiens</h2>
      <p className="mt-1 text-badan text-muted-foreground">
        Satu niche dan satu target audiens menghasilkan 10 masalah nyata, lalu 20 kategori
        produk yang berpotensi dipromosikan di Threads. Semua hasil berstatus draft.
      </p>

      {/* Fase 3-B: preset tinggal pilih — kartu persona + chip ala Meta Ads. */}
      <div className="mt-4">
        <p className="mb-2 text-badan font-medium">Kartu persona (tinggal pilih)</p>
        <div className="flex flex-wrap gap-2">
          {KARTU_PERSONA.map((kartu) => (
            <button
              key={kartu.id}
              type="button"
              title={kartu.deskripsi}
              onClick={() => {
                setAudiens(kartu.deskripsi);
                setUsiaPilih(null);
                setGenderPilih(null);
                setMinatPilih([]);
                setPerilakuPilih([]);
              }}
              className="h-8 border border-surface-border bg-surface px-3 text-meta font-medium transition-colors hover:border-primary"
            >
              {kartu.nama}
            </button>
          ))}
        </div>

        <p className="mb-2 mt-4 text-badan font-medium">
          Atau rakit sendiri (ala iklan Meta):
        </p>
        <div className="space-y-2">
          <PemilihChip
            labelGrup="Usia"
            pilihan={PILIHAN_USIA}
            terpilih={usiaPilih ? [usiaPilih] : []}
            onPilih={(v) => setUsiaPilih((prev) => (prev === v ? null : v))}
          />
          <PemilihChip
            labelGrup="Gender"
            pilihan={PILIHAN_GENDER}
            terpilih={genderPilih ? [genderPilih] : []}
            onPilih={(v) => setGenderPilih((prev) => (prev === v ? null : v))}
          />
          <PemilihChip
            labelGrup="Minat"
            pilihan={PILIHAN_MINAT}
            terpilih={minatPilih}
            multi
            onPilih={toggleDari(setMinatPilih)}
          />
          <PemilihChip
            labelGrup="Perilaku belanja"
            pilihan={PILIHAN_PERILAKU}
            terpilih={perilakuPilih}
            multi
            onPilih={toggleDari(setPerilakuPilih)}
          />
        </div>
        {pratinjauPreset ? (
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <p className="text-badan text-muted-foreground">
              Hasil rakitan: <span className="text-foreground">{pratinjauPreset}</span>
            </p>
            <button
              type="button"
              className={btnGhost}
              onClick={() => setAudiens(pratinjauPreset)}
            >
              Pakai untuk riset
            </button>
          </div>
        ) : null}
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="r-niche" className="mb-1 block text-badan font-medium">
            Niche <span className="text-status-failed">*</span>
          </label>
          <input
            id="r-niche"
            value={niche}
            onChange={(e) => setNiche(e.target.value)}
            placeholder={NICHE_AWAL}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="r-audiens" className="mb-1 block text-badan font-medium">
            Target audiens <span className="text-status-failed">*</span>
          </label>
          <input
            id="r-audiens"
            value={audiens}
            onChange={(e) => setAudiens(e.target.value)}
            placeholder={AUDIENS_CONTOH}
            className={inputClass}
          />
        </div>
      </div>

      {riwayatRiset.length > 0 ? (
        <div className="mt-3">
          <p className="text-meta text-muted-foreground">
            Riwayat riset — klik untuk pakai ulang:
          </p>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {riwayatRiset.map((r) => (
              <button
                key={`${r.niche}|${r.audiens}`}
                type="button"
                onClick={() => {
                  setNiche(r.niche);
                  setAudiens(r.audiens);
                }}
                className="border border-surface-border px-2 py-1 text-meta hover:bg-muted"
                title={`${r.niche} · ${r.audiens}`}
              >
                {r.niche} · {r.audiens}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={jalankanRiset}
          className={btnUtama}
          disabled={sibuk !== null || niche.trim().length < 3 || audiens.trim().length < 3}
        >
          {sibuk === "riset" ? "Meriset audiens…" : "Jalankan riset"}
        </button>
        {riset ? (
          <button
            type="button"
            onClick={() => susunPeluang(riset.id)}
            className={btnGhost}
            disabled={sibuk !== null}
          >
            {sibuk === "peluang" ? "Menyusun peluang…" : "Susun ulang peluang"}
          </button>
        ) : null}
        <p className="text-meta text-muted-foreground">
          Niche awal dipakai sebagai default; ganti kapan saja.
        </p>
      </div>

      {!siap ? (
        <p role="alert" className="mt-3 text-badan text-status-failed">
          {PESAN_ENV_KURANG}
        </p>
      ) : null}
      {galat ? (
        <PesanGalat
          pesan={galat.pesan}
          perluMasuk={galat.perluMasuk}
          className="mt-3 border border-status-failed/40 bg-muted px-3 py-2"
        />
      ) : null}
      {catatan ? (
        <p role="status" className="mt-3 bg-muted px-3 py-2 text-badan">
          {catatan}
        </p>
      ) : null}
    </Card>
  );
}
