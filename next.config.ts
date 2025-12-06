import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Skip static optimization for error pages
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;
