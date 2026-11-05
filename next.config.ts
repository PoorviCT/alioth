import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: process.env.PREVIEW_URL ? [new URL(process.env.PREVIEW_URL).hostname] : [],
};

export default nextConfig;
