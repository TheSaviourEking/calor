import type { NextConfig } from "next";

// R2 custom/public domain, when configured
function r2PublicPatterns() {
  const raw = process.env.R2_PUBLIC_URL;
  if (!raw) return [];
  try {
    return [{ protocol: "https" as const, hostname: new URL(raw).hostname }];
  } catch {
    return [];
  }
}

const nextConfig: NextConfig = {
  // standalone output for Docker/VPS — set STANDALONE=true in env
  // Vercel ignores this and uses its own build pipeline
  ...(process.env.STANDALONE === "true" ? { output: "standalone" as const } : {}),
  serverExternalPackages: ["prisma", "@prisma/engines", "@prisma/client"],
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cdn.pixabay.com" },
      // Default R2 bucket URL
      { protocol: "https", hostname: "*.r2.cloudflarestorage.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "*.r2.dev" },
      ...r2PublicPatterns(),
    ],
  },
  async rewrites() {
    return [
      {
        source: '/images/products/:slug*.jpg',
        destination: '/images/products/:slug*.png',
      },
    ];
  },
};

export default nextConfig;
