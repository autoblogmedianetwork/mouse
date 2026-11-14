/**
 * Pembungkus boilerplate route API (refactor R2).
 *
 * Sebelumnya 31 route menulis pola yang sama berulang: wajibSesi -> parse
 * JSON -> validasi Zod -> respons 400/401. Helper ini menyatukannya supaya
 * perbaikan error handling cukup di satu tempat.
 *
 * Kontrak yang dipertahankan:
 * - tanpa sesi  : respons sesi (401/503) diteruskan apa adanya
 * - body rusak  : 400 "Body bukan JSON valid."
 * - validasi gagal: 400 dengan pesan issue pertama atau "Input tidak valid."
 */
import { NextResponse } from "next/server";
import { wajibSesi } from "@/lib/supabase/server";

type Sesi = Awaited<ReturnType<typeof wajibSesi>>;
type SesiSah = Extract<Sesi, { user: unknown }>;

type HasilSiap<T> =
  | { ok: true; sesi: SesiSah; data: T }
  | { ok: false; respons: NextResponse };

/** Skema minimal yang dipakai helper (cukup safeParse, tanpa impor zod). */
type Skema<T> = { safeParse: (nilai: unknown) => { success: boolean; data?: T; error?: { issues: Array<{ message?: string }> } } };

/**
 * Siapkan request POST: sesi + body JSON tervalidasi skema.
 * Bila gagal, kembalikan respons siap kirim dan route tinggal melemparkannya.
 */
export async function siapkanBody<T>(
  req: Request,
  skema: Skema<T>,
): Promise<HasilSiap<T>> {
  const sesi = await wajibSesi();
  if ("respons" in sesi) return { ok: false, respons: sesi.respons };

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return {
      ok: false,
      respons: NextResponse.json(
        { ok: false, error: "Body bukan JSON valid." },
        { status: 400 },
      ),
    };
  }

  const parsed = skema.safeParse(body);
  if (!parsed.success) {
    return {
      ok: false,
      respons: NextResponse.json(
        { ok: false, error: parsed.error?.issues[0]?.message ?? "Input tidak valid." },
        { status: 400 },
      ),
    };
  }

  return { ok: true, sesi, data: parsed.data as T };
}
