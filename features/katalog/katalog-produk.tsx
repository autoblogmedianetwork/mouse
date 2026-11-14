"use client";

/**
 * Katalog Produk (fitur baru, adaptasi prompt "Affiliate Manager" ke
 * Heaviliate): daftar produk tersimpan dengan thumbnail, pencarian, aksi
 * per item (buat konten, duplikat, hapus) dan bulk action
 * (sembunyikan/tayangkan/hapus). Data tetap localStorage — tanpa API,
 * tanpa scraping server (Fase 4).
 */
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/card";
import { EmptyState } from "@/components/empty-state";
import { cn } from "@/lib/utils";
import { formatRupiah } from "@/lib/kalkulator/kalkulator-cuan";
import { labelMarketplace } from "@/lib/affiliate/rules";
import { encodePrefill } from "@/lib/impor/prefill";
import {
  hapusMassal,
  muatProduk,
  duplikatProduk,
  ubahArsipMassal,
  simpanProduk,
  type ProdukRingkas,
} from "@/lib/produk/store";

const btnKecil =
  "h-8 px-3 border border-surface-border text-meta font-medium transition-colors hover:bg-muted disabled:opacity-40";

/** Badge marketplace dari link produk; produk tanpa link dianggap Lainnya. */
function badgeMarketplace(p: ProdukRingkas): string {
  return labelMarketplace(p.url_referensi ?? "") ?? "Lainnya";
}

function tanggalSimpan(p: ProdukRingkas): string {
  if (!p.saved_at) return "";
  const d = new Date(p.saved_at);
  return isNaN(d.getTime())
    ? ""
    : `disimpan ${d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}`;
}

export function KatalogProduk() {
  const router = useRouter();
  const [produk, setProduk] = useState<ProdukRingkas[]>([]);
  const [kueri, setKueri] = useState("");
  const [lihatArsip, setLihatArsip] = useState(false);
  const [dipilih, setDipilih] = useState<Set<string>>(new Set());
  const [pesan, setPesan] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- muat localStorage setelah mount agar markup server dan klien sama
    setProduk(muatProduk());
  }, []);

  const tersaring = useMemo(() => {
    const q = kueri.trim().toLowerCase();
    return produk
      .filter((p) => Boolean(p.arsip) === lihatArsip)
      .filter((p) => {
        if (!q) return true;
        const gabung = [p.nama_internal, p.nama, p.varian, ...(p.tag ?? [])]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return gabung.includes(q);
      });
  }, [produk, kueri, lihatArsip]);

  const simpan = (list: ProdukRingkas[], pesanBaru?: string) => {
    setProduk(list);
    simpanProduk(list);
    if (pesanBaru) {
      setPesan(pesanBaru);
      setTimeout(() => setPesan(null), 3000);
    }
  };

  const togglePilih = (id: string) => {
    setDipilih((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const pilihSemuaTampil = () => {
    setDipilih((prev) =>
      prev.size === tersaring.length && tersaring.length > 0
        ? new Set()
        : new Set(tersaring.map((p) => p.id)),
    );
  };

  const buatKonten = (p: ProdukRingkas) => {
    const kode = encodePrefill({
      nama: p.nama || p.nama_internal || "",
      harga: p.harga ?? "",
      varian: p.varian ?? "",
      deskripsi: p.deskripsi_bersih || p.deskripsi || "",
      url: p.url_referensi ?? "",
      sumber: "katalog",
    });
    router.push("/posting/baru?prefill=" + kode);
  };

  const duplikat = (id: string) => {
    const hasil = duplikatProduk(produk, id);
    if (!hasil.salinan) return;
    simpan(hasil.list, `Salinan "${hasil.salinan.nama_internal}" dibuat.`);
  };

  const hapusSatu = (id: string, nama: string) => {
    if (!window.confirm(`Hapus produk "${nama}"? Tindakan ini tidak bisa dibatalkan.`)) return;
    simpan(hapusMassal(produk, [id]), `Produk "${nama}" dihapus.`);
    setDipilih((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const idsTerpilih = [...dipilih];

  return (
    <div className="space-y-4">
      {/* Bilah atas: cari + toggle arsip */}
      <Card padat className="flex flex-wrap items-center gap-3 p-3">
        <input
          type="search"
          value={kueri}
          onChange={(e) => setKueri(e.target.value)}
          placeholder="Cari nama, varian, atau tag…"
          aria-label="Cari produk"
          className="w-full max-w-xs border border-surface-border bg-surface px-3 py-1.5 text-badan outline-none focus:border-primary"
        />
        <button type="button" onClick={() => setLihatArsip((v) => !v)} className={btnKecil}>
          {lihatArsip ? "Lihat produk tayang" : "Lihat yang disembunyikan"}
        </button>
        <span className="ml-auto text-meta text-muted-foreground">
          {tersaring.length} produk
        </span>
      </Card>

      {/* Bulk action */}
      {tersaring.length > 0 ? (
        <Card padat className="flex flex-wrap items-center gap-2 p-3">
          <button type="button" onClick={pilihSemuaTampil} className={btnKecil}>
            {dipilih.size === tersaring.length && tersaring.length > 0
              ? "Batalkan pilihan"
              : "Pilih semua"}
          </button>
          <span className="text-meta text-muted-foreground">{dipilih.size} dipilih</span>
          <button
            type="button"
            disabled={dipilih.size === 0}
            onClick={() => simpan(ubahArsipMassal(produk, idsTerpilih, !lihatArsip), lihatArsip ? "Produk ditayangkan." : "Produk disembunyikan dari katalog.")}
            className={btnKecil}
          >
            {lihatArsip ? "Tayangkan terpilih" : "Sembunyikan terpilih"}
          </button>
          <button
            type="button"
            disabled={dipilih.size === 0}
            onClick={() => {
              if (!window.confirm(`Hapus ${dipilih.size} produk terpilih? Tindakan ini tidak bisa dibatalkan.`)) return;
              simpan(hapusMassal(produk, idsTerpilih), `${dipilih.size} produk dihapus.`);
              setDipilih(new Set());
            }}
            className={cn(btnKecil, "text-status-failed")}
          >
            Hapus terpilih
          </button>
        </Card>
      ) : null}

      {pesan ? (
        <p className="text-badan font-mono text-status-ready" aria-live="polite">
          {pesan}
        </p>
      ) : null}

      {/* Daftar produk */}
      {tersaring.length === 0 ? (
        <EmptyState
          title={lihatArsip ? "Tidak ada produk tersembunyi" : "Belum ada produk"}
          description={
            lihatArsip
              ? "Semua produk sedang tayang. Buka kembali daftar tayang untuk menyembunyikan produk."
              : "Simpan produk lewat Riset > Tempel Cepat atau tombol Quick Capture di browser, lalu produk muncul di sini."
          }
        />
      ) : (
        <ul className="space-y-3">
          {tersaring.map((p) => {
            const harga = Number((p.harga ?? "").toString().replace(/\D/g, "")) || 0;
            const dipilihItem = dipilih.has(p.id);
            return (
              <li key={p.id}>
                <Card
                  padat
                  className={cn("flex items-center gap-3 p-3", dipilihItem && "border-primary")}
                >
                  <input
                    type="checkbox"
                    checked={dipilihItem}
                    onChange={() => togglePilih(p.id)}
                    aria-label={"Pilih " + (p.nama_internal ?? "produk")}
                    className="h-4 w-4 flex-shrink-0 accent-[var(--primary)]"
                  />
                  {p.gambar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element -- gambar eksternal marketplace, tanpa optimasi next/image
                    <img
                      src={p.gambar_url}
                      alt=""
                      className="h-14 w-14 flex-shrink-0 border border-surface-border object-cover"
                    />
                  ) : (
                    <div
                      aria-hidden
                      className="flex h-14 w-14 flex-shrink-0 items-center justify-center border border-surface-border bg-muted text-mikro text-muted-foreground"
                    >
                      tanpa
                      <br />
                      foto
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-badan font-medium">
                      {p.nama_internal || p.nama || "Tanpa nama"}
                    </p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-meta text-muted-foreground">
                      <span className="border border-surface-border px-1.5 py-0.5 font-mono uppercase">
                        {badgeMarketplace(p)}
                      </span>
                      {harga > 0 ? (
                        <span className="font-mono text-foreground">{formatRupiah(harga)}</span>
                      ) : null}
                      {p.varian ? <span className="truncate">{p.varian}</span> : null}
                      {tanggalSimpan(p) ? <span>{tanggalSimpan(p)}</span> : null}
                    </p>
                  </div>
                  <div className="flex flex-shrink-0 flex-col gap-1.5 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => buatKonten(p)}
                      className="h-8 bg-primary px-3 text-meta font-medium text-primary-foreground hover:bg-primary-hover"
                    >
                      Buat konten
                    </button>
                    <button type="button" onClick={() => duplikat(p.id)} className={btnKecil}>
                      Duplikat
                    </button>
                    <button
                      type="button"
                      onClick={() => hapusSatu(p.id, p.nama_internal ?? "produk")}
                      className={cn(btnKecil, "text-status-failed")}
                    >
                      Hapus
                    </button>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
