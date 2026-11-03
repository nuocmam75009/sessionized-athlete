import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Produit .next/standalone : un serveur Node minimal avec les seules
  // dépendances tracées, base de l'image Docker (voir Dockerfile). `next start`
  // continue de fonctionner comme avant.
  // Désactivé sur Vercel (VERCEL=1 pendant le build) : la plateforme n'en a pas
  // besoin, et avec Next 16.3 l'adaptateur Vercel n'écrit plus
  // .next/next-server.js.nft.json, que l'étape standalone lit ensuite (ENOENT).
  output: process.env.VERCEL ? undefined : 'standalone',
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
