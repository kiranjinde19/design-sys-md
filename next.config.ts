import { execSync } from "node:child_process";
import type { NextConfig } from "next";

/** The commit this build was made from: Vercel provides it, locally it is read from git. */
function buildCommit(): string {
  const fromVercel = process.env.VERCEL_GIT_COMMIT_SHA;
  if (fromVercel) return fromVercel.slice(0, 7);
  try {
    return execSync("git rev-parse --short HEAD", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
  } catch {
    return "unknown";
  }
}

const nextConfig: NextConfig = {
  // Stamped into the debug pages, so you can tell which deployment you are looking at.
  env: {
    NEXT_PUBLIC_BUILD_COMMIT: buildCommit(),
    NEXT_PUBLIC_BUILD_TIME: new Date().toISOString(),
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
