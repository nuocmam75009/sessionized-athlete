import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: '/plan', destination: '/dashboard', permanent: false },
      { source: '/activities', destination: '/dashboard', permanent: false },
    ];
  },
};

export default nextConfig;
