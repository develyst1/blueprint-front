// The required-content check as a test (TASK-B-007 DoD 5): runs scripts/check-required.ts against this checkout's
// server and expects 0 failures. Needs the same in-memory back end and server the script needs (see its header).
import { spawnSync } from "node:child_process";
import { expect, test } from "@playwright/test";

test("every required item is visible on every page × every registered theme (+ default)", () => {
  test.setTimeout(10 * 60_000);
  // the server Playwright just started for this run (playwright.config.ts)
  const base = `http://127.0.0.1:${process.env.PLAYWRIGHT_PORT || 3100}`;
  const r = spawnSync("bun", ["run", "scripts/check-required.ts"], { encoding: "utf8", env: { ...process.env, CHECK_BASE_URL: base } });
  console.log(r.stdout, r.stderr);
  expect(r.stdout).toMatch(/, 0 failures$/m);
  // a run that looked at nothing is not a pass (TASK-B-027): the count must be real
  const checked = Number(/checked (\d+) items/.exec(r.stdout)?.[1] ?? 0);
  expect(checked, "items checked").toBeGreaterThan(0);
  expect(r.status).toBe(0);
});
