import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Keep Turbopack from picking up package-lock.json in a parent directory
    // (the workspace lives under a path with spaces).
    root: import.meta.dirname,
    // Tailwind CSS v4 must be registered in the Turbopack CSS pipeline by hand.
    // Without this rule Tailwind is dropped from production builds (only the
    // next/font @font-face rules survive), so the deployed site ships unstyled
    // while `next dev` keeps looking fine. Verified against
    // node_modules/@tailwindcss/turbopack/README.md.
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
