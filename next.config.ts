import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/storage/**',
      }
    ]
  },
  experimental: {
    serverActions: {
      allowedOrigins: ["lvh.me", "*.lvh.me", "localhost:3000"]
    }
  }
};

export default nextConfig;
