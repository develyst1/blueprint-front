// Page states, retry, skip link and widths (TASK-B-007 DoD 4, 7, 8 — REQ-002 R7, AC-14…17).
//
// Run with `bun run test:states` after a build: the app is started pointing at http://127.0.0.1:4298, where nothing
// listens yet — so every page starts in the API-down state. This spec then starts its own in-memory back end on 4298
// (DATABASE_URL=pglite:memory, never SIT), creates the worked example in the default theme, and stops it at the end.
import { spawn, type ChildProcess } from "node:child_process";
import path from "node:path";
import { expect, test } from "@playwright/test";

const API = "http://127.0.0.1:4298"; // local only — never SIT
// tests/seed/seed.ts uses import.meta, which Playwright's loader cannot import; the same two calls, inline
async function call(method: string, route: string, body?: unknown) {
  const res = await fetch(API + route, { method, headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`${method} ${route} → ${res.status} ${await res.text()}`);
  return res.json();
}
const PAGES = ["overview", "work-order", "flowchart", "sequence", "screens", "api", "web", "stuck", "history"];
const API_DOWN = "ต่อระบบไม่ได้ตอนนี้";
const RETRY = "ลองใหม่";
const SKIP = "ข้ามไปที่เนื้อหา";
const NO_SUCH = "00000000-0000-4000-8000-000000000000";

let back: ChildProcess | null = null;
let projectId = "";

async function up(): Promise<boolean> {
  try { return (await fetch(`${API}/health`)).ok; } catch { return false; }
}

test.describe.configure({ mode: "serial" });

test.afterAll(() => { back?.kill(); });

test("API down: home and all 9 pages say so and offer a retry, within 10 s", async ({ page }) => {
  expect(await up(), `something already listens on ${API} — this spec needs it free`).toBe(false);
  for (const url of ["/", ...PAGES.map((p) => `/p/${NO_SUCH}/${p}`)]) {
    await page.goto(url);
    await expect(page.getByText(API_DOWN), url).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole("button", { name: RETRY }), url).toBeVisible();
  }
});

test("retry on home: once the API is back, the projects appear without a reload", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText(API_DOWN)).toBeVisible({ timeout: 10_000 });
  await page.evaluate(() => { (window as unknown as { noReload: boolean }).noReload = true; });

  const backDir = path.resolve(process.cwd(), process.env.BLUEPRINT_BACK || "../blueprint-back");
  back = spawn("bun", ["run", "src/index.ts"], { cwd: backDir, env: { ...process.env, DATABASE_URL: "pglite:memory", PORT: "4298" }, stdio: "ignore" });
  await expect.poll(up, { timeout: 30_000 }).toBe(true);
  const { meetingRoom } = await import(path.join(backDir, "test/fixtures/meeting-room.ts"));
  const p = await call("POST", "/v1/projects", { name: "จองห้องประชุม", theme: "default" });
  await call("POST", `/v1/projects/${p.id}/change-sets`, { cause: { kind: "operator" }, changes: meetingRoom });
  projectId = p.id;

  await page.getByRole("button", { name: RETRY }).click();
  // the card is a link; the closed new-project dialog's sample preview (same name) is not in the accessibility tree
  await expect(page.getByRole("link", { name: /จองห้องประชุม/ })).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText(API_DOWN)).toHaveCount(0);
  expect(await page.evaluate(() => (window as unknown as { noReload?: boolean }).noReload)).toBe(true);
});

test("skip link: the first Tab reaches it, Enter moves focus to the content", async ({ page }) => {
  // home (its own link — home has no shell, TASK-B-009) and the project pages (the default shell)
  for (const url of ["/", ...PAGES.map((p) => `/p/${projectId}/${p}`)]) {
    await page.goto(url);
    await page.keyboard.press("Tab");
    await expect(page.locator(":focus"), url).toHaveText(SKIP);
    await expect(page.locator(":focus"), url).toBeVisible();
    await page.keyboard.press("Enter");
    await expect.poll(() => page.evaluate(() => document.activeElement?.id), { message: url }).toBe("content");
  }
});

for (const width of [1440, 390]) {
  test(`width ${width}: no default page scrolls sideways`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const p of ["/", ...PAGES.map((x) => `/p/${projectId}/${x}`)]) {
      await page.goto(p);
      await expect(page.locator("main#content")).toBeVisible();
      const [sw, iw] = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
      expect(sw, `${p} at ${width}: scrollWidth ${sw} > innerWidth ${iw}`).toBeLessThanOrEqual(iw);
    }
  });
}
