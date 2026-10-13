// Page states, retry, skip link and widths (TASK-B-007 DoD 4, 7, 8 — REQ-002 R7, AC-14…17).
//
// Run with `bun run test:states` after a build: the app is started pointing at http://127.0.0.1:4298, where nothing
// listens yet — so every page starts in the API-down state. This spec then starts its own in-memory back end on 4298
// (DATABASE_URL=pglite:memory, never SIT), creates the worked example in the default theme, and stops it at the end.
import { spawn, type ChildProcess } from "node:child_process";
import { createServer, type Server } from "node:http";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { large } from "./seed/large";

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
    return { h: r.height.baseVal.value, fill: getComputedStyle(r).fill, href: a.getAttribute("href")! };
  }));
  // REQ-009: the page opens on the whole web, scaled to fit — so the tile's own size (world px) is 44, and on screen it is ≥ 44 once zoomed to a node (below)
  expect(Math.min(...tiles.map((t) => t.h)), "smallest node tile (px, unscaled)").toBeGreaterThanOrEqual(44);
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
  await expect.poll(() => page.locator('main svg a[aria-current="true"] rect').evaluate((r) => r.getBoundingClientRect().height), { message: "chosen tile on screen (px)" }).toBeGreaterThanOrEqual(44);
});

// REQ-009 AC-1 / AC-3 — the web opens on the whole picture, then zooms (TASK-B-031). The box is the region; a tile's screen rect is its <rect>'s.
const webBox = (page: import("@playwright/test").Page) => page.locator("main [role=region]");
const webTiles = (page: import("@playwright/test").Page) => webBox(page).evaluate((box) => {
  const v = box.getBoundingClientRect();
  const tiles = [...box.querySelectorAll("a")].map((a) => { const r = a.querySelector("rect")!.getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom, cur: a.getAttribute("aria-current") === "true", op: Number(getComputedStyle(a).opacity) }; });
  const m = new DOMMatrix(getComputedStyle(box.firstElementChild!).transform);
  return { v: { l: v.left, t: v.top, r: v.right, b: v.bottom }, tiles, scale: m.a };
});

/** Every node tile is inside the box (the whole web is in view). */
const allInside = async (page: import("@playwright/test").Page) => {
  const w = await webTiles(page);
  return w.tiles.length > 0 && w.tiles.every((t) => t.l >= w.v.l - 0.5 && t.t >= w.v.t - 0.5 && t.r <= w.v.r + 0.5 && t.b <= w.v.b + 0.5);
};

test("default ใยโหนด: opens on the whole web — every node tile inside the box (REQ-009 AC-1, TASK-B-031)", async ({ page }) => {
  const id = await projectIn("default", "ใยโหนด fit");
  await page.goto(`/p/${id}/web`);
  await expect.poll(() => allInside(page), { message: "every node tile is inside the box on open" }).toBe(true);
  const w = await webTiles(page);
  expect(w.tiles.length).toBeGreaterThan(10);
  expect(w.scale, "never enlarged past its own size").toBeLessThanOrEqual(1); // worked fits at 1:1 since TASK-B-033; the large web is zoomed out
});

test("clean-blue ใยโหนด: the large web opens whole — every node tile inside the box (REQ-009 AC-1, TASK-B-032)", async ({ page }) => {
  const id = await largeIn("clean-blue", "ใยโหนด clean-blue fit");
  await page.goto(`/p/${id}/web`);
  await expect.poll(() => allInside(page), { message: "every node tile is inside the box on open" }).toBe(true);
  expect((await webTiles(page)).tiles.length).toBeGreaterThan(50);
});

test("clean-blue ใยโหนด @390: the web box starts in the top half of the screen on open, the whole web inside it (TASK-B-034)", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const id = await projectIn("clean-blue", "ใยโหนด clean-blue 390");
  await page.goto(`/p/${id}/web`);
  await expect.poll(() => allInside(page), { message: "every node tile is inside the box on open" }).toBe(true);
  const top = await page.locator("main [role=region]").evaluate((e) => e.getBoundingClientRect().top);
  expect(top, "the box's top (px) — it started ~620 px down before B-034").toBeLessThanOrEqual(422);
});

test("default ใยโหนด: a chosen node is centred and readable, its edges strong and the rest faded; ดูทั้งหมด and Esc go back (REQ-009 AC-3, TASK-B-031)", async ({ page }) => {
  const id = await projectIn("default", "ใยโหนด focus");
  await page.goto(`/p/${id}/web`);
  const href = await webBox(page).locator("a").nth(3).getAttribute("href");
  await page.goto(href!);
  await expect.poll(async () => {
    const w = await webTiles(page), c = w.tiles.find((t) => t.cur);
    return !!c && Math.abs((c.l + c.r) / 2 - (w.v.l + w.v.r) / 2) < 2 && Math.abs((c.t + c.b) / 2 - (w.v.t + w.v.b) / 2) < 2;
  }, { message: "the chosen tile sits at the box's centre" }).toBe(true);
  const w = await webTiles(page);
  expect(w.scale, "readable: at least the node's own size").toBeGreaterThanOrEqual(1);
  expect(w.tiles.filter((t) => !t.cur && t.op < 1).length, "unrelated nodes are faded").toBeGreaterThan(0);
  const widths = await webBox(page).locator("line").evaluateAll((ls) => ls.map((l) => ({ strong: l.getAttribute("stroke") === "#1458c4", w: parseFloat(l.getAttribute("stroke-width")!), op: Number(getComputedStyle(l).opacity) })));
  expect(widths.filter((l) => l.strong).every((l) => l.op === 1 && l.w > 2), "its edges are strong").toBe(true);
  expect(widths.filter((l) => !l.strong).every((l) => l.op < 1), "other edges are faded").toBe(true);
  await expect(page.getByRole("heading", { name: "เชื่อมกับ" })).toBeVisible();

  await webBox(page).focus();
  await page.keyboard.press("Escape");
  await expect(page).toHaveURL(new RegExp(`/p/${id}/web$`));
  await expect.poll(() => allInside(page), { message: "Escape: back to the whole web — every tile in view" }).toBe(true);
  await page.goto(href!);
  await page.getByRole("link", { name: "ดูทั้งหมด" }).click();
  await expect(page).toHaveURL(new RegExp(`/p/${id}/web$`));
  await expect.poll(() => allInside(page), { message: "ดูทั้งหมด: back to the whole web — every tile in view" }).toBe(true);
});

test("default ใยโหนด: every name stays shown at the whole-web view; a long one is cut with … and named in full (REQ-009 R4, TASK-B-031)", async ({ page }) => {
  const id = await projectIn("default", "ใยโหนด names");
  await page.goto(`/p/${id}/web`);
  const names = await webBox(page).locator("a").evaluateAll((as) => as.map((a) => ({
    label: a.getAttribute("aria-label")!, text: a.querySelector("text:not([aria-hidden])")!.textContent!, cut: !!a.querySelector("text[aria-hidden]"), title: a.querySelector("title")?.textContent ?? null })));
  expect(names.length).toBeGreaterThan(10);
  for (const n of names) expect(n.text, `name of "${n.label}" is whole in the DOM`).toBe(n.label);
  const cut = names.filter((n) => n.cut);
  expect(cut.length, "the worked example has a name longer than the tile cap").toBeGreaterThan(0);
  for (const n of cut) expect(n.title, `tooltip of "${n.label}"`).toBe(n.label);
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

test("clean-blue ready: with a confirmed, unchanged version Build is the primary link to the core's CAW href, ยืนยัน no longer primary (TASK-B-044)", async ({ page }) => {
  const id = await largeIn("clean-blue", "สร้างที่ CAW clean-blue"); // the large seed has nothing stuck
  await page.goto(`/p/${id}/ready`);
  await expect(page.locator("[data-build]")).toBeDisabled(); // before: off, with its reason
  const quiz = await call("POST", `/v1/projects/${id}/quizzes`, {});
  for (const q of ["มีกี่ขั้นตอน", "ใครเริ่มงาน", "ใครอนุมัติ", "มีหน้าจอกี่หน้า", "จบงานที่ไหน"]) await call("POST", `/v1/projects/${id}/quizzes/${quiz.id}/questions`, { question: q });
  for (const it of (await call("GET", `/v1/projects/${id}/quizzes/latest`)).items) await call("POST", `/v1/projects/${id}/quizzes/${quiz.id}/items/${it.id}/mark`, { mark: "right" });
  const v = await call("POST", `/v1/projects/${id}/versions`, { confirmedBy: "operator" });
  await page.goto(`/p/${id}/ready`);
  const build = page.locator("a[data-build]");
  await expect(build).toHaveAttribute("href", new RegExp(`/start\\?project=${id}&version=${v.version}$`));
  await expect(build).toHaveClass(/ant-btn-primary/);
  // the gate card's one primary is now Build: ยืนยัน 100% steps down (the quiz's own ถาม keeps its look — not this TASK's)
  await expect(page.getByRole("button", { name: "ยืนยัน 100%" })).not.toHaveClass(/ant-btn-primary/);
});

// ---------- REQ-009 R1, TASK-B-033 (SPEC v1.15, D-042): the web reads at the fit view, on a desktop and a phone ----------
const largeIn = async (theme: string, name: string) => {
  const p = await call("POST", "/v1/projects", { name, theme });
  await call("POST", `/v1/projects/${p.id}/change-sets`, { cause: { kind: "operator" }, changes: large });
  return p.id as string;
};
const fitFacts = (page: import("@playwright/test").Page) => page.locator("main [role=region]").evaluate((box) => {
  const m = new DOMMatrix(getComputedStyle(box.firstElementChild!).transform);
  const texts = [...box.querySelectorAll("a text:not([aria-hidden])")].map((t) => parseFloat(getComputedStyle(t).fontSize) * m.a);
  const rects = [...box.querySelectorAll("a")].map((a) => a.querySelector("rect") as SVGRectElement).map((r) => ({ x: r.x.baseVal.value, y: r.y.baseVal.value, w: r.width.baseVal.value, h: r.height.baseVal.value }));
  const svg = box.querySelector<SVGSVGElement>("svg")!;
  return { scale: m.a, smallestName: Math.min(...texts), rects, aspect: svg.width.baseVal.value / svg.height.baseVal.value };
});

for (const [seed, make, minName] of [["worked", () => projectIn("default", "ใยโหนด read worked"), 10], ["large", () => largeIn("default", "ใยโหนด read large"), 10]] as const) {
  test(`default ใยโหนด ${seed} @1440: the names are at least ${minName} px at the fit view, and no two tiles touch (D-042, TASK-B-033)`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const id = await make();
    await page.goto(`/p/${id}/web`);
    await expect.poll(async () => (await fitFacts(page)).scale, { message: "measured and fitted" }).toBeLessThanOrEqual(1);
    await page.waitForTimeout(300);
    const f = await fitFacts(page);
    console.log(`${seed} @1440: fit scale ${f.scale.toFixed(3)}, smallest name ${f.smallestName.toFixed(1)} px, layout aspect ${f.aspect.toFixed(2)}`);
    expect(f.smallestName, "smallest name on screen (px)").toBeGreaterThanOrEqual(minName);
    expect(f.aspect, "the wide layout on a desktop").toBeGreaterThan(1);
    const touching: string[] = [];
    for (const [i, a] of f.rects.entries()) for (const b of f.rects.slice(i + 1)) {
      if (a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h) touching.push(`${i}×${f.rects.indexOf(b)}`);
    }
    expect(touching, "overlapping tiles (drawn rects, at any zoom)").toEqual([]);
  });
}

test("default ใยโหนด @390: the tall layout is drawn, and one ซูมเข้า makes the names bigger (D-042, TASK-B-033)", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const id = await projectIn("default", "ใยโหนด phone");
  await page.goto(`/p/${id}/web`);
  await expect.poll(async () => (await fitFacts(page)).aspect, { message: "the tall layout once the box is measured" }).toBeLessThan(1);
  await page.waitForTimeout(300);
  const before = await fitFacts(page);
  await page.getByRole("button", { name: "ซูมเข้า" }).click();
  await page.waitForTimeout(400);
  const after = await fitFacts(page);
  console.log(`worked @390: names ${before.smallestName.toFixed(1)} px at the fit view → ${after.smallestName.toFixed(1)} px after one ซูมเข้า`);
  expect(after.smallestName / before.smallestName).toBeCloseTo(1.25, 2);
});

test("default ใยโหนด: ⚠ is on exactly the parts the stuck list counts — worked has the header's 1 (A-066, TASK-B-033)", async ({ page }) => {
  const id = await projectIn("default", "ใยโหนด stuck marks");
  await page.goto(`/p/${id}/web`);
  const header = Number((await page.locator("header").first().innerText()).match(/ยังติดอยู่\s*(\d+)\s*จุด/)?.[1]);
  expect(header, "the header's stuck count").toBeGreaterThan(0);
  const marked = await page.locator("main [role=region] a").evaluateAll((as) => as.filter((a) => (a.getAttribute("aria-label") ?? "").startsWith("⚠")).length);
  expect(marked, "nodes marked ⚠ on the web").toBe(header);
});

// ---------- REQ-009 R7 / AC-7, TASK-B-035 (SPEC v1.16, D-043): choosing a node never loads the page ----------
/** Record every distinct transform of the web's stage while the page runs (one frame at a time), for the glide checks. */
const recordTransforms = (page: import("@playwright/test").Page) => page.evaluate(() => {
  const w = window as unknown as { __t: string[]; __stop: boolean };
  w.__t = []; w.__stop = false;
  // the stage is looked up again each frame: hydration may have replaced the element the first lookup found
  const tick = () => { const stage = document.querySelector("main [role=region]")?.firstElementChild; const v = stage ? getComputedStyle(stage).transform : "none"; if (w.__t.at(-1) !== v) w.__t.push(v); if (!w.__stop) requestAnimationFrame(tick); };
  tick();
});
const stopRecording = (page: import("@playwright/test").Page) => page.evaluate(() => { const w = window as unknown as { __t: string[]; __stop: boolean }; w.__stop = true; return w.__t ?? []; }); // a reloaded page has lost the recording: no transforms
const partOf = (page: import("@playwright/test").Page) => new URL(page.url()).searchParams.get("part");

for (const [theme, task] of [["default", "TASK-B-035"], ["clean-blue", "TASK-B-036"]] as const) for (const [vw, vh] of [[1440, 900], [390, 844]] as const) {
  test(`${theme} ใยโหนด @${vw}: a node, a เชื่อมกับ entry, ดูทั้งหมด and Back never load the page — marker, scroll, address (REQ-009 AC-7, ${task})`, async ({ page }) => {
    await page.setViewportSize({ width: vw, height: vh });
    const id = await projectIn(theme, `ใยโหนด in-page ${theme} ${vw}`);
    await page.goto(`/p/${id}/web`);
    await expect.poll(() => allInside(page), { message: "the web is open" }).toBe(true);
    const documents: string[] = [];
    page.on("request", (r) => { if (r.resourceType() === "document") documents.push(r.url()); });
    await page.evaluate(() => { (window as unknown as { __marker: number }).__marker = 1; window.scrollTo(0, 40); });
    const y0 = await page.evaluate(() => window.scrollY);

    await recordTransforms(page);
    const node = webBox(page).locator("a").nth(3);
    const nodeHref = (await node.getAttribute("href"))!;
    await node.dispatchEvent("click");
    await expect.poll(() => partOf(page), { message: "the address names the chosen node" }).not.toBeNull();
    const first = partOf(page)!;
    expect(nodeHref).toContain(`part=${first}`);
    await expect(page.getByRole("heading", { name: "เชื่อมกับ" })).toBeVisible();
    await page.waitForTimeout(600);
    const glide = await stopRecording(page);
    console.log(`@${vw}: ${glide.length} distinct transforms while moving to the node: ${glide.slice(0, 4).join(" → ")}`);
    expect(glide.length, "the view glides — start, in between, end").toBeGreaterThanOrEqual(3);

    const entry = page.locator('ul[aria-label="เชื่อมกับ"] a').first();
    const entryPart = new URL((await entry.getAttribute("href"))!, "http://x").searchParams.get("part");
    await entry.dispatchEvent("click");
    await expect.poll(() => partOf(page), { message: "a เชื่อมกับ entry chooses that part" }).toBe(entryPart);
    await page.getByRole("link", { name: "ดูทั้งหมด" }).dispatchEvent("click");
    await expect.poll(() => partOf(page), { message: "ดูทั้งหมด clears the choice" }).toBeNull();
    await page.goBack();
    await expect.poll(() => partOf(page), { message: "Back → the entry" }).toBe(entryPart);
    await page.goBack();
    await expect.poll(() => partOf(page), { message: "Back → the first node" }).toBe(first);

    expect(documents, "document requests after the page was open").toEqual([]);
    expect(await page.evaluate(() => (window as unknown as { __marker?: number }).__marker), "the page was never reloaded (marker)").toBe(1);
    expect(await page.evaluate(() => window.scrollY), "page scroll").toBe(y0);
  });
}

for (const theme of ["default", "clean-blue"]) test(`${theme} ใยโหนด: under reduced motion the move to a chosen node is instant (REQ-009 AC-7, TASK-B-035/036)`, async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const id = await projectIn(theme, `ใยโหนด in-page reduced ${theme}`);
  await page.goto(`/p/${id}/web`);
  await expect.poll(() => allInside(page)).toBe(true);
  await recordTransforms(page);
  await webBox(page).locator("a").nth(3).dispatchEvent("click");
  await expect.poll(() => partOf(page)).not.toBeNull();
  await page.waitForTimeout(600);
  const t = await stopRecording(page);
  console.log(`reduced motion: ${t.length} distinct transforms: ${t.join(" → ")}`);
  expect(t.at(-1), "the stage has a transform at all (a reduced-motion rule once set it to none — F-087)").not.toBe("none");
  expect(t.length, "the view moved to the node …").toBeGreaterThanOrEqual(2);
  const stage = webBox(page).locator(":scope > *").first();
  expect(await stage.evaluate((e) => getComputedStyle(e).transitionDuration), "… with no animation at all").toBe("0s");
  // default: start and end only. clean-blue: its side card narrows the box as the choice lands, so the node is re-centred
  // once more, also in one step (TASK-B-036) — still no in-between frame: a landing per box, never more
  expect(t.length, "… nothing in between").toBeLessThanOrEqual(theme === "clean-blue" ? 3 : 2);
});

test("default ใยโหนด: Ctrl, ⌘ and Shift clicks keep the browser's default (a new tab / window) — linkProps does not prevent it (TASK-B-035)", async ({ page }) => {
  const id = await projectIn("default", "ใยโหนด modified click");
  await page.goto(`/p/${id}/web`);
  await expect.poll(() => allInside(page)).toBe(true);
  const before = page.url();
  const seen = await webBox(page).locator("a").nth(3).evaluate((a) => {
    const out: Record<string, boolean> = {};
    // after React's own listener (it sits lower, on the root), see whether the click is already prevented — then stop the new tab ourselves
    let prevented = false;
    const spy = (e: MouseEvent) => { prevented = e.defaultPrevented; e.preventDefault(); };
    window.addEventListener("click", spy);
    for (const mod of ["ctrlKey", "metaKey", "shiftKey"] as const) {
      a.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, button: 0, [mod]: true }));
      out[mod] = prevented;
    }
    window.removeEventListener("click", spy);
    return out;
  });
  console.log(`defaultPrevented by linkProps: ${JSON.stringify(seen)}`);
  expect(seen).toEqual({ ctrlKey: false, metaKey: false, shiftKey: false });
  expect(page.url(), "the page did not navigate in place").toBe(before);
});

// ---------- REQ-009 R7 DEF-3, TASK-B-037 (SPEC v1.17): the arrangement switches only when the window itself is resized ----------
test("default ใยโหนด: a box that narrows around a choice keeps the wide arrangement and glides; a real window resize still switches it (REQ-009 DEF-3, TASK-B-037)", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const id = await projectIn("default", "ใยโหนด keep arrangement");
  await page.goto(`/p/${id}/web`);
  await expect.poll(() => allInside(page)).toBe(true);
  await page.waitForTimeout(300);
  const aspect = () => page.locator("main [role=region] svg").evaluate((s) => { const v = s as SVGSVGElement; return v.width.baseVal.value / v.height.baseVal.value; });
  expect(await aspect(), "the wide arrangement on a desktop window").toBeGreaterThan(1);

  // a theme's side panel narrows the box when a node is chosen — the window stays 1440 × 900. Here: the box is narrowed by hand at the click.
  await page.evaluate(() => {
    const w = window as unknown as { __t: string[]; __a: Set<string>; __stop: boolean };
    w.__t = []; w.__a = new Set(); w.__stop = false;
    const tick = () => {
      const box = document.querySelector("main [role=region]"); const svg = box?.querySelector("svg") as SVGSVGElement | null;
      const v = box?.firstElementChild ? getComputedStyle(box.firstElementChild).transform : "none";
      if (w.__t.at(-1) !== v) w.__t.push(v);
      if (svg) w.__a.add(svg.width.baseVal.value / svg.height.baseVal.value > 1 ? "wide" : "tall");
      if (!w.__stop) requestAnimationFrame(tick);
    };
    tick();
  });
  const node = webBox(page).locator("a").nth(3);
  await node.dispatchEvent("click");
  await page.evaluate(() => { (document.querySelector("main [role=region]") as HTMLElement).style.width = "560px"; });
  await expect.poll(() => partOf(page), { message: "the choice landed" }).not.toBeNull();
  await page.waitForTimeout(700);
  const seen = await page.evaluate(() => { const w = window as unknown as { __t: string[]; __a: Set<string>; __stop: boolean }; w.__stop = true; return { t: w.__t, a: [...w.__a] }; });
  const box = await webBox(page).boundingBox();
  console.log(`narrowed box ${Math.round(box!.width)}×${Math.round(box!.height)}: arrangements seen ${JSON.stringify(seen.a)}; ${seen.t.length} distinct transforms`);
  expect(box!.width / box!.height, "the box really is shaped like a tall one now").toBeLessThan(1.25);
  expect(seen.a, "the wide arrangement was kept the whole time").toEqual(["wide"]);
  expect(seen.t.length, "the view glided (frames in between)").toBeGreaterThanOrEqual(8);

  // a real resize of the window across the boundary does switch (the hand-set width is lifted: a phone's box is its page's, not 560 px)
  await page.evaluate(() => { (document.querySelector("main [role=region]") as HTMLElement).style.width = ""; });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect.poll(aspect, { message: "the tall arrangement after the window itself became a phone" }).toBeLessThan(1);
});
