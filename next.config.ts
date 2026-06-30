import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'https',
        hostname: '*.rmutsv.ac.th',
      },
      {
        protocol: 'http',
        hostname: '*.rmutsv.ac.th',
      },
    ],
  },
};

export default nextConfig;
