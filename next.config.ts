import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // El código del sistema anterior queda solo como referencia.
  outputFileTracingExcludes: { "*": ["legacy/**"] },
  // El PDF se genera en el servidor con react-pdf (usa módulos de Node).
  serverExternalPackages: ["@react-pdf/renderer"],
  async redirects() {
    return [{ source: "/embarques/:path*", destination: "/expedientes/:path*", permanent: true }];
  },
};

export default nextConfig;
