import type { Metadata } from "next";
import { KatalogProduk } from "@/features/katalog/katalog-produk";

export const metadata: Metadata = { title: "Katalog Produk — Heaviliate" };

export default function KatalogPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-isi font-semibold">Katalog Produk</h1>
        <p className="mt-1 text-badan text-muted-foreground">
          Daftar semua produk tersimpan di browser ini: cari, sembunyikan, duplikat,
          atau langsung buat konten. Data tetap di perangkat ini (localStorage).
        </p>
      </header>
      <KatalogProduk />
    </div>
  );
}
