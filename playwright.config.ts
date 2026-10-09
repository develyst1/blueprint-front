import { defineConfig } from "@playwright/test";

// Runs against the production build: `bun run build` first, then the server below.
// Three teams share this checkout (TASK-B-005, F-026): the port and the output folder come from the env, and a
// server already on the port is never reused — it could be another team's.
const port = Number(process.env.PLAYWRIGHT_PORT || 3100);

export default defineConfig({
  testDir: "tests",
  outputDir: process.env.PLAYWRIGHT_OUTPUT || "test-results",
  reporter: [["list"]],
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    viewport: { width: 1440, height: 900 },
    // The locally installed Google Chrome (Chromium) — no browser download needed.
    channel: "chrome",
  },
  webServer: {
    command: `bun run start -- -p ${port}`,
    url: `http://127.0.0.1:${port}/dev/isolation/none`,
    reuseExistingServer: false,
    env: { BLUEPRINT_DEV_PAGES: "1" },
    timeout: 60_000,
  },
});
