// The required-content check (R8, AC-12, AC-13 — SPEC-B-001 § "Required-content check", TASK-B-007).
//
// Every page × every theme (registered + default), on the seeded projects — the 9 spec pages plus the chat (Team A) and
// screen ④ (Team C, TASK-B-011): each required item — the core's own lists, shellRequired + pageRequired, and for the
// two feature routes their own chatRequired / readyRequired — must be on screen: a [data-required=<id>] element that is visible and whose visible
// text contains the item's text. Fails naming theme · page · item.
//
//   bun run scripts/check-required.ts                       the themes registered in this checkout
//   bun run scripts/check-required.ts --extra-theme <dir>   one more theme from a folder outside the registry
//
// Needs: the in-memory back end (DATABASE_URL=pglite:memory, BLUEPRINT_API_URL, default http://127.0.0.1:4299) and,
// without --extra-theme, this checkout's production server (CHECK_BASE_URL, default http://127.0.0.1:3101) started
// with the same BLUEPRINT_API_URL. With --extra-theme the script makes a throwaway clone of the repo, puts the theme in
// the clone's src/themes/, builds and serves the clone itself (CHECK_EXTRA_PORT, default 3102) and deletes it after —
// so the extra theme never touches this checkout or another team's running server.
import { spawn, spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdtempSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { chromium, type Page } from "@playwright/test";
import type { PageId, RequiredItem } from "@/core/theme/contract";
import { pageSlug, PAGES } from "@/core/model/build/common";
import { pageRequired, shellRequired } from "@/core/model/build/required";
import { loadPage, loadProjectData } from "@/core/model/load";
import { frame as buildFrame } from "@/core/model/build/common";
import type { ChatVM } from "@/core/theme/contract";
import { requiredId } from "@/core/theme/required";
import { loadChat } from "@/features/chat/load";
import { loadReady, readyRequired } from "@/features/ready/load";
import { call } from "../tests/seed/seed";
import { everyStuckKind } from "../tests/seed/every-stuck-kind";
import { large } from "../tests/seed/large";

const root = process.cwd();
const api = process.env.BLUEPRINT_API_URL || "http://127.0.0.1:4299";
const args = process.argv.slice(2);
const extraAt = args.indexOf("--extra-theme");
const extraDir = extraAt >= 0 ? path.resolve(args[extraAt + 1] ?? "") : null;

type Failure = { theme: string; page: string; item: string; why: string };

async function worked(): Promise<unknown[]> {
  const back = path.resolve(root, process.env.BLUEPRINT_BACK || "../blueprint-back");
  return (await import(path.join(back, "test/fixtures/meeting-room.ts"))).meetingRoom;
}

/** One project per seed, in the given theme. */
async function seedFor(theme: string) {
  const sets: [string, unknown[] | null][] = [["worked", await worked()], ["every-stuck", everyStuckKind], ["large", large], ["empty", null]];
  const out: Record<string, string> = {};
  for (const [name, changes] of sets) {
    const p = await call(api, "POST", "/v1/projects", { name: `${name} · ${theme}`, theme });
    if (changes) await call(api, "POST", `/v1/projects/${p.id}/change-sets`, { cause: { kind: "operator" }, changes });
    out[name] = p.id;
  }
  return out;
}

/** The chat (Team A) and screen ④ (Team C) routes — every theme has them (its own page, or the feature's default). */
const FEATURES = ["chat", "ready"] as const;
type Route = PageId | (typeof FEATURES)[number];

// Team A's rule, `chatRequired` in src/features/chat/ChatScreen.tsx: each pack question's text. Restated here because
// that file pulls in the theme registry (next/font), which a plain Bun script cannot load — TASK-B-011 § Questions.
const chatRequired = (vm: ChatVM): RequiredItem[] => vm.pack.map((q) => ({ id: requiredId.part(q.key), text: q.text }));

/** What one page of one project must show — the very lists the route hands to the theme. */
async function expected(projectId: string, page: Route, query: Record<string, string>): Promise<RequiredItem[]> {
  if (page === "chat") {
    const r = await loadChat(projectId, null);
    return r.ok ? [...shellRequired(r.vm.frame), ...chatRequired(r.vm)] : [];
  }
  if (page === "ready") {
    const r = await loadReady(projectId);
    return r.ok ? [...shellRequired(r.vm.frame), ...readyRequired(r.vm)] : [];
  }
  const r = await loadPage(page, projectId, query);
  if (r.ok) return [...shellRequired(r.vm.frame), ...pageRequired(page, r.vm)];
  if (r.state.kind === "empty") {
    const d = await loadProjectData(projectId);
    return d.ok ? shellRequired(buildFrame(d.data, page)) : [];
  }
  return [];
}

/** SPEC-B-001's "visible": runs in the page. Returns, per item, null (fine) or the reason it is not. */
async function visibleCheck(page: Page, items: RequiredItem[]) {
  return page.evaluate((its) => {
    const norm = (s: string) => s.replace(/\s+/g, " ").trim();
    const why = (el: Element, text: string): string | null => {
      const r = el.getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0) return "no box";
      for (let a: Element | null = el; a; a = a.parentElement) {
        const cs = getComputedStyle(a);
        if (cs.display === "none") return "display:none";
        if (cs.visibility === "hidden" || cs.visibility === "collapse") return "visibility:hidden";
        if (Number(cs.opacity) === 0) return "opacity:0";
        if (a !== el && a.tagName === "DETAILS" && !(a as HTMLDetailsElement).open && !el.closest("summary")) return "inside a closed ดูรายละเอียด";
        if (a !== el && ["hidden", "clip"].some((o) => cs.overflowX === o || cs.overflowY === o)) {
          const b = a.getBoundingClientRect();
          if (r.right <= b.left || r.left >= b.right || r.bottom <= b.top || r.top >= b.bottom) return "clipped out of its container";
        }
        // overflow auto/scroll: reachable by scrolling without a click — fine (REVIEW-C-001 S2)
      }
      const shown = el instanceof HTMLElement ? el.innerText : el.textContent ?? "";
      if (!norm(shown).includes(norm(text))) return `text "${norm(shown).slice(0, 40)}" lacks "${text}"`;
      return null;
    };
    return its.map((it) => {
      const els = [...document.querySelectorAll(`[data-required="${CSS.escape(it.id)}"]`)];
      if (!els.length) return "missing";
      const reasons = els.map((el) => why(el, it.text));
      return reasons.includes(null) ? null : reasons[0];
    });
  }, items);
}

async function check(base: string, themes: string[]) {
  const browser = await chromium.launch({ channel: "chrome" });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const failures: Failure[] = [];
  let n = 0, pages = 0;
  for (const theme of themes) {
    const ids = await seedFor(theme);
    for (const [seed, id] of Object.entries(ids)) {
      const first = (await loadProjectData(id));
      const someKey = first.ok ? first.data.parts.find((p) => p.kind === "decision" || p.kind === "step")?.key : undefined;
      for (const p of [...PAGES, ...FEATURES] as Route[]) {
        const query: Record<string, string> = p === "history" && someKey ? { part: someKey } : {};
        const items = await expected(id, p, query);
        const qs = new URLSearchParams(query).toString();
        const slug = p === "chat" || p === "ready" ? p : pageSlug(p);
        const res = await page.goto(`${base}/p/${id}/${slug}${qs ? `?${qs}` : ""}`);
        if (!res || res.status() >= 400) {
          failures.push({ theme, page: `${seed}/${p}`, item: "(page)", why: `HTTP ${res?.status()}` });
          continue;
        }
        await page.waitForLoadState("networkidle");
        const result = await visibleCheck(page, items);
        pages++;
        n += items.length;
        result.forEach((r, i) => r && failures.push({ theme, page: `${seed}/${p}`, item: items[i]!.id, why: r }));
      }
    }
  }
  await browser.close();
  return { n, pages, failures };
}

function registeredThemes(dir: string): string[] {
  const themes = path.join(dir, "src/themes");
  if (!existsSync(themes)) return [];
  return readdirSync(themes, { withFileTypes: true })
    .filter((d) => d.isDirectory() && /^[a-z0-9-]+$/.test(d.name) && ["index.ts", "index.tsx"].some((f) => existsSync(path.join(themes, d.name, f))))
    .map((d) => d.name).sort();
}

async function waitFor(url: string, ms = 90_000) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    try { if ((await fetch(url)).status < 500) return; } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`server did not come up: ${url}`);
}

let base = process.env.CHECK_BASE_URL || "http://127.0.0.1:3101";
let themes = ["default", ...registeredThemes(root)];
let cleanup = () => {};

if (extraDir) {
  // A throwaway clone (APFS clonefile: instant, no extra disk) — the extra theme lives only there.
  const id = path.basename(extraDir);
  if (!/^[a-z0-9-]+$/.test(id)) throw new Error(`the theme folder name must be a theme id ([a-z0-9-]+): ${id}`);
  const clone = mkdtempSync(path.join(tmpdir(), "check-required-"));
  const repo = path.join(clone, "blueprint-front");
  const cp = spawnSync("cp", ["-cR", root, repo]);
  if (cp.status !== 0) cpSync(root, repo, { recursive: true });
  rmSync(path.join(repo, "src/themes", id), { recursive: true, force: true });
  cpSync(extraDir, path.join(repo, "src/themes", id), { recursive: true });
  const port = process.env.CHECK_EXTRA_PORT || "3102";
  const env = { ...process.env, NEXT_DIST_DIR: ".next-check", BLUEPRINT_API_URL: api, BLUEPRINT_DEV_PAGES: "1" };
  const build = spawnSync("bun", ["run", "build"], { cwd: repo, env, stdio: "pipe", encoding: "utf8" });
  if (build.status !== 0) { console.error(build.stdout, build.stderr); throw new Error("build of the clone failed"); }
  const server = spawn(path.join(repo, "node_modules/.bin/next"), ["start", "-p", port], { cwd: repo, env, stdio: "ignore" });
  await waitFor(`http://127.0.0.1:${port}/`);
  base = `http://127.0.0.1:${port}`;
  themes = [id];
  cleanup = () => { server.kill(); rmSync(clone, { recursive: true, force: true }); };
}

try {
  const { n, pages, failures } = await check(base, themes);
  for (const f of failures) console.log(`FAIL ${f.theme} · ${f.page} · ${f.item} — ${f.why}`);
  console.log(`checked ${n} items on ${pages / themes.length} pages × ${themes.length} themes, ${failures.length} failures`);
  process.exitCode = failures.length ? 1 : 0;
} finally {
  cleanup();
}
