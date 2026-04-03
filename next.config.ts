import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // standalone output for Docker/VPS — set STANDALONE=true in env
  // Vercel ignores this and uses its own build pipeline
  ...(process.env.STANDALONE === "true" ? { output: "standalone" as const } : {}),
  serverExternalPackages: ["prisma", "@prisma/engines", "@prisma/client"],
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cdn.pixabay.com" },
      { protocol: "https", hostname: "*.r2.cloudflarestorage.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
};

export default nextConfig;
