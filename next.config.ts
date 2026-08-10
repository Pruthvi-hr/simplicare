import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors in older AI-generated files.
    ignoreBuildErrors: true,
  },
  eslint: {
    // Allow production builds to successfully complete even with lint errors.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
