import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Next's own guidance for Mantine: import only the components used, not the whole barrel.
    optimizePackageImports: ["@mantine/core", "@mantine/hooks"],
  },
};

export default nextConfig;
