"use client";

/**
 * Bagian 1 panel riset: niche & audiens (dipecah dari panel-riset.tsx, R6c;
 * ditata ulang per masukan review UI — kategori chip dipisah tegas, persona
 * mengisi chip, audiens tersusun otomatis dari chip).
 */
import { useState } from "react";
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
  PILIHAN_KEBUTUHAN,
  PILIHAN_MINAT,
  PILIHAN_PERILAKU,
  PILIHAN_USIA,
  bangunDeskripsiAudiens,
  personaDimodifikasi,
  type KartuPersona,
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
  // Pilihan chip per kategori — dikelompokkan tegas (masukan review UI).
  const [usiaPilih, setUsiaPilih] = useState<string | null>(null);
  const [genderPilih, setGenderPilih] = useState<string | null>(null);
  const [minatPilih, setMinatPilih] = useState<string[]>([]);
  const [kebutuhanPilih, setKebutuhanPilih] = useState<string[]>([]);
  const [perilakuPilih, setPerilakuPilih] = useState<string[]>([]);
  // Persona siap pakai yang sedang aktif (null = rakit sendiri murni).
  const [personaAktif, setPersonaAktif] = useState<KartuPersona | null>(null);
  // Audiens terakhir disusun otomatis dari chip (masih boleh diedit manual).
  const [audiensDariChip, setAudiensDariChip] = useState(false);

  const toggleDari =
    (setter: React.Dispatch<React.SetStateAction<string[]>>) => (nilai: string) =>
      setter((prev) =>
        prev.includes(nilai) ? prev.filter((x) => x !== nilai) : [...prev, nilai],
      );

  const pilihan: PilihanAudiens = {
    usia: usiaPilih ?? undefined,
    gender: genderPilih ?? undefined,
    minat: minatPilih,
    kebutuhan: kebutuhanPilih,
    perilaku: perilakuPilih,
  };
  const pratinjauPreset = bangunDeskripsiAudiens(pilihan);

  /** Ubah satu grup chip lalu susun ulang audiens bila audiens masih otomatis. */
  const ubahChip = (perubahan: Partial<PilihanAudiens>) => {
    const baru: PilihanAudiens = { ...pilihan, ...perubahan };
    if (perubahan.usia !== undefined) setUsiaPilih(perubahan.usia ?? null);
    if (perubahan.gender !== undefined) setGenderPilih(perubahan.gender ?? null);
    if (perubahan.minat !== undefined) setMinatPilih([...perubahan.minat]);
    if (perubahan.kebutuhan !== undefined) setKebutuhanPilih([...perubahan.kebutuhan]);
    if (perubahan.perilaku !== undefined) setPerilakuPilih([...perubahan.perilaku]);
    if (audiensDariChip) setAudiens(bangunDeskripsiAudiens(baru));
  };

  const pilihPersona = (kartu: KartuPersona) => {
    setPersonaAktif(kartu);
    setUsiaPilih(kartu.chips.usia ?? null);
    setGenderPilih(kartu.chips.gender ?? null);
    setMinatPilih([...kartu.chips.minat]);
    setKebutuhanPilih([...kartu.chips.kebutuhan]);
    setPerilakuPilih([...kartu.chips.perilaku]);
    // Persona mengisi kolom audiens dengan kalimat preset-nya sendiri.
    setAudiens(kartu.deskripsi);
    setAudiensDariChip(false);
  };

  const rakitSendiri = () => {
    setPersonaAktif(null);
    setUsiaPilih(null);
    setGenderPilih(null);
    setMinatPilih([]);
    setKebutuhanPilih([]);
    setPerilakuPilih([]);
    setAudiensDariChip(false);
  };

  const dimodifikasi = personaAktif
    ? personaDimodifikasi(personaAktif, pilihan)
    : false;

  return (
    <div>
      <h2 className="text-isi font-semibold">1. Niche &amp; audiens</h2>
      <p className="mt-1 text-badan text-muted-foreground">
        Satu niche dan satu target audiens menghasilkan 10 masalah, lalu 20 kategori
        produk yang berpotensi dipromosikan di Threads. Semua hasil berstatus draft.
      </p>

      {/* Persona siap pakai: gabungan preset dari empat kategori di bawah. */}
      <div className="mt-4">
        <p className="mb-2 text-badan font-medium">Persona siap pakai</p>
        <div className="flex flex-wrap gap-2">
          {KARTU_PERSONA.map((kartu) => (
            <button
              key={kartu.id}
              type="button"
              title={kartu.deskripsi}
              aria-pressed={personaAktif?.id === kartu.id}
              onClick={() =>
                personaAktif?.id === kartu.id ? rakitSendiri() : pilihPersona(kartu)
              }
              className="inline-flex h-11 items-center border border-surface-border bg-surface px-3 text-badan font-medium transition-colors hover:border-primary"
            >
              {kartu.nama}
            </button>
          ))}
        </div>
        {personaAktif ? (
          <p className="mt-2 text-meta text-muted-foreground">
            Persona <span className="font-medium text-foreground">{personaAktif.nama}</span>{" "}
            aktif — chip di bawah terisi otomatis dan boleh diubah.
            {dimodifikasi ? (
              <span className="ml-1 font-medium text-foreground">
                Dimodifikasi dari persona {personaAktif.nama}.
              </span>
            ) : null}{" "}
            Paling cocok untuk niche <strong>{personaAktif.kelompok}</strong> — kalau
            niche-mu berbeda, yang dipakai tetap niche yang kamu tulis.
          </p>
        ) : null}
      </div>

      {/* Rakit sendiri: empat kategori terpisah dengan judul jelas. */}
      <div className="mt-4 space-y-4">
        <p className="text-badan font-medium">
          Atau rakit sendiri — pilih per kategori:
        </p>
        <fieldset className="space-y-2">
          <legend className="text-meta font-semibold uppercase tracking-meta text-muted-foreground">
            Demografi — menentukan bahasa dan contoh konten
          </legend>
          <PemilihChip
            labelGrup="Usia"
            pilihan={PILIHAN_USIA}
            terpilih={usiaPilih ? [usiaPilih] : []}
            onPilih={(v) => ubahChip({ usia: usiaPilih === v ? undefined : v })}
          />
          <PemilihChip
            labelGrup="Gender"
            pilihan={PILIHAN_GENDER}
            terpilih={genderPilih ? [genderPilih] : []}
            onPilih={(v) => ubahChip({ gender: genderPilih === v ? undefined : v })}
          />
        </fieldset>
        <fieldset>
          <legend className="text-meta font-semibold uppercase tracking-meta text-muted-foreground">
            Minat — memilih kategori produk dan angle
          </legend>
          <PemilihChip
            labelGrup="Minat"
            pilihan={PILIHAN_MINAT}
            terpilih={minatPilih}
            multi
            onPilih={(v) =>
              ubahChip({
                minat: minatPilih.includes(v)
                  ? minatPilih.filter((x) => x !== v)
                  : [...minatPilih, v],
              })
            }
          />
        </fieldset>
        <fieldset>
          <legend className="text-meta font-semibold uppercase tracking-meta text-muted-foreground">
            Kebutuhan — masalah yang ingin diselesaikan
          </legend>
          <PemilihChip
            labelGrup="Kebutuhan"
            pilihan={PILIHAN_KEBUTUHAN}
            terpilih={kebutuhanPilih}
            multi
            onPilih={(v) =>
              ubahChip({
                kebutuhan: kebutuhanPilih.includes(v)
                  ? kebutuhanPilih.filter((x) => x !== v)
                  : [...kebutuhanPilih, v],
              })
            }
          />
        </fieldset>
        <fieldset>
          <legend className="text-meta font-semibold uppercase tracking-meta text-muted-foreground">
            Perilaku belanja — menentukan jenis hook dan CTA
          </legend>
          <PemilihChip
            labelGrup="Perilaku belanja"
            pilihan={PILIHAN_PERILAKU}
            terpilih={perilakuPilih}
            multi
            onPilih={(v) =>
              ubahChip({
                perilaku: perilakuPilih.includes(v)
                  ? perilakuPilih.filter((x) => x !== v)
                  : [...perilakuPilih, v],
              })
            }
          />
        </fieldset>
        {pratinjauPreset ? (
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-badan text-muted-foreground">
              Hasil rakitan: <span className="text-foreground">{pratinjauPreset}</span>
            </p>
            <button
              type="button"
              className={btnGhost}
              onClick={() => {
                setAudiens(pratinjauPreset);
                setAudiensDariChip(true);
              }}
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
            onChange={(e) => {
              // Edit manual memutus ikatan chip → teks.
              setAudiens(e.target.value);
              setAudiensDariChip(false);
            }}
            placeholder={AUDIENS_CONTOH}
            className={inputClass}
          />
          <p className="mt-1 text-meta text-muted-foreground">
            Terisi otomatis dari chip saat persona atau rakitan dipakai; tetap boleh
            diedit langsung di sini.
          </p>
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
    </div>
  );
}
