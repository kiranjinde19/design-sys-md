import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // One 404 page for the whole app (it has two root layouts, see src/app/global-not-found.tsx).
    globalNotFound: true,
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
