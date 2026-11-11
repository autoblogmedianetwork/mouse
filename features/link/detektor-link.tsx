"use client";

/**
 * Detektor link afiliasi (power-up Aset): tempel link -> cek kesehatan lokal.
 * Tanpa jaringan: marketplace dideteksi dari domain, tracking dari parameter.
 */
import { useMemo, useState } from "react";
import { Card } from "@/components/card";
import { deteksiLinkAfiliasi } from "@/lib/link/deteksi-link";

export function DetektorLink() {
  const [url, setUrl] = useState("");
  const hasil = useMemo(() => deteksiLinkAfiliasi(url), [url]);

  return (
    <Card>
      <h2 className="text-isi font-semibold">Detektor link afiliasi</h2>
      <p className="mt-1 text-badan text-muted-foreground">
        Tempel link untuk memeriksa: marketplace, parameter tracking, dan
        peringatan sebelum link dipakai di konten.
      </p>
      <input
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://s.shopee.co.id/...?sub_id=..."
        className="mt-3 w-full rounded-md border border-surface-border bg-background px-3 py-2 text-badan"
      />
      {url.trim() !== "" ? (
        <div className="mt-3 space-y-1 border-t border-surface-border pt-3 text-badan">
          {hasil.labelMarketplace ? (
            <p>
              Marketplace:{" "}
              <span className="font-medium text-foreground">{hasil.labelMarketplace}</span>
            </p>
          ) : null}
          {hasil.tracking.length > 0 ? (
            <p className="text-muted-foreground">
              Tracking terbaca:{" "}
              <span className="font-mono text-foreground">{hasil.tracking.join(", ")}</span>
            </p>
          ) : null}
          {hasil.masalah.map((m) => (
            <p key={m} className="text-destructive">
              ⚠ {m}
            </p>
          ))}
          {hasil.ok ? (
            <p className="font-medium text-green-600">✓ Link siap dipakai.</p>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}
