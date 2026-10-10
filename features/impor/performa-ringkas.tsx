/**
 * Tampilan ringkasan performa affiliate, dipakai Dashboard dan halaman
 * Analitik supaya angka yang dilihat selalu berasal dari perhitungan yang sama.
 */
import { StatCard } from "@/components/stat-card";
import { MARKETPLACE_LABEL } from "@/lib/impor/marketplace";
import { formatAngka, formatRupiah } from "@/lib/impor/normalisasi";
import type { RingkasanPerforma } from "@/lib/impor/performa";

function Bar({ nilai, maks, kelas = "bg-primary" }: { nilai: number; maks: number; kelas?: string }) {
  const lebar = maks > 0 ? Math.max(2, Math.round((Math.abs(nilai) / maks) * 100)) : 0;
  return (
    <div className="h-2 w-full rounded-full bg-muted">
      <div className={`h-2 rounded-full ${kelas}`} style={{ width: `${lebar}%` }} />
    </div>
  );
}

/**
 * Catatan kartu "Total komisi": dipisah antara baris pesanan dan baris klik
 * supaya angka baris tidak terbaca sebagai jumlah pesanan. Konversi hanya
 * ditampilkan bila ada klik, karena tanpa klik angkanya tidak bermakna.
 */
function catatanBaris(ringkas: RingkasanPerforma): string {
  const bagian = [
    `${formatAngka(ringkas.baris_penjualan)} baris pesanan`,
    `${formatAngka(ringkas.pesanan)} pesanan`,
  ];
  if (ringkas.pesanan_batal > 0) bagian.push(`${formatAngka(ringkas.pesanan_batal)} batal`);
  if (ringkas.klik > 0) bagian.push(`konversi ${ringkas.konversi.toFixed(1)}%`);
  return bagian.join(" · ");
}

function KartuPerforma({ ringkas }: { ringkas: RingkasanPerforma }) {
  return (
    // grid-cols-1 eksplisit: tanpa itu track `auto` melebar mengikuti konten
    // terpanjang dan membuat halaman bisa di-scroll horizontal di layar sempit.
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        label="Total komisi"
        nilai={formatRupiah(ringkas.komisi)}
        catatan={catatanBaris(ringkas)}
      />
      <StatCard
        label="Komisi cair"
        nilai={formatRupiah(ringkas.komisi_selesai)}
        tone="siap"
        catatan={`Tertunda ${formatRupiah(ringkas.komisi_tertunda)} · batal ${formatRupiah(ringkas.komisi_batal)}`}
      />
      <StatCard
        label="GMV"
        nilai={formatRupiah(ringkas.gmv)}
        catatan={`Komisi efektif ${ringkas.persen_komisi.toFixed(2)}% dari GMV`}
      />
      <StatCard
        label="Produk unik"
        nilai={ringkas.produk}
        catatan={ringkas.awal ? `${ringkas.awal} → ${ringkas.akhir}` : "Tanpa kolom tanggal"}
      />
    </div>
  );
}

function DaftarMarketplace({ ringkas }: { ringkas: RingkasanPerforma }) {
  const maks = Math.max(...ringkas.per_marketplace.map((m) => Math.abs(m.komisi)), 1);
  return (
    <section className="rounded-xl border border-surface-border bg-surface p-4 sm:p-6">
      <h2 className="text-base font-semibold">Komisi per marketplace</h2>
      <ul className="mt-4 space-y-4">
        {ringkas.per_marketplace.map((m) => (
          <li key={m.marketplace} className="space-y-1.5">
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="font-medium">{MARKETPLACE_LABEL[m.marketplace]}</span>
              <span className="tabular-nums text-muted-foreground">
                {formatRupiah(m.komisi)} · {formatAngka(m.pesanan)} pesanan
              </span>
            </div>
            <Bar nilai={m.komisi} maks={maks} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function DaftarProduk({ ringkas, jumlah = 5 }: { ringkas: RingkasanPerforma; jumlah?: number }) {
  const maks = Math.max(...ringkas.teratas.map((p) => Math.abs(p.komisi)), 1);
  return (
    <section className="rounded-xl border border-surface-border bg-surface p-4 sm:p-6">
      <h2 className="text-base font-semibold">Produk paling menghasilkan</h2>
      {ringkas.teratas.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">Belum ada nama produk yang terbaca.</p>
      ) : (
        <ul className="mt-4 space-y-4">
          {ringkas.teratas.slice(0, jumlah).map((p) => (
            <li key={`${p.produk}-${p.marketplace}`} className="space-y-1.5">
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="min-w-0 truncate font-medium">{p.produk}</span>
                <span className="shrink-0 tabular-nums text-muted-foreground">
                  {formatRupiah(p.komisi)}
                </span>
              </div>
              <Bar nilai={p.komisi} maks={maks} />
              <p className="text-xs text-muted-foreground">
                {MARKETPLACE_LABEL[p.marketplace]} · GMV {formatRupiah(p.gmv)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function DaftarBulanan({ ringkas }: { ringkas: RingkasanPerforma }) {
  const maks = Math.max(...ringkas.bulanan.map((b) => Math.abs(b.komisi)), 1);
  return (
    <section className="rounded-xl border border-surface-border bg-surface p-4 sm:p-6">
      <h2 className="text-base font-semibold">Tren komisi per bulan</h2>
      {ringkas.bulanan.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">
          Kolom tanggal tidak terbaca, jadi tren bulanan belum bisa dihitung.
        </p>
      ) : (
        <div className="mt-5 flex items-end gap-3">
          {ringkas.bulanan.map((b) => (
            <div key={b.bulan} className="flex min-w-0 flex-1 flex-col items-center gap-2">
              <span className="text-[11px] tabular-nums text-muted-foreground">
                {formatAngka(Math.round(b.komisi / 1000))}rb
              </span>
              <div
                className="w-full rounded-t-md bg-primary"
                style={{ height: `${Math.max(6, Math.round((Math.abs(b.komisi) / maks) * 120))}px` }}
                title={`${b.label}: ${formatRupiah(b.komisi)}`}
              />
              <span className="text-xs text-muted-foreground">{b.label}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

/** Ringkasan lengkap untuk halaman Analitik. */
export function PerformaLengkap({ ringkas }: { ringkas: RingkasanPerforma }) {
  return (
    <div className="space-y-6">
      <KartuPerforma ringkas={ringkas} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <DaftarMarketplace ringkas={ringkas} />
        <DaftarBulanan ringkas={ringkas} />
      </div>
      <DaftarProduk ringkas={ringkas} jumlah={10} />
    </div>
  );
}

/** Versi ringkas untuk kartu di Dashboard. */
export function PerformaRingkas({ ringkas }: { ringkas: RingkasanPerforma }) {
  return (
    <div className="space-y-6">
      <KartuPerforma ringkas={ringkas} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <DaftarMarketplace ringkas={ringkas} />
        <DaftarProduk ringkas={ringkas} />
      </div>
    </div>
  );
}
