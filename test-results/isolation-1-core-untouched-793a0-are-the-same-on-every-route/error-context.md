# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: isolation.spec.ts >> 1. core untouched: html, body and every core element are the same on every route
- Location: tests/isolation.spec.ts:88:5

# Error details

```
Error: heroui · core input · color · expected rgb(0, 0, 0) · actual rgb(27, 31, 36)
heroui · core input · background-color · expected rgb(255, 255, 255) · actual rgba(0, 0, 0, 0)
all · core input · color · expected rgb(0, 0, 0) · actual rgb(27, 31, 36)
all · core input · background-color · expected rgb(255, 255, 255) · actual rgba(0, 0, 0, 0)
heroui · core table · border-top-color · expected rgb(27, 31, 36) · actual rgb(201, 206, 214)
heroui · core table · border-right-color · expected rgb(27, 31, 36) · actual rgb(201, 206, 214)
heroui · core table · border-bottom-color · expected rgb(27, 31, 36) · actual rgb(201, 206, 214)
heroui · core table · border-left-color · expected rgb(27, 31, 36) · actual rgb(201, 206, 214)
all · core table · border-top-color · expected rgb(27, 31, 36) · actual rgb(201, 206, 214)
all · core table · border-right-color · expected rgb(27, 31, 36) · actual rgb(201, 206, 214)
all · core table · border-bottom-color · expected rgb(27, 31, 36) · actual rgb(201, 206, 214)
all · core table · border-left-color · expected rgb(27, 31, 36) · actual rgb(201, 206, 214)

expect(received).toEqual(expected) // deep equality

- Expected  -  1
+ Received  + 14

- Array []
+ Array [
+   "heroui · core input · color · expected rgb(0, 0, 0) · actual rgb(27, 31, 36)",
+   "heroui · core input · background-color · expected rgb(255, 255, 255) · actual rgba(0, 0, 0, 0)",
+   "all · core input · color · expected rgb(0, 0, 0) · actual rgb(27, 31, 36)",
+   "all · core input · background-color · expected rgb(255, 255, 255) · actual rgba(0, 0, 0, 0)",
+   "heroui · core table · border-top-color · expected rgb(27, 31, 36) · actual rgb(201, 206, 214)",
+   "heroui · core table · border-right-color · expected rgb(27, 31, 36) · actual rgb(201, 206, 214)",
+   "heroui · core table · border-bottom-color · expected rgb(27, 31, 36) · actual rgb(201, 206, 214)",
+   "heroui · core table · border-left-color · expected rgb(27, 31, 36) · actual rgb(201, 206, 214)",
+   "all · core table · border-top-color · expected rgb(27, 31, 36) · actual rgb(201, 206, 214)",
+   "all · core table · border-right-color · expected rgb(27, 31, 36) · actual rgb(201, 206, 214)",
+   "all · core table · border-bottom-color · expected rgb(27, 31, 36) · actual rgb(201, 206, 214)",
+   "all · core table · border-left-color · expected rgb(27, 31, 36) · actual rgb(201, 206, 214)",
+ ]
```

# Test source

```ts
  1   | // TASK-B-002 — proof that Ant Design, Mantine and HeroUI each style only their own subtree.
  2   | // Needs the production build served with BLUEPRINT_DEV_PAGES=1 (see playwright.config.ts).
  3   | import { expect, test, type Page } from "@playwright/test";
  4   | 
  5   | const ROUTES = ["none", "antd", "mantine", "heroui", "all"] as const;
  6   | type Route = (typeof ROUTES)[number];
  7   | type Lib = "antd" | "mantine" | "heroui";
  8   | 
  9   | // The properties the TASK names, with the shorthands read as their longhands (a shorthand reads "" when sides differ).
  10  | const PROPS = [
  11  |   "font-family", "font-size", "font-weight", "line-height", "color", "background-color",
  12  |   "margin-top", "margin-right", "margin-bottom", "margin-left",
  13  |   "padding-top", "padding-right", "padding-bottom", "padding-left",
  14  |   "border-top-width", "border-right-width", "border-bottom-width", "border-left-width",
  15  |   "border-top-style", "border-right-style", "border-bottom-style", "border-left-style",
  16  |   "border-top-color", "border-right-color", "border-bottom-color", "border-left-color",
  17  |   "border-top-left-radius", "border-top-right-radius", "border-bottom-right-radius", "border-bottom-left-radius",
  18  |   "box-sizing", "display",
  19  | ];
  20  | 
  21  | const CORE = ["h1", "p", "a", "button", "input", "ul", "table"];
  22  | 
  23  | const LIBS: Record<Lib, Record<"button" | "input" | "card" | "table", string>> = {
  24  |   antd: { button: ".ant-btn", input: ".ant-input", card: ".ant-card", table: ".ant-table" },
  25  |   mantine: { button: ".mantine-Button-root", input: ".mantine-TextInput-input", card: ".mantine-Card-root", table: ".mantine-Table-table" },
  26  |   heroui: { button: "button.button", input: "input.input", card: ".card", table: ".table-root" },
  27  | };
  28  | 
  29  | type Snapshot = Record<string, Record<string, string>>;
  30  | 
  31  | async function snapshot(page: Page, route: Route): Promise<Snapshot> {
  32  |   const failedCss: string[] = [];
  33  |   const onResponse = (r: { url(): string; status(): number }) => {
  34  |     if (r.url().endsWith(".css") && r.status() >= 400) failedCss.push(`${r.status()} ${r.url()}`);
  35  |   };
  36  |   page.on("response", onResponse);
  37  |   await page.goto(`/dev/isolation/${route}`);
  38  |   await page.waitForLoadState("networkidle");
  39  |   await page.evaluate(() => document.fonts.ready);
  40  |   page.off("response", onResponse);
  41  |   // A stale build or server can serve pages whose stylesheets 404 — then every block is unstyled and the
  42  |   // comparisons below would pass for the wrong reason. Refuse to compare in that case.
  43  |   const unloaded = await page.evaluate(() =>
  44  |     Array.from(document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')).filter((l) => !l.sheet).map((l) => l.href));
  45  |   expect([...failedCss, ...unloaded], `stylesheets not loaded on /dev/isolation/${route}`).toEqual([]);
  46  |   return page.evaluate(({ PROPS, CORE, LIBS }) => {
  47  |     const out: Record<string, Record<string, string>> = {};
  48  |     const read = (key: string, el: Element | null) => {
  49  |       if (!el) return;
  50  |       const cs = getComputedStyle(el);
  51  |       out[key] = Object.fromEntries(PROPS.map((p) => [p, cs.getPropertyValue(p)]));
  52  |     };
  53  |     read("html", document.documentElement);
  54  |     read("body", document.body);
  55  |     for (const tag of CORE) read(`core ${tag}`, document.querySelector(`[data-core-block] [data-probe="${tag}"]`));
  56  |     for (const [lib, parts] of Object.entries(LIBS)) {
  57  |       for (const [part, sel] of Object.entries(parts)) read(`${lib} ${part}`, document.querySelector(`[data-theme-root="${lib}"] ${sel}`));
  58  |     }
  59  |     return out;
  60  |   }, { PROPS, CORE, LIBS });
  61  | }
  62  | 
  63  | function compare(failures: string[], route: string, key: string, expected?: Record<string, string>, actual?: Record<string, string>) {
  64  |   if (!expected || !actual) {
  65  |     failures.push(`${route} · ${key} · (element) · ${expected ? "present" : "missing"} · ${actual ? "present" : "missing"}`);
  66  |     return 0;
  67  |   }
  68  |   for (const p of PROPS) {
  69  |     if (expected[p] !== actual[p]) failures.push(`${route} · ${key} · ${p} · expected ${expected[p]} · actual ${actual[p]}`);
  70  |   }
  71  |   return PROPS.length;
  72  | }
  73  | 
  74  | let snaps: Record<Route, Snapshot>;
  75  | 
  76  | test.beforeAll(async ({ browser }) => {
  77  |   const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  78  |   snaps = {} as Record<Route, Snapshot>;
  79  |   for (const r of ROUTES) snaps[r] = await snapshot(page, r);
  80  |   if (process.env.ISOLATION_SCREENSHOT) {
  81  |     await page.goto("/dev/isolation/all");
  82  |     await page.waitForLoadState("networkidle");
  83  |     await page.screenshot({ path: process.env.ISOLATION_SCREENSHOT });
  84  |   }
  85  |   await page.close();
  86  | });
  87  | 
  88  | test("1. core untouched: html, body and every core element are the same on every route", () => {
  89  |   const failures: string[] = [];
  90  |   let n = 0;
  91  |   for (const key of ["html", "body", ...CORE.map((t) => `core ${t}`)]) {
  92  |     for (const r of ["antd", "mantine", "heroui", "all"] as const) n += compare(failures, r, key, snaps.none[key], snaps[r][key]);
  93  |   }
  94  |   console.log(`core: ${n} property comparisons, ${failures.length} differences`);
> 95  |   expect(failures, failures.join("\n")).toEqual([]);
      |                                         ^ Error: heroui · core input · color · expected rgb(0, 0, 0) · actual rgb(27, 31, 36)
  96  | });
  97  | 
  98  | test("2. each library keeps its own look on the shared screen", () => {
  99  |   const failures: string[] = [];
  100 |   let n = 0;
  101 |   for (const lib of Object.keys(LIBS) as Lib[]) {
  102 |     for (const part of Object.keys(LIBS[lib])) n += compare(failures, `all vs ${lib}`, `${lib} ${part}`, snaps[lib][`${lib} ${part}`], snaps.all[`${lib} ${part}`]);
  103 |   }
  104 |   console.log(`libraries: ${n} property comparisons, ${failures.length} differences`);
  105 |   expect(failures, failures.join("\n")).toEqual([]);
  106 | });
  107 | 
  108 | test("3. each library really loaded: its button differs from the core button and from a bare browser button", async ({ page }) => {
  109 |   // A button with no page CSS at all, from an empty document: what "unstyled" looks like in this browser.
  110 |   await page.setContent("<button>x</button>");
  111 |   const bare = await page.evaluate(() => {
  112 |     const cs = getComputedStyle(document.querySelector("button")!);
  113 |     return { bg: cs.backgroundColor, border: `${cs.borderTopWidth} ${cs.borderTopStyle} ${cs.borderTopColor}` };
  114 |   });
  115 |   const core = snaps.none["core button"];
  116 |   const border = (s: Record<string, string>) => ["width", "style", "color"].map((k) => s[`border-top-${k}`]).join(" ");
  117 |   const failures: string[] = [];
  118 |   for (const lib of Object.keys(LIBS) as Lib[]) {
  119 |     const b = snaps[lib][`${lib} button`];
  120 |     if (!b) { failures.push(`${lib} · button · (element) · present · missing`); continue; }
  121 |     for (const [name, ref] of [["core", { bg: core["background-color"], border: border(core) }], ["bare browser", bare]] as const) {
  122 |       if (b["background-color"] === ref.bg && border(b) === ref.border) {
  123 |         failures.push(`${lib} · button · background-color+border · differs from ${name} button ${ref.bg} / ${ref.border} · actual same`);
  124 |       }
  125 |     }
  126 |   }
  127 |   console.log(`loaded: 3 library buttons checked against the core button and a bare browser button, ${failures.length} unstyled`);
  128 |   expect(failures, failures.join("\n")).toEqual([]);
  129 | });
  130 | 
  131 | test("4. no library variables on the page root; the Mantine block carries its own", async ({ page }) => {
  132 |   await page.goto("/dev/isolation/all");
  133 |   await page.waitForLoadState("networkidle");
  134 |   const vars = await page.evaluate(() => {
  135 |     const names = (el: Element) => Array.from(getComputedStyle(el)).filter((n) => n.startsWith("--"));
  136 |     const leaked = (list: string[]) => list.filter((n) => /^--(mantine-|ant-|heroui|tw-)/.test(n));
  137 |     const html = names(document.documentElement), body = names(document.body);
  138 |     const mantineRoot = names(document.querySelector('[data-theme-root="mantine"]')!).filter((n) => n.startsWith("--mantine-"));
  139 |     return { htmlAll: html.length, bodyAll: body.length, htmlLeaked: leaked(html), bodyLeaked: leaked(body), mantineRoot: mantineRoot.length };
  140 |   });
  141 |   console.log(`root variables: html ${vars.htmlAll} (library ${vars.htmlLeaked.length}) · body ${vars.bodyAll} (library ${vars.bodyLeaked.length}) · Mantine block root --mantine-* ${vars.mantineRoot}`);
  142 |   expect(vars.htmlLeaked, `html carries: ${vars.htmlLeaked.join(", ")}`).toEqual([]);
  143 |   expect(vars.bodyLeaked, `body carries: ${vars.bodyLeaked.join(", ")}`).toEqual([]);
  144 |   expect(vars.mantineRoot).toBeGreaterThan(0);
  145 | });
  146 | 
```