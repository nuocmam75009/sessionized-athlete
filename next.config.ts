import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: '/plan', destination: '/dashboard', permanent: false },
      { source: '/activities', destination: '/dashboard', permanent: false },
      // Chat retiré du périmètre : les anciens liens /messages ne finissent pas en 404.
      { source: '/messages/:path*', destination: '/dashboard', permanent: false },
    ];
  },
};

export default nextConfig;
