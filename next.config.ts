import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Bundel minimal untuk image Docker: .next/standalone + node server.js.
  // Hanya aktif saat build image (DOCKER_BUILD=1 di Dockerfile). Di tempat lain
  // pakai output default Next, karena next-on-pages tidak bisa baca standalone.
  output: process.env.DOCKER_BUILD === "1" ? "standalone" : undefined,
  webpack: (config, { isServer, nextRuntime, webpack }) => {
    if (isServer && nextRuntime === "edge") {
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /^ws$/,
        })
      );
    }
    return config;
  },
  turbopack: {},
};

export default nextConfig;

