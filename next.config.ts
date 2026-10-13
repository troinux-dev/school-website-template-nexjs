import type { NextConfig } from "next";

function hostOf(url: string | undefined) {
  try {
    return url ? new URL(url).hostname : undefined;
  } catch {
    return undefined; // placeholder like https://<project-ref>.supabase.co — ignore it
  }
}
const supabaseHost = hostOf(process.env.NEXT_PUBLIC_SUPABASE_URL);

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
