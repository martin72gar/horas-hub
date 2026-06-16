import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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

