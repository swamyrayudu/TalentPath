import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    // Optimize client-side routing and reduce unnecessary fetches
    optimizePackageImports: ['next-auth'],
  },
};

export default nextConfig;
