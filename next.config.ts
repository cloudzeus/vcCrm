import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Skip static generation to prevent prerender issues
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
};

export default nextConfig;