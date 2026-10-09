import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Three teams' sessions share this checkout: each team builds into its own folder
  // (B: .next on :3100 · A: NEXT_DIST_DIR=.next-a on :3200 · C: NEXT_DIST_DIR=.next-c on :3300 — TASK-B-005, F-026).
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // Stops `next dev` writing AGENTS.md / CLAUDE.md at the repo root.
  agentRules: false,
  experimental: {
    // Next's own guidance for Mantine: import only the components used, not the whole barrel.
    optimizePackageImports: ["@mantine/core", "@mantine/hooks"],
    // The chat's file upload goes through a server action; match the back end's 20 MB limit (D-020; Next's default is 1 MB).
    serverActions: { bodySizeLimit: "20mb" },
  },
};

export default nextConfig;
