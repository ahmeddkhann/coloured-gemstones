import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    agentFeedback: true,
  },
  // RAG markdown is read via fs at runtime — include it in the chat route trace.
  outputFileTracingIncludes: {
    "/api/chat": ["./content/rag/**/*"],
  },
  cacheComponents: true,
  // partialPrefetching was causing continuous / compiles + full page refetch
  // loops in local dev with the catalog Suspense boundary. Re-enable later.
  partialPrefetching: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
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
