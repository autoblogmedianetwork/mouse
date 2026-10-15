/**
 * Threads status validator — hard limit of 500 characters (AGENTS rule 7).
 * The same limit is enforced by the DB constraint on threads_statuses.teks
 * (supabase/migrations/0001_init.sql), so this is defense layer one of two.
 */

export const MAX_STATUS_LENGTH = 500;

/** Count code points, matching Postgres char_length semantics. */
export function charLength(text: string): number {
  return [...text].length;
}

export interface StatusValidation {
  ok: boolean;
  /** Human-readable reason in Indonesian when ok === false. */
  error?: string;
  length: number;
}

/**
 * Validate a single status. `batas` defaults to the Threads limit; callers
 * targeting X pass 280 (fitur 9, `batasKarakterMode`).
 */
export function validateStatus(text: string, batas: number = MAX_STATUS_LENGTH): StatusValidation {
  const length = charLength(text);
  if (text.trim().length === 0) {
    return { ok: false, error: "Status kosong", length };
  }
  if (length > batas) {
    return {
      ok: false,
      error: `Melebihi ${batas} karakter (${length})`,
      length,
    };
  }
  return { ok: true, length };
}

export interface StatusListValidation {
  ok: boolean;
  /** Indexes of statuses that failed validation. */
  invalidIndexes: number[];
  errors: Array<{ index: number; error: string }>;
}

/** Validate a whole thread (ordered list of statuses). */
export function validateStatusList(
  texts: string[],
  batas: number = MAX_STATUS_LENGTH,
): StatusListValidation {
  const errors: Array<{ index: number; error: string }> = [];
  texts.forEach((text, index) => {
    const result = validateStatus(text, batas);
    if (!result.ok) {
      errors.push({ index, error: result.error ?? "Tidak valid" });
    }
  });
  return {
    ok: errors.length === 0,
    invalidIndexes: errors.map((e) => e.index),
    errors,
  };
}
