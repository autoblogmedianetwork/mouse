/**
 * One-off curation helper (run with plain Node, no dependencies).
 *
 * AWESOME ChatGPT Prompts datanya ±154 ribu baris dengan prompt bertanda kutip
 * yang bisa berisi koma, tanda kutip ganda, dan baris baru, jadi ini harus
 * diparse CSV yang sebenarnya, bukan dibaca baris demi baris.
 *
 * Usage: node scripts/kurasi-persona-prompt.mjs /path/to/prompts.csv
 * Prints acts (grouped by relevance) for manual review; writes nothing.
 */

import { readFileSync } from "node:fs";

const path = process.argv[2];
if (!path) {
  console.error("usage: node scripts/kurasi-persona-prompt.mjs <prompts.csv>");
  process.exit(1);
}

/** Minimal RFC-4180 parser: handles quotes, escaped quotes, CR/LF, records. */
export function parseCsv(text) {
  const rows = [];
  let field = "";
  let row = [];
  let inQuotes = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n") {
      row.push(field.replace(/\r$/, ""));
      if (row.some((c) => c.length > 0)) rows.push(row);
      row = [];
      field = "";
    } else {
      field += ch;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    if (row.some((c) => c.length > 0)) rows.push(row);
  }
  return rows;
}

const text = readFileSync(path, "utf8");
const rows = parseCsv(text);
const header = rows[0].map((h) => h.trim().toLowerCase());
const kolomAct = header.indexOf("act");

const relevan = new Map();
const hurufKecil = (s) => (s ?? "").toLowerCase();

/** Grouped by what the act could contribute to affiliate content. */
const kelompok = [
  ["cerita", /story|narrat|novelist|screenwriter|poet|comedian|humor/],
  ["copywriting", /copywrit|adorab|ad copy|tagline|slogan/],
  ["pemasaran", /advertis|market|brand|promo|sales|growing a following?/],
  ["sosial", /social|instagram|tiktok|twitter|youtube|hashtag|community/],
  ["konten", /content|influenc|blogger|blog |vlogging|podcast|curator|article|journalist|commentary|commentat/],
  ["produk", /product|review|personal shopper| ecommerce|shopping/],
  ["presentation", /presentation|speaker|coach|teacher|trainer/],
];

for (let i = 1; i < rows.length; i += 1) {
  const act = (rows[i][kolomAct] ?? "").trim();
  if (!act) continue;
  const a = hurufKecil(act);
  for (const [nama, pola] of kelompok) {
    if (pola.test(a)) {
      if (!relevan.has(act)) relevan.set(act, nama);
      break;
    }
  }
}

const byKelompok = {};
for (const [act, nama] of relevan) {
  (byKelompok[nama] ??= []).push(act);
}

for (const [nama, daftar] of Object.entries(byKelompok)) {
  console.log(`\n== ${nama} (${daftar.length}) ==`);
  for (const act of daftar) console.log(`- ${act}`);
}
console.log(`\nTotal akt relevan: ${relevan.size} dari ${rows.length - 1} baris.`);
