// Page states, retry, skip link and widths (TASK-B-007 DoD 4, 7, 8 — REQ-002 R7, AC-14…17).
//
// Run with `bun run test:states` after a build: the app is started pointing at http://127.0.0.1:4298, where nothing
// listens yet — so every page starts in the API-down state. This spec then starts its own in-memory back end on 4298
// (DATABASE_URL=pglite:memory, never SIT), creates the worked example in the default theme, and stops it at the end.
import { spawn, type ChildProcess } from "node:child_process";
import { createServer, type Server } from "node:http";
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

// A stand-in for the LLM gateway, local only (D-003: no live call): a quiz question gets a recorded answer, the model
// list one entry. Envelope as blueprint-back src/gateway/client.ts reads it.
const GATEWAY = "http://127.0.0.1:4296";
let gateway: Server | null = null;
test.beforeAll(async () => {
  gateway = createServer((req, res) => {
    res.setHeader("content-type", "application/json");
    if (req.url?.startsWith("/models")) return res.end(JSON.stringify({ fake: ["recorded"] }));
    const content = JSON.stringify({ answer: "ยังไม่ได้ระบุในสเปก", parts: [], notInSpec: false });
    res.end(JSON.stringify({ success: true, data: { content, provider: "fake", model: "recorded", usage: null } }));
  });
  await new Promise<void>((ok) => gateway!.listen(4296, "127.0.0.1", ok));
});

test.afterAll(() => { back?.kill(); gateway?.close(); });

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
  back = spawn("bun", ["run", "src/index.ts"], { cwd: backDir, env: { ...process.env, DATABASE_URL: "pglite:memory", PORT: "4298", GATEWAY_URL: GATEWAY /* never the live gateway: this spec's own stand-in */ }, stdio: "ignore" });
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

// ---------- computed-style checks a visual fix leaves behind (frontend-finish rule 12; TASK-B-023, B-021 Q2) ----------

const meetingRoom = async () => (await import(path.join(path.resolve(process.cwd(), process.env.BLUEPRINT_BACK || "../blueprint-back"), "test/fixtures/meeting-room.ts"))).meetingRoom;
const projectIn = async (theme: string, name: string) => {
  const p = await call("POST", "/v1/projects", { name, theme });
  await call("POST", `/v1/projects/${p.id}/change-sets`, { cause: { kind: "operator" }, changes: await meetingRoom() });
  return p.id as string;
};

test("home: no card's theme root is taller than its card (a min-height on the default root stretched one to 900 px)", async ({ page }) => {
  await projectIn("no-such-theme", "การ์ดธีม default");
  await projectIn("clean-blue", "การ์ดธีม clean-blue");
  await page.goto("/");
  const rows = await page.locator("main > ul > li").evaluateAll( // the cards grid only — not the dialog previews' lists
    (lis) => lis.map((li) => {
    const root = li.querySelector("[data-theme-root]")!;
    return { theme: root.getAttribute("data-theme-root"), root: root.getBoundingClientRect().height, card: root.firstElementChild!.getBoundingClientRect().height };
  }));
  expect(rows.length).toBeGreaterThan(1);
  for (const r of rows) expect(r.root, `${r.theme}: root ${r.root} vs card ${r.card}`).toBeLessThanOrEqual(r.card + 8);
});

for (const theme of ["default", "clean-blue"]) {
  test(`${theme}: an empty project's page shows ส่งออก PDF — ≥ 44 px, and it asks for the core's export URL (D-038, TASK-B-028)`, async ({ page }) => {
    const p = await call("POST", "/v1/projects", { name: `โปรเจกต์ว่าง ${theme}`, theme }); // no change-sets: no live part
    const exportUrl = `/p/${p.id}/export/pdf`;
    await page.route(`**${exportUrl}`, (route) => route.fulfill({ status: 503 })); // the URL is what is asserted; no PDF is built here
    await page.goto(`/p/${p.id}/overview`);
    const button = page.getByRole("button", { name: "ส่งออก PDF" });
    await expect(button).toBeVisible();
    expect((await button.boundingBox())!.height, "button height (px)").toBeGreaterThanOrEqual(44);
    const [req] = await Promise.all([page.waitForRequest((r) => new URL(r.url()).pathname === exportUrl), button.click()]);
    expect(new URL(req.url()).pathname).toBe(exportUrl);
  });
}

test("default ใยโหนด: node text is at least 14 px and a stuck node carries ⚠, not only a colour (TASK-B-024)", async ({ page }) => {
  const id = await projectIn("default", "ใยโหนด default");
  await page.goto(`/p/${id}/web`);
  const nodes = await page.locator("main svg a text").evaluateAll(
    (ts) => ts.map((t) => ({ size: parseFloat(getComputedStyle(t).fontSize), stuck: t.getAttribute("fill") === "#a6460a", text: t.textContent ?? "" })));
  expect(nodes.length).toBeGreaterThan(10);
  expect(Math.min(...nodes.map((n) => n.size)), "smallest node text (px)").toBeGreaterThanOrEqual(14);
  const stuck = nodes.filter((n) => n.stuck);
  expect(stuck.length, "the worked example has stuck nodes").toBeGreaterThan(0);
  for (const n of stuck) expect(n.text, `stuck node "${n.text}"`).toContain("⚠");
});

test("default ใยโหนด: nodes are 44 px tiles, the chosen one filled, its edges marked, the box opened on it (TASK-B-025)", async ({ page }) => {
  const id = await projectIn("default", "ใยโหนด tiles");
  await page.goto(`/p/${id}/web`);
  const tiles = await page.locator("main svg a").evaluateAll((as) => as.map((a) => {
    const r = a.querySelector("rect")!;
    return { h: a.getBoundingClientRect().height, fill: getComputedStyle(r).fill, href: a.getAttribute("href")! };
  }));
  expect(Math.min(...tiles.map((t) => t.h)), "smallest node hit (px)").toBeGreaterThanOrEqual(44);
  expect(tiles.every((t) => t.fill !== "none"), "every node has a surface").toBe(true);
  const canvas = await page.locator("main [role=region]").evaluate((e) => getComputedStyle(e).backgroundColor);
  expect(canvas, "tiles sit on the canvas, a step off the white tile").toBe("rgb(246, 247, 249)");

  await page.goto(tiles[1]!.href);
  const chosen = await page.locator('main svg a[aria-current="true"] rect').evaluate((r) => getComputedStyle(r).fill);
  const sibling = await page.locator("main svg a:not([aria-current]) rect").first().evaluate((r) => getComputedStyle(r).fill);
  expect(chosen).toBe("rgb(20, 88, 196)");
  expect(sibling).not.toBe(chosen);
  expect(await page.locator('main svg line[stroke="#1458c4"]').count(), "the chosen node's edges are marked").toBeGreaterThan(0);
  // the box opens on the chosen node (scroll-initial-target), not at its top-left corner
  const inView = await page.locator("main [role=region]").evaluate((box) => {
    const v = box.getBoundingClientRect(), c = box.querySelector('a[aria-current="true"]')!.getBoundingClientRect();
    return c.left >= v.left && c.right <= v.right && c.top >= v.top && c.bottom <= v.bottom;
  });
  expect(inView, "chosen node in view on open").toBe(true);
});

test("clean-blue chat: the composer is marked out — a 2 px theme-blue border (REVIEW-C-004 row 1)", async ({ page }) => {
  const id = await projectIn("clean-blue", "แชต clean-blue");
  await page.goto(`/p/${id}/chat`);
  const border = await page.locator("textarea").first().evaluate((t) => { const c = getComputedStyle(t.closest(".ant-card")!); return `${c.borderTopWidth} ${c.borderTopColor}`; });
  expect(border).toBe("2px rgb(26, 95, 214)");
});

test("clean-blue ready: a stale score is quiet (ink-2, 500) and no Ant preset blue is drawn (REVIEW-C-004 rows 2, 9)", async ({ page }) => {
  const id = await projectIn("clean-blue", "พร้อมสร้าง clean-blue");
  const quiz = await call("POST", `/v1/projects/${id}/quizzes`, {});
  for (const q of ["มีกี่ขั้นตอน", "ใครเริ่มงาน", "ใครอนุมัติ", "มีหน้าจอกี่หน้า", "จบงานที่ไหน"]) await call("POST", `/v1/projects/${id}/quizzes/${quiz.id}/questions`, { question: q });
  for (const it of (await call("GET", `/v1/projects/${id}/quizzes/latest`)).items) await call("POST", `/v1/projects/${id}/quizzes/${quiz.id}/items/${it.id}/mark`, { mark: "right" });
  const step = (await call("GET", `/v1/projects/${id}`)).parts.find((p: { kind: string }) => p.kind === "step");
  await call("POST", `/v1/projects/${id}/change-sets`, { cause: { kind: "operator" }, changes: [{ op: "part.update", key: step.key, title: `${step.title} (แก้)`, origin: { stamp: "operator", date: "2026-10-12" } }] });
  await page.goto(`/p/${id}/ready`);
  const score = await page.locator('[data-required="ready:score"]').evaluate((e) => { const c = getComputedStyle(e.closest("p")!); return `${c.color} ${c.fontWeight}`; });
  expect(score).toBe("rgb(74, 85, 104) 500");
  const preset = await page.locator('[data-theme-root="clean-blue"] *').evaluateAll((els) => els.filter((el) => { const c = getComputedStyle(el); return c.color === "rgb(9, 88, 217)" || c.backgroundColor === "rgb(230, 244, 255)"; }).length);
  expect(preset).toBe(0);
});
