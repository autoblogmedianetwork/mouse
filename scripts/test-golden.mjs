#!/usr/bin/env node
/**
 * `npm run test:golden` — run the golden set through the rubric.
 *
 * Next.js loads `.env.local` on its own; a bare vitest process does not, and
 * the golden runner needs the same AI provider variables as the app. Both env
 * files are loaded here before vitest starts so nothing else has to know about
 * them.
 *
 * Usage:
 *   npm run test:golden              run prompts + checks + rubric gate
 *   npm run test:golden -- --dry-run check files and harness, no AI calls
 */
import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";

for (const berkas of [".env.local", ".env"]) {
  if (!existsSync(berkas)) continue;
  try {
    // Does not override variables already set in the shell.
    process.loadEnvFile(berkas);
  } catch {
    console.warn(`[golden] ${berkas} tidak bisa dibaca, dilewati.`);
  }
}

const argumen = process.argv.slice(2);
const dryRun = argumen.includes("--dry-run");
const diteruskan = argumen.filter((a) => a !== "--dry-run");

const hasil = spawnSync(
  process.execPath,
  ["node_modules/vitest/vitest.mjs", "run", "--config", "vitest.golden.config.ts", ...diteruskan],
  {
    stdio: "inherit",
    env: { ...process.env, GOLDEN_DRY_RUN: dryRun ? "1" : "" },
  },
);

process.exit(hasil.status ?? 1);
