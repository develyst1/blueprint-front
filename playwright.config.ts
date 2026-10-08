import { defineConfig } from "@playwright/test";

// Runs against the production build: `bun run build` first, then the server below (or one already running).
export default defineConfig({
  testDir: "tests",
  reporter: [["list"]],
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:3100",
    viewport: { width: 1440, height: 900 },
    // The locally installed Google Chrome (Chromium) — no browser download needed.
    channel: "chrome",
  },
  webServer: {
    command: "bun run start",
    url: "http://127.0.0.1:3100/dev/isolation/none",
    reuseExistingServer: true,
    env: { BLUEPRINT_DEV_PAGES: "1" },
    timeout: 60_000,
  },
});
