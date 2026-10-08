// TASK-B-002 — proof that Ant Design, Mantine and HeroUI each style only their own subtree.
// Needs the production build served with BLUEPRINT_DEV_PAGES=1 (see playwright.config.ts).
import { expect, test, type Page } from "@playwright/test";

const ROUTES = ["none", "antd", "mantine", "heroui", "all"] as const;
type Route = (typeof ROUTES)[number];
type Lib = "antd" | "mantine" | "heroui";

// The properties the TASK names, with the shorthands read as their longhands (a shorthand reads "" when sides differ).
const PROPS = [
  "font-family", "font-size", "font-weight", "line-height", "color", "background-color",
  "margin-top", "margin-right", "margin-bottom", "margin-left",
  "padding-top", "padding-right", "padding-bottom", "padding-left",
  "border-top-width", "border-right-width", "border-bottom-width", "border-left-width",
  "border-top-style", "border-right-style", "border-bottom-style", "border-left-style",
  "border-top-color", "border-right-color", "border-bottom-color", "border-left-color",
  "border-top-left-radius", "border-top-right-radius", "border-bottom-right-radius", "border-bottom-left-radius",
  "box-sizing", "display",
];

const CORE = ["h1", "p", "a", "button", "input", "ul", "table"];

const LIBS: Record<Lib, Record<"button" | "input" | "card" | "table", string>> = {
  antd: { button: ".ant-btn", input: ".ant-input", card: ".ant-card", table: ".ant-table" },
  mantine: { button: ".mantine-Button-root", input: ".mantine-TextInput-input", card: ".mantine-Card-root", table: ".mantine-Table-table" },
  heroui: { button: "button.button", input: "input.input", card: ".card", table: ".table-root" },
};

type Snapshot = Record<string, Record<string, string>>;

async function snapshot(page: Page, route: Route): Promise<Snapshot> {
  const failedCss: string[] = [];
  const onResponse = (r: { url(): string; status(): number }) => {
    if (r.url().endsWith(".css") && r.status() >= 400) failedCss.push(`${r.status()} ${r.url()}`);
  };
  page.on("response", onResponse);
  await page.goto(`/dev/isolation/${route}`);
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => document.fonts.ready);
  page.off("response", onResponse);
  // A stale build or server can serve pages whose stylesheets 404 — then every block is unstyled and the
  // comparisons below would pass for the wrong reason. Refuse to compare in that case.
  const unloaded = await page.evaluate(() =>
    Array.from(document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')).filter((l) => !l.sheet).map((l) => l.href));
  expect([...failedCss, ...unloaded], `stylesheets not loaded on /dev/isolation/${route}`).toEqual([]);
  return page.evaluate(({ PROPS, CORE, LIBS }) => {
    const out: Record<string, Record<string, string>> = {};
    const read = (key: string, el: Element | null) => {
      if (!el) return;
      const cs = getComputedStyle(el);
      out[key] = Object.fromEntries(PROPS.map((p) => [p, cs.getPropertyValue(p)]));
    };
    read("html", document.documentElement);
    read("body", document.body);
    for (const tag of CORE) read(`core ${tag}`, document.querySelector(`[data-core-block] [data-probe="${tag}"]`));
    for (const [lib, parts] of Object.entries(LIBS)) {
      for (const [part, sel] of Object.entries(parts)) read(`${lib} ${part}`, document.querySelector(`[data-theme-root="${lib}"] ${sel}`));
    }
    return out;
  }, { PROPS, CORE, LIBS });
}

function compare(failures: string[], route: string, key: string, expected?: Record<string, string>, actual?: Record<string, string>) {
  if (!expected || !actual) {
    failures.push(`${route} · ${key} · (element) · ${expected ? "present" : "missing"} · ${actual ? "present" : "missing"}`);
    return 0;
  }
  for (const p of PROPS) {
    if (expected[p] !== actual[p]) failures.push(`${route} · ${key} · ${p} · expected ${expected[p]} · actual ${actual[p]}`);
  }
  return PROPS.length;
}

let snaps: Record<Route, Snapshot>;

test.beforeAll(async ({ browser }) => {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  snaps = {} as Record<Route, Snapshot>;
  for (const r of ROUTES) snaps[r] = await snapshot(page, r);
  if (process.env.ISOLATION_SCREENSHOT) {
    await page.goto("/dev/isolation/all");
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: process.env.ISOLATION_SCREENSHOT });
  }
  await page.close();
});

test("1. core untouched: html, body and every core element are the same on every route", () => {
  const failures: string[] = [];
  let n = 0;
  for (const key of ["html", "body", ...CORE.map((t) => `core ${t}`)]) {
    for (const r of ["antd", "mantine", "heroui", "all"] as const) n += compare(failures, r, key, snaps.none[key], snaps[r][key]);
  }
  console.log(`core: ${n} property comparisons, ${failures.length} differences`);
  expect(failures, failures.join("\n")).toEqual([]);
});

test("2. each library keeps its own look on the shared screen", () => {
  const failures: string[] = [];
  let n = 0;
  for (const lib of Object.keys(LIBS) as Lib[]) {
    for (const part of Object.keys(LIBS[lib])) n += compare(failures, `all vs ${lib}`, `${lib} ${part}`, snaps[lib][`${lib} ${part}`], snaps.all[`${lib} ${part}`]);
  }
  console.log(`libraries: ${n} property comparisons, ${failures.length} differences`);
  expect(failures, failures.join("\n")).toEqual([]);
});

test("3. each library really loaded: its button differs from the core button and from a bare browser button", async ({ page }) => {
  // A button with no page CSS at all, from an empty document: what "unstyled" looks like in this browser.
  await page.setContent("<button>x</button>");
  const bare = await page.evaluate(() => {
    const cs = getComputedStyle(document.querySelector("button")!);
    return { bg: cs.backgroundColor, border: `${cs.borderTopWidth} ${cs.borderTopStyle} ${cs.borderTopColor}` };
  });
  const core = snaps.none["core button"];
  const border = (s: Record<string, string>) => ["width", "style", "color"].map((k) => s[`border-top-${k}`]).join(" ");
  const failures: string[] = [];
  for (const lib of Object.keys(LIBS) as Lib[]) {
    const b = snaps[lib][`${lib} button`];
    if (!b) { failures.push(`${lib} · button · (element) · present · missing`); continue; }
    for (const [name, ref] of [["core", { bg: core["background-color"], border: border(core) }], ["bare browser", bare]] as const) {
      if (b["background-color"] === ref.bg && border(b) === ref.border) {
        failures.push(`${lib} · button · background-color+border · differs from ${name} button ${ref.bg} / ${ref.border} · actual same`);
      }
    }
  }
  console.log(`loaded: 3 library buttons checked against the core button and a bare browser button, ${failures.length} unstyled`);
  expect(failures, failures.join("\n")).toEqual([]);
});

test("4. no library variables on the page root; the Mantine block carries its own", async ({ page }) => {
  await page.goto("/dev/isolation/all");
  await page.waitForLoadState("networkidle");
  const vars = await page.evaluate(() => {
    const names = (el: Element) => Array.from(getComputedStyle(el)).filter((n) => n.startsWith("--"));
    const leaked = (list: string[]) => list.filter((n) => /^--(mantine-|ant-|heroui|tw-)/.test(n));
    const html = names(document.documentElement), body = names(document.body);
    const mantineRoot = names(document.querySelector('[data-theme-root="mantine"]')!).filter((n) => n.startsWith("--mantine-"));
    return { htmlAll: html.length, bodyAll: body.length, htmlLeaked: leaked(html), bodyLeaked: leaked(body), mantineRoot: mantineRoot.length };
  });
  console.log(`root variables: html ${vars.htmlAll} (library ${vars.htmlLeaked.length}) · body ${vars.bodyAll} (library ${vars.bodyLeaked.length}) · Mantine block root --mantine-* ${vars.mantineRoot}`);
  expect(vars.htmlLeaked, `html carries: ${vars.htmlLeaked.join(", ")}`).toEqual([]);
  expect(vars.bodyLeaked, `body carries: ${vars.bodyLeaked.join(", ")}`).toEqual([]);
  expect(vars.mantineRoot).toBeGreaterThan(0);
});
