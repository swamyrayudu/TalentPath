import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    // Optimize client-side routing and reduce unnecessary fetches
    optimizePackageImports: ['next-auth'],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Exclude Node.js modules from client bundle
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        perf_hooks: false,
        stream: false,
        os: false,
        path: false,
        http: false,
        https: false,
        buffer: false,
      };
    }
    return config;
  },
};

export default nextConfig;
