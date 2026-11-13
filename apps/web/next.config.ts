import type { NextConfig } from "next";

// Server-side address of the API (only Next.js uses it, the browser never sees it)
const API_URL = process.env.API_INTERNAL_URL ?? "http://localhost:3003";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "i.pravatar.cc" },
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "fastly.picsum.photos" },
      { protocol: "http", hostname: "localhost", port: "3003", pathname: "/media-files/**" },
    ],
    // The API serves uploaded media from localhost in development
    dangerouslyAllowLocalIP: process.env.NODE_ENV !== "production",
  },
  cacheComponents: true,
  async rewrites() {
    return [
      { source: "/api/v1/:path*", destination: `${API_URL}/api/v1/:path*` },
      { source: "/media-files/:path*", destination: `${API_URL}/media-files/:path*` },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
