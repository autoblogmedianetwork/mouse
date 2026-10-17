"use client";

import { useEffect, useState } from "react";
import {
  isHyperFramesAvailable,
  kirimRenderHyperFrames,
  susunScenesDariStatuses,
} from "@/lib/media/hyperframes";

interface TombolRenderVideoProps {
  statuses: string[];
  produkNama?: string;
  fotoUrl?: string;
}

export function TombolRenderVideo({
  statuses,
  produkNama = "Produk Affiliate",
  fotoUrl,
}: TombolRenderVideoProps) {
  const [tersedia, setTersedia] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [pesan, setPesan] = useState<string | null>(null);

  // Periksa apakah port 7002 aktif
  useEffect(() => {
    let aktif = true;
    async function cekService() {
      const res = await isHyperFramesAvailable();
      if (aktif) setTersedia(res);
    }
    cekService();
    // Cek ulang setiap 8 detik jika sebelumnya mati
    const interval = setInterval(cekService, 8000);
    return () => {
      aktif = false;
      clearInterval(interval);
    };
  }, []);

  const handleRender = async () => {
    if (loading) return;
    setLoading(true);
    setPesan(null);

    const scenes = susunScenesDariStatuses(statuses, fotoUrl);
    const hasil = await kirimRenderHyperFrames({
      judul: `Video - ${produkNama}`,
      produkNama,
      fotoUrl,
      rasio: "9:16",
      scenes,
    });

    setLoading(false);
    if (hasil.ok && hasil.videoUrl) {
      window.open(hasil.videoUrl, "_blank", "noopener,noreferrer");
      setPesan("Video siap diputar dan diunduh di tab baru!");
    } else {
      setPesan(hasil.error || "Gagal menghubungi service render.");
    }
  };

  return (
    <div className="mt-4 rounded-xl border border-surface-border bg-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <span>Video Motion Template (HyperFrames)</span>
            <span
              className={`inline-block h-2 w-2 rounded-full ${
                tersedia ? "bg-green-500" : "bg-amber-500"
              }`}
            />
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {tersedia
              ? "Service lokal port 7002 aktif. Siap render video 9:16 (TikTok/Reels/Shorts)."
              : "Service lokal belum aktif. Jalankan `npm run media:video` di terminal untuk render langsung."}
          </p>
        </div>

        <button
          type="button"
          onClick={handleRender}
          disabled={!tersedia || loading || statuses.length === 0}
          className={`h-9 px-4 rounded-lg text-sm font-medium transition-colors ${
            tersedia
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "bg-muted text-muted-foreground cursor-not-allowed opacity-60"
          }`}
        >
          {loading ? "Memproses video…" : "Render Video 9:16"}
        </button>
      </div>

      {pesan ? (
        <p className="mt-2 text-xs font-medium text-primary">{pesan}</p>
      ) : null}
    </div>
  );
}
