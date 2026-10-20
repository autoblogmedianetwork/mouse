/**
 * Calendar helpers (Fase 6, UI-Spec 3.4): grouped scheduled content per week
 * and month. Pure functions over the content list, like the rest of lib/konten
 * — no storage, no Supabase, fully unit-testable.
 */
import type { Konten } from "./skema";

/** ISO date key (local time) for grouping, e.g. 2026-10-15. */
function kunciHari(tgl: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${tgl.getFullYear()}-${pad(tgl.getMonth() + 1)}-${pad(tgl.getDate())}`;
}

const HARI_LABEL = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"] as const;

export interface HariMinggu {
  /** Grouping key, same convention as kunciHari. */
  kunci: string;
  /** 0..6, Monday = 0 (Indonesian week starts Monday). */
  urutan: number;
  label: string;
  hariIni: boolean;
}

/** Start of the week containing `now`: Monday 00:00 local. */
export function mulaiMinggu(now = new Date()): Date {
  const d = new Date(now);
  const geser = (d.getDay() + 6) % 7; // Sun(0) -> 6.days back, Mon(1) -> 0
  d.setDate(d.getDate() - geser);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * The seven cards of the week view (UI-Spec 3.4), Monday..Sunday.
 *
 * When `mulai` is omitted it is derived from `now` itself, never from the real
 * today: a default parameter cannot see `now`, so calling `hariMinggu(undefined,
 * NOW)` must not silently build the week of the machine's current date.
 */
export function hariMinggu(mulai?: Date, now = new Date()): HariMinggu[] {
  const basis = mulai ?? mulaiMinggu(now);
  const kunciHariIni = kunciHari(now);
  const hasil: HariMinggu[] = [];
  for (let i = 0; i < 7; i += 1) {
    const d = new Date(basis);
    d.setDate(d.getDate() + i);
    const kunci = kunciHari(d);
    const labelBulan = d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
    hasil.push({
      kunci,
      urutan: i,
      label: `${HARI_LABEL[i]}, ${labelBulan}`,
      hariIni: kunci === kunciHariIni,
    });
  }
  return hasil;
}

/** Only scheduled content, sorted by jadwal_at ascending. */
export function kontenTerjadwal(list: Konten[]): Konten[] {
  return list
    .filter((k) => k.status === "terjadwal" && k.jadwal_at && Number.isFinite(Date.parse(k.jadwal_at)))
    .sort((a, b) => Date.parse(a.jadwal_at ?? "") - Date.parse(b.jadwal_at ?? ""));
}

/** Scheduled content grouped by local ISO date key, only keys inside `hari`. */
export function kelompokkanPerHari(list: Konten[], hari: HariMinggu[]): Map<string, Konten[]> {
  const kunciTersedia = new Set(hari.map((h) => h.kunci));
  const hasil = new Map<string, Konten[]>();
  for (const k of kontenTerjadwal(list)) {
    const tgl = new Date(k.jadwal_at ?? "");
    const kunci = kunciHari(tgl);
    if (!kunciTersedia.has(kunci)) continue;
    const isi = hasil.get(kunci) ?? [];
    isi.push(k);
    hasil.set(kunci, isi);
  }
  return hasil;
}

/**
 * Move a schedule to another calendar day (UI-Spec 3.4: drag to reschedule),
 * keeping its local time-of-day so "jam posting" does not drift. Returns null
 * for broken input, matching the tolerant style of the other helpers.
 */
export function pindahKeHari(jadwalAt: string, hariKunci: string): string | null {
  const asal = new Date(jadwalAt);
  if (!Number.isFinite(asal.getTime())) return null;
  const cocok = /^(\d{4})-(\d{2})-(\d{2})$/.exec(hariKunci);
  if (!cocok) return null;
  const tahun = Number(cocok[1]);
  const bulan = Number(cocok[2]);
  const tanggal = Number(cocok[3]);
  if (bulan < 1 || bulan > 12 || tanggal < 1 || tanggal > 31) return null;
  const tujuan = new Date(asal);
  tujuan.setFullYear(tahun, bulan - 1, tanggal);
  // setFullYear menggeser tanggal yang tidak ada (31 Feb) ke bulan berikutnya.
  if (tujuan.getFullYear() !== tahun || tujuan.getMonth() !== bulan - 1 || tujuan.getDate() !== tanggal) {
    return null;
  }
  return tujuan.toISOString();
}

/** Full month list for the schedule table: scheduled content in `now`'s month. */
export function jadwalBulanIni(list: Konten[], now = new Date()): Konten[] {
  const y = now.getFullYear();
  const m = now.getMonth();
  return kontenTerjadwal(list).filter((k) => {
    const t = new Date(k.jadwal_at ?? "");
    return t.getFullYear() === y && t.getMonth() === m;
  });
}
