"use client";

import { useState } from "react";
import { Card } from "@/components/card";

export function NotifikasiProaktif() {
  const [izin, setIzin] = useState<NotificationPermission | "unsupported">(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
    return Notification.permission;
  });
  const [pesan, setPesan] = useState("Waktunya cek antrian konten.");
  const [menit, setMenit] = useState(30);
  const [terjadwal, setTerjadwal] = useState(false);


  const mintaIzin = async () => {
    if (!("Notification" in window)) return;
    const p = await Notification.requestPermission();
    setIzin(p);
  };

  const jadwalkan = () => {
    if (izin !== "granted") return;
    setTerjadwal(true);
    window.setTimeout(() => {
      new Notification("AutoThreads", { body: pesan });
      setTerjadwal(false);
    }, Math.max(1, menit) * 60 * 1000);
  };

  return (
    <Card>
      <h2 className="text-isi font-semibold">3k. Notifikasi proaktif (lokal)</h2>
      <p className="mt-1 text-badan text-muted-foreground">
        Pengingat di browser. Tidak mengirim data ke server.
      </p>
      {izin === "unsupported" ? (
        <p className="mt-2 text-meta text-muted-foreground">Browser tidak mendukung notifikasi.</p>
      ) : izin !== "granted" ? (
        <button type="button" onClick={mintaIzin} className="mt-3 border border-surface-border px-3 py-1.5 text-meta">
          Izinkan notifikasi
        </button>
      ) : (
        <div className="mt-3 space-y-2">
          <input value={pesan} onChange={(e) => setPesan(e.target.value)} className="w-full border border-surface-border bg-surface px-3 py-2 text-badan" />
          <input
            type="number"
            min={1}
            value={menit}
            onChange={(e) => setMenit(Number(e.target.value))}
            className="w-full border border-surface-border bg-surface px-3 py-2 text-badan"
          />
          <button type="button" onClick={jadwalkan} disabled={terjadwal} className="border border-surface-border px-3 py-1.5 text-meta disabled:opacity-50">
            {terjadwal ? "Terjadwal…" : "Jadwalkan pengingat"}
          </button>
        </div>
      )}
    </Card>
  );
}
