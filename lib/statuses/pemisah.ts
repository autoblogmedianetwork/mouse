/**
 * Automatic status splitter (UI-Spec 3.2 block 3: "Pemisah status otomatis
 * saat teks melebihi 500 karakter").
 *
 * Splits a long description into Threads statuses of at most 500 characters
 * each, preferring paragraph breaks, then sentence breaks, then word breaks.
 */

import { MAX_STATUS_LENGTH, charLength } from "./validator-500";

/** Greedily pack pieces into statuses of at most MAX_STATUS_LENGTH. */
function pack(pieces: string[], separator: string): string[] {
  const statuses: string[] = [];
  let current = "";

  for (const piece of pieces) {
    if (piece === "") continue;
    const candidate = current === "" ? piece : current + separator + piece;
    if (charLength(candidate) <= MAX_STATUS_LENGTH) {
      current = candidate;
    } else {
      if (current !== "") statuses.push(current);
      current = piece;
    }
  }
  if (current !== "") statuses.push(current);

  // A single piece can still exceed the limit (e.g. one huge sentence
  // without spaces): hard-split it at word boundaries or code points.
  return statuses.flatMap((status) =>
    charLength(status) <= MAX_STATUS_LENGTH ? [status] : hardSplit(status)
  );
}

/** Last-resort split for text that cannot fit in one status. */
function hardSplit(text: string): string[] {
  const chars = [...text];
  const chunks: string[] = [];
  let start = 0;
  while (start < chars.length) {
    // Do not start a chunk on a space left behind by the previous cut.
    while (start < chars.length && chars[start] === " ") start += 1;
    if (start >= chars.length) break;

    let end = Math.min(start + MAX_STATUS_LENGTH, chars.length);
    if (end < chars.length) {
      // Prefer breaking at the last space within the window.
      const window = chars.slice(start, end).join("");
      const lastSpace = window.lastIndexOf(" ");
      if (lastSpace > MAX_STATUS_LENGTH - 40) {
        end = start + lastSpace;
      }
    }
    chunks.push(chars.slice(start, end).join("").trimEnd());
    start = end;
  }
  return chunks.filter((chunk) => chunk.length > 0);
}

/**
 * Split a long text into Threads statuses of at most 500 characters.
 * Text already within the limit is returned as a single status.
 */
export function splitIntoStatuses(text: string): string[] {
  const trimmed = text.trim();
  if (trimmed === "") return [];

  if (charLength(trimmed) <= MAX_STATUS_LENGTH) {
    return [trimmed];
  }

  // Choose the finest granularity that still gives us multiple pieces:
  // paragraphs first, then sentences, then words. Packing happens after.
  let pieces: string[];
  let separator: string;

  const paragraphs = trimmed
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p !== "");

  if (paragraphs.length > 1) {
    pieces = paragraphs;
    separator = "\n\n";
  } else {
    const sentences = paragraphs[0]
      .split(/(?<=[.!?…])\s+/)
      .map((s) => s.trim())
      .filter((s) => s !== "");
    if (sentences.length > 1) {
      pieces = sentences;
      separator = " ";
    } else {
      pieces = paragraphs[0].split(/\s+/).filter((w) => w !== "");
      separator = " ";
    }
  }

  return pack(pieces, separator);
}
