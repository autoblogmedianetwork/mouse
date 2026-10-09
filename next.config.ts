import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Keep Turbopack from picking up package-lock.json in a parent directory
    // (the workspace lives under a path with spaces).
    root: import.meta.dirname,
  },
};

export default nextConfig;
