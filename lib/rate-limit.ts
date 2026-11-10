/**
 * Rate limiter in-memory (per instance) untuk rute yang membelanjakan kredit
 * atau bertindak atas nama pemilik. Tidak butuh dependency baru; cocok untuk
 * MVP. Pada deployment multi-instance, batasnya per-instance, bukan global.
 */
const buckets = new Map<string, { count: number; resetAt: number }>();

const MAX_BUCKETS = 10_000;

function bersihkan(now: number): void {
  if (buckets.size <= MAX_BUCKETS) return;
  for (const [k, v] of buckets) {
    if (v.resetAt <= now) buckets.delete(k);
  }
}

export interface HasilRateLimit {
  boleh: boolean;
  sisa: number;
  resetAt: number;
}

export function periksaRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): HasilRateLimit {
  const now = Date.now();
  bersihkan(now);

  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { boleh: true, sisa: limit - 1, resetAt: now + windowMs };
  }

  if (existing.count >= limit) {
    return { boleh: false, sisa: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  return { boleh: true, sisa: limit - existing.count, resetAt: existing.resetAt };
}