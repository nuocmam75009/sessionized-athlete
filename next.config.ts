import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Produit .next/standalone : un serveur Node minimal avec les seules
  // dépendances tracées, base de l'image Docker (voir Dockerfile). `next start`
  // continue de fonctionner comme avant.
  output: 'standalone',
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
