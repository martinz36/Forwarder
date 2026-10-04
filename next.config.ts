import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // El código del sistema anterior queda solo como referencia.
  outputFileTracingExcludes: { "*": ["legacy/**"] },
};

export default nextConfig;
