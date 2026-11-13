"use client";

/**
 * Tempel Cepat (Riset) — user menempel teks dari Shopee, sistem mengurai
 * nama/harga/terjual/rating/link lalu menilai 2 pilar yang bisa dihitung
 * dari data nyata. Bukan scraping: tidak ada request ke marketplace.
 */
import { useEffect, useState } from "react";
import { Card } from "@/components/card";
import { formatRupiah } from "@/lib/kalkulator/kalkulator-cuan";
import { uraiTempelan, nilaiTempelan, type ProdukTempelan } from "@/lib/riset/tempel-cepat";
import {
  hapusProduk,
  muatProduk,
  perbaruiProduk,
  simpanProduk,
  type ProdukRingkas,
} from "@/lib/produk/store";

const inputClass =
  "w-full border border-surface-border bg-surface px-3 py-2 text-badan outline-none focus:border-primary";
const tombol =
  "inline-flex h-9 items-center border border-surface-border px-3 text-meta font-medium hover:bg-muted";
const tombolUtama =
  "inline-flex h-9 items-center bg-primary px-3 text-meta font-medium text-primary-foreground hover:opacity-90";

export function TempelCepat() {
  const [teks, setTeks] = useState("");
  const [rate, setRate] = useState("10");
  const [target, setTarget] = useState("1000000");
  const [produk, setProduk] = useState<ProdukTempelan | null>(null);
  const [pesan, setPesan] = useState<string | null>(null);
  const [daftar, setDaftar] = useState<ProdukRingkas[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [editNama, setEditNama] = useState("");

  // Muat daftar produk tersimpan (untuk tombol Edit/Hapus/Simpan).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hidrasi localStorage harus setelah mount agar sama dengan SSR
    setDaftar(muatProduk());
  }, []);

  const simpanDaftar = (berikut: ProdukRingkas[]) => {
    simpanProduk(berikut);
    setDaftar(berikut);
  };

  const hapusSatu = (id: string) => {
    simpanDaftar(hapusProduk(daftar, id));
    setPesan("Produk dihapus dari daftar.");
  };

  const mulaiEdit = (p: ProdukRingkas) => {
    setEditId(p.id);
    setEditNama(p.nama_internal ?? p.nama ?? "");
  };

  const simpanEdit = (id: string) => {
    const nama = editNama.trim();
    if (nama === "") {
      setPesan("Nama internal tidak boleh kosong.");
      return;
    }
    simpanDaftar(perbaruiProduk(daftar, id, { nama_internal: nama.slice(0, 120) }));
    setEditId(null);
    setPesan("Perubahan disimpan.");
  };

  const baca = () => {
    setPesan(null);
    const hasil = uraiTempelan(teks);
    setProduk(hasil);
    if (!hasil.nama && hasil.harga === null) {
      setPesan("Tidak ada data yang bisa dibaca. Tempel nama produk dan harganya.");
    }
  };

  const ubah = (kunci: keyof ProdukTempelan, nilai: string) => {
    if (!produk) return;
    setProduk({
      ...produk,
      [kunci]:
        kunci === "harga" || kunci === "terjual" || kunci === "rating"
          ? nilai === ""
            ? null
            : Number(nilai.replace(/[.,](?=\d{3}\b)/g, "").replace(",", "."))
          : nilai,
    });
  };

  const rateNum = Math.min(100, Math.max(0, Number(rate.replace(",", ".")) || 0));
  const targetNum = Math.max(0, Number(target.replace(/[^0-9]/g, "")) || 0);
  const hasil = produk ? nilaiTempelan(produk, { ratePersen: rateNum, targetBulan: targetNum }) : null;

  const jadikanProduk = () => {
    if (!produk) return;
    const id = `tempel-${Date.now()}`;
    simpanProduk([
      ...muatProduk(),
      {
        id,
        nama_internal: produk.nama.slice(0, 120) || "Produk dari Shopee",
        nama: produk.nama,
        harga: produk.harga ?? 0,
        url_referensi: produk.link,
        deskripsi: `Data dari ${produk.marketplace || "marketplace"}${
          produk.terjual ? ` · ${produk.terjual} terjual` : ""
        }${produk.rating ? ` · rating ${produk.rating}` : ""}`,
        saved_at: new Date().toISOString(),
      },
    ]);
    setDaftar(muatProduk());
    setPesan("Produk disimpan ke daftar produk. Buka Buat Konten untuk membuat kontennya.");
  };

  return (
    <Card className="space-y-3">
      <div>
        <h2 className="text-isi font-semibold">Tempel cepat dari marketplace</h2>
        <p className="mt-1 text-meta text-muted-foreground">
          Salin nama, harga, jumlah terjual, rating, dan link dari halaman produk Shopee/Tokopedia/
          TikTok — tempel di sini. Tidak ada pengambilan data otomatis; isinya hanya teks Anda.
        </p>
      </div>

      <textarea
        value={teks}
        onChange={(e) => setTeks(e.target.value)}
        rows={4}
        className={inputClass}
        placeholder={"Baju Anak Lengan Panjang Katun Premium\nRp89.000\n2,3rb terjual · 4.8\nhttps://s.shopee.co.id/abc123"}
      />

      <div className="flex flex-wrap items-end gap-3">
        <label className="text-meta">
          <span className="block text-muted-foreground">Rate komisi (%)</span>
          <input value={rate} onChange={(e) => setRate(e.target.value)} className={`${inputClass} w-24`} />
        </label>
        <label className="text-meta">
          <span className="block text-muted-foreground">Target cuan / bulan (Rp)</span>
          <input value={target} onChange={(e) => setTarget(e.target.value)} className={`${inputClass} w-32`} />
        </label>
        <button type="button" className={tombolUtama} onClick={baca} disabled={teks.trim() === ""}>
          Baca data
        </button>
      </div>

      {produk && hasil ? (
        <div className="space-y-3 border-t border-surface-border pt-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="text-meta">
              <span className="block text-muted-foreground">Nama produk</span>
              <input value={produk.nama} onChange={(e) => ubah("nama", e.target.value)} className={inputClass} />
            </label>
            <label className="text-meta">
              <span className="block text-muted-foreground">Link (afiliasi)</span>
              <input value={produk.link} onChange={(e) => ubah("link", e.target.value)} className={inputClass} />
            </label>
            <label className="text-meta">
              <span className="block text-muted-foreground">Harga (Rp)</span>
              <input
                value={produk.harga ?? ""}
                onChange={(e) => ubah("harga", e.target.value)}
                className={inputClass}
                inputMode="numeric"
              />
            </label>
            <label className="text-meta">
              <span className="block text-muted-foreground">Terjual</span>
              <input
                value={produk.terjual ?? ""}
                onChange={(e) => ubah("terjual", e.target.value)}
                className={inputClass}
                inputMode="numeric"
              />
            </label>
            <label className="text-meta">
              <span className="block text-muted-foreground">Rating (0-5)</span>
              <input
                value={produk.rating ?? ""}
                onChange={(e) => ubah("rating", e.target.value)}
                className={inputClass}
                inputMode="decimal"
              />
            </label>
            <p className="text-meta text-muted-foreground sm:self-end">
              Marketplace: {produk.marketplace || "belum terdeteksi"}
            </p>
          </div>

          <div className="border border-surface-border p-3">
            <p className="text-badan font-medium">
              Skor otomatis: {hasil.total}/{hasil.maks}{" "}
              <span className={hasil.layak ? "text-status-ready" : "text-muted-foreground"}>
                {hasil.layak ? "· layak dikerjakan" : "· belum layak"}
              </span>
            </p>
            <ul className="mt-2 space-y-1 text-meta text-muted-foreground">
              {hasil.pilar.map((p) => (
                <li key={p.nama}>
                  • {p.nama} {p.nilai}/{p.maks} — {p.alasan}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-meta">
              Komisi ±{formatRupiah(hasil.komisiPerPenjualan)} per penjualan
              {hasil.penjualanUntukTarget !== null
                ? ` · butuh ±${hasil.penjualanUntukTarget} penjualan/bulan untuk target ${formatRupiah(targetNum)}`
                : ""}
            </p>
            <p className="mt-1 text-meta text-muted-foreground">
              Pilar kompetisi & kemudahan konten tidak dihitung di sini — nilai saat analisis AI.
            </p>
          </div>

          {hasil.catatan.length > 0 ? (
            <ul className="text-meta text-muted-foreground">
              {hasil.catatan.map((c) => (
                <li key={c}>• {c}</li>
              ))}
            </ul>
          ) : null}

          <button type="button" className={tombolUtama} onClick={jadikanProduk}>
            Jadikan produk
          </button>
        </div>
      ) : null}

      {pesan ? (
        <p className="text-meta text-status-ready" role="status">
          {pesan}
        </p>
      ) : null}

      {daftar.length > 0 ? (
        <div className="space-y-2 border-t border-surface-border pt-3">
          <h3 className="text-badan font-semibold">Produk tersimpan ({daftar.length})</h3>
          {daftar.map((p) => (
            <div key={p.id} className="border border-surface-border p-2">
              {editId === p.id ? (
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    value={editNama}
                    onChange={(e) => setEditNama(e.target.value)}
                    className={`${inputClass} flex-1`}
                    placeholder="Nama internal produk"
                  />
                  <button type="button" className={tombolUtama} onClick={() => simpanEdit(p.id)}>
                    Simpan
                  </button>
                  <button type="button" className={tombol} onClick={() => setEditId(null)}>
                    Batal
                  </button>
                </div>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-badan">
                    {p.nama_internal ?? p.nama ?? "(tanpa nama)"}
                  </p>
                  <div className="flex gap-2">
                    <button type="button" className={tombol} onClick={() => mulaiEdit(p)}>
                      Edit
                    </button>
                    <button type="button" className={tombol} onClick={() => hapusSatu(p.id)}>
                      Hapus
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : null}
    </Card>
  );
}
