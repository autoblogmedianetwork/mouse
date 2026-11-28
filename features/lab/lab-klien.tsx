"use client";

/**
 * Halaman Lab (refactor R6): orkestrator saja. Tiap kelompok fitur ada di
 * file sendiri (lab-*.tsx); helper bersama di lab-bersama.tsx.
 *
 * Sejak critique 28 Nov: halaman ini punya daftar isi berjangkar. Sebelumnya
 * 19 blok ditumpuk tanpa penanda, sehingga alat yang dicari harus ditemukan
 * dengan menggulir buta.
 */
import type { ReactNode } from "react";
import { NotifikasiProaktif } from "@/features/lab/notifikasi-proaktif";
import { BagianLabUji, BagianIdeMasalah } from "./lab-uji-ide";
import { BagianSerial, BagianHashtag, BagianSerial30 } from "./lab-serial";
import { BagianGhostwriter, BagianBattle, BagianJujur, BagianParalel } from "./lab-kreator";
import { BagianTimeCapsule, BagianNyanyian, BagianGamifikasi, BagianLawanBots, BagianFoto, BagianMirror } from "./lab-alat";
import { BagianBedah } from "./lab-bedah";
import { BagianUtasPanjang } from "./lab-utas";
import { BagianLabIklan } from "./lab-iklan";

/** Urutan tampil sekaligus sumber daftar isi — satu daftar, dua pemakaian. */
const BAGIAN: ReadonlyArray<{ id: string; label: string; isi: ReactNode }> = [
  { id: "bedah", label: "Bedah postingan", isi: <BagianBedah /> },
  { id: "utas-panjang", label: "Utas panjang", isi: <BagianUtasPanjang /> },
  { id: "lab-iklan", label: "Lab Iklan", isi: <BagianLabIklan /> },
  { id: "uji-konten", label: "Uji konten", isi: <BagianLabUji /> },
  { id: "ide-masalah", label: "Ide dari masalah", isi: <BagianIdeMasalah /> },
  { id: "serial-7", label: "Serial 7 hari", isi: <BagianSerial /> },
  { id: "hashtag", label: "Hashtag", isi: <BagianHashtag /> },
  { id: "serial-30", label: "Serial 30 hari", isi: <BagianSerial30 /> },
  { id: "rapi-curhatan", label: "Rapi curhatan", isi: <BagianGhostwriter /> },
  { id: "battle", label: "Dua sudut berdebat", isi: <BagianBattle /> },
  { id: "versi-jujur", label: "Versi jujur", isi: <BagianJujur /> },
  { id: "paralel", label: "Varian paralel", isi: <BagianParalel /> },
  { id: "kapsul-waktu", label: "Pesan untuk nanti", isi: <BagianTimeCapsule /> },
  { id: "lirik", label: "Ubah jadi lirik", isi: <BagianNyanyian /> },
  { id: "gamifikasi", label: "Poin dan level", isi: <BagianGamifikasi /> },
  { id: "lawan-bots", label: "Dua bot berdebat", isi: <BagianLawanBots /> },
  { id: "pengingat", label: "Pengingat", isi: <NotifikasiProaktif /> },
  { id: "dari-foto", label: "Konten dari foto", isi: <BagianFoto /> },
  { id: "tiru-gaya", label: "Tiru pola gaya", isi: <BagianMirror /> },
];

export function LabKlien() {
  return (
    <div className="space-y-6">
      <p className="text-meta text-muted-foreground">
        Semua keluaran AI berstatus draft. Tidak ada yang menjadi siap posting tanpa checklist dan
        tindakan Anda. Panggilan AI memakai kredit server dan dihentikan otomatis saat batas biaya
        bulanan tercapai.
      </p>

      <nav aria-label="Daftar bagian Lab" className="border border-surface-border bg-surface p-3">
        <p className="text-meta uppercase tracking-badge text-muted-foreground">Isi halaman</p>
        <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5">
          {BAGIAN.map((b) => (
            <li key={b.id}>
              <a
                href={`#${b.id}`}
                className="text-meta underline-offset-2 hover:text-foreground hover:underline"
              >
                {b.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {BAGIAN.map((b) => (
        <div key={b.id} id={b.id} className="scroll-mt-24">
          {b.isi}
        </div>
      ))}
    </div>
  );
}
