import type { NextConfig } from "next";

const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
      ...(supabaseHost ? [{ protocol: "https" as const, hostname: supabaseHost }] : []),
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "60mb",
      // GitHub Codespaces serves the app from *.app.github.dev behind a proxy.
      ...(process.env.CODESPACES ? { allowedOrigins: ["*.app.github.dev", "localhost:3000"] } : {}),
    },
  },
};

export default nextConfig;
