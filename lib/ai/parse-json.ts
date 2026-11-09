/**
 * Tolerant JSON parser for model output (PRD 10.3: parse JSON, retry once).
 * The model is prompted to answer with bare JSON, but providers occasionally wrap
 * the payload in markdown fences or add a short preamble — both are stripped
 * here before parsing. Raw output is never shown to the user.
 */
export function parseModelJson(text: string): unknown {
  let trimmed = text.trim();

  // Strip ```json ... ``` fences (whole-string match only).
  const fence = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fence?.[1]) {
    trimmed = fence[1].trim();
  }

  // Direct parse first: a clean payload must never be touched, because slicing
  // on the last } or ] would corrupt values that contain those characters.
  try {
    return JSON.parse(trimmed);
  } catch {
    // Fall through to slicing below.
  }

  // If there is surrounding prose (preamble before the first { or [, or a
  // postamble after the last } or ]), slice the payload out. This also covers
  // output that STARTS with { but trails commentary after the closing brace.
  const firstObj = trimmed.indexOf("{");
  const firstArr = trimmed.indexOf("[");
  const first = [firstObj, firstArr].filter((i) => i >= 0).sort((a, b) => a - b)[0];
  const lastObj = trimmed.lastIndexOf("}");
  const lastArr = trimmed.lastIndexOf("]");
  const last = Math.max(lastObj, lastArr);
  if (first === undefined || last <= first) {
    throw new Error("Output AI tidak mengandung JSON.");
  }

  return JSON.parse(trimmed.slice(first, last + 1));
}
