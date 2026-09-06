import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Bundel minimal untuk image Docker: .next/standalone + node server.js.
  // Dimatikan di Cloudflare Pages karena next-on-pages butuh output default.
  output: process.env.CF_PAGES === "1" ? undefined : "standalone",
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

