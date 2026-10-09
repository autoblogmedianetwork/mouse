/**
 * Description cleaner per PRD-AutoThreads.md section 10.1.
 * Descriptions copied from Shopee listings must be cleaned before they
 * are sent to the AI prompt:
 * - remove links
 * - remove hashtag spam
 * - remove excessive emoji
 * - remove repeated text
 * - truncate to a maximum of 3000 characters
 */

export const MAX_CLEAN_DESCRIPTION_LENGTH = 3000;

/** Maximum consecutive emoji kept before the rest of the run is dropped. */
const MAX_CONSECUTIVE_EMOJI = 2;

const EMOJI_PATTERN = /\p{Extended_Pictographic}/u;

/** Count code points, matching Postgres char_length semantics. */
export function charLength(text: string): number {
  return [...text].length;
}

function removeLinks(text: string): string {
  return text
    // http(s) links, including shopee short links
    .replace(/https?:\/\/\S+/gi, "")
    // bare www links
    .replace(/\bwww\.\S+/gi, "");
}

function removeHashtags(text: string): string {
  // Hashtag spam: any #tag including unicode letters/numbers/underscore
  return text.replace(/#[\p{L}\p{N}_]+/gu, "");
}

/** Keep at most MAX_CONSECUTIVE_EMOJI emoji in any consecutive run. */
function collapseEmojiRuns(text: string): string {
  const out: string[] = [];
  let runCount = 0;
  for (const ch of text) {
    if (EMOJI_PATTERN.test(ch)) {
      runCount += 1;
      if (runCount <= MAX_CONSECUTIVE_EMOJI) out.push(ch);
    } else {
      runCount = 0;
      out.push(ch);
    }
  }
  return out.join("");
}

/**
 * Clean a raw product description copied from a Shopee listing.
 * The result is idempotent: cleaning an already-cleaned description
 * returns the same string.
 */
export function cleanDescription(raw: string): string {
  let text = raw ?? "";

  // 0. Normalize line endings
  text = text.replace(/\r\n?/g, "\n");

  // 1. Remove links (http/https/www)
  text = removeLinks(text);

  // 2. Remove hashtag spam
  text = removeHashtags(text);

  // 3. Collapse excessive emoji runs (3+ in a row become 2)
  text = collapseEmojiRuns(text);

  // 4. Remove repeated lines (case-insensitive, trimmed; keep first)
  const seenLines = new Set<string>();
  text = text
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trimEnd())
    .filter((line) => {
      const key = line.trim().toLowerCase();
      if (key === "") return true; // blank lines handled below
      if (seenLines.has(key)) return false;
      seenLines.add(key);
      return true;
    })
    .join("\n");

  // 5. Collapse 3+ consecutive blank lines into one blank line
  text = text.replace(/\n{3,}/g, "\n\n");

  // 6. Trim outer whitespace
  text = text.trim();

  // 7. Truncate to the hard limit at a word boundary
  if (charLength(text) > MAX_CLEAN_DESCRIPTION_LENGTH) {
    let truncated = [...text].slice(0, MAX_CLEAN_DESCRIPTION_LENGTH).join("");
    // Cut back to the last space to avoid breaking a word mid-token
    const lastSpace = truncated.lastIndexOf(" ");
    if (lastSpace > MAX_CLEAN_DESCRIPTION_LENGTH - 40) {
      truncated = truncated.slice(0, lastSpace);
    }
    text = truncated.trimEnd();
  }

  return text;
}
