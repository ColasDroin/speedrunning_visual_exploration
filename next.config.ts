import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true, // Disable default image optimization
  },
  assetPrefix: process.env.NEXT_PUBLIC_BASE_PATH_ASSETS || "",
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || "",
  output: "export",
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
