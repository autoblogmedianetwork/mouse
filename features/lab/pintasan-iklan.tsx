import Link from "next/link";
import { Card } from "@/components/card";

/**
 * Pintasan Dashboard ke Lab Iklan (Gelombang 6).
 *
 * Dashboard tetap ringkas: satu kartu, satu tujuan. Semua alat iklan
 * (kalkulator break-even, generator iklan Meta, wizard landing page) tinggal
 * di /lab#lab-iklan supaya tidak menambah menu baru ke sidebar.
 */
export function PintasanIklan() {
  return (
    <Card nada="aksen">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-isi font-semibold">Mau coba iklan berbayar?</h2>
          <p className="mt-1 text-badan text-muted-foreground">
            Hitung dulu apakah komisi menutup biaya klik, tulis tiga varian iklan Meta dalam suara
            Pak Slem, lalu buat landing page untuk menampung kliknya. Semua tetap Anda kirim manual.
          </p>
        </div>
        <Link
          href="/lab#lab-iklan"
          className="inline-flex h-11 shrink-0 items-center bg-primary px-4 text-badan font-medium text-primary-foreground transition-colors hover:bg-primary-hover sm:h-9"
        >
          Buka Lab Iklan
        </Link>
      </div>
    </Card>
  );
}
