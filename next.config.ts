import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdf-parse", "tesseract.js"],
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
    middlewareClientMaxBodySize: "10mb",
  },
};

export default nextConfig;
