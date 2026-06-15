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
      // Default R2 bucket URL
      { protocol: "https", hostname: "*.r2.cloudflarestorage.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      // TODO: Add your R2 custom domain here at deploy time, e.g.:
      // { protocol: "https", hostname: "assets.yourdomain.com" },
    ],
  },
};

export default nextConfig;
