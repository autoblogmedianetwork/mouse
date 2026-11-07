import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * Golden set only. Kept apart from `vitest.config.ts` on purpose: a golden run
 * spends AI credits, so it must never be collected by `npm test`. Entry point
 * is `npm run test:golden` (scripts/test-golden.mjs), which also loads
 * `.env.local` the same way Next does.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["golden/**/*.golden.test.ts"],
    // Ten products x three prompts, each with its own retries.
    testTimeout: 900_000,
    fileParallelism: false,
    reporters: ["verbose"],
  },
});
