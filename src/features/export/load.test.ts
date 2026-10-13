// The print view's cover and page plan against fixture data (invented, shaped as blueprint-back answers).
import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { PAGES } from "@/core/model/build/common";
import type { ProjectData } from "@/core/model/build/types";
import { readinessClear, readinessStuck } from "@/core/words";
import { buildCover, diagramSize, LABEL_PX, MIN_LABEL_PT, PAGE_MM, partsTable, planDiagram, plan, printedLabelPt, type Section } from "./load";

const origin = { stamp: "operator" as const, date: "2026-10-09" };
const part = (key: string, kind: string, title: string, body: Record<string, unknown> = {}) =>
  ({ key, kind, title, body, origin, createdIn: "cs-1" }) as ProjectData["parts"][number];
const link = (id: string, kind: string, fromKey: string, toKey: string, position: number | null = null) =>
  ({ id, kind, fromKey, toKey, label: null, position, origin, createdIn: "cs-1" }) as ProjectData["links"][number];
const data = (parts: ProjectData["parts"], links: ProjectData["links"] = [], stuck: ProjectData["stuck"] = []): ProjectData => ({
  project: { id: "p-1", organisationId: "o", name: "จองห้อง", createdAt: "2026-10-09T01:00:00.000Z", theme: "minimal-mono", model: "tier:small", creativity: 0.5 },
  parts, links, stuck,
});

describe("cover", () => {
  test("name, version or null, today in Thai, the frame's readiness, every stuck wording", () => {
    const d = data([part("WRK-001", "work", "งาน")], [], [{ kind: "open_question", key: "Q-001", title: "q" } as ProjectData["stuck"][number]]);
    const c = buildCover({ data: d, version: 3, stuck: ["ยังมีคำถามที่ยังไม่ได้ตอบ", "บอทเดาไว้ ยังไม่ได้รับการยืนยัน"], now: new Date("2026-10-09T05:00:00.000Z") });
    expect(c).toEqual({ name: "จองห้อง", version: 3, exportDate: "9 ต.ค. 2569", readiness: readinessStuck(1), stuck: ["ยังมีคำถามที่ยังไม่ได้ตอบ", "บอทเดาไว้ ยังไม่ได้รับการยืนยัน"] });
  });

  test("not confirmed → version null; nothing stuck → the clear readiness (D-031: not yet ready to build)", () => {
    const c = buildCover({ data: data([part("WRK-001", "work", "งาน")]), version: null, stuck: [], now: new Date("2026-10-09T05:00:00.000Z") });
    expect([c.version, c.readiness, c.stuck]).toEqual([null, readinessClear, []]);
  });
});

describe("plan", () => {
  const d = data(
    [
      part("WRK-001", "work", "งานหนึ่ง"), part("WRK-002", "work", "งานสอง"),
      part("STEP-001", "step", "ขั้นแรก"), part("STEP-002", "step", "ขั้นสอง", { ends: true }), part("STEP-003", "step", "ขั้นสาม", { ends: true }),
    ],
    [link("l1", "has_step", "WRK-001", "STEP-001", 1), link("l2", "has_step", "WRK-001", "STEP-002", 2), link("l3", "has_step", "WRK-002", "STEP-003", 1)],
  );
  const p = plan(d);

  test("pages in PAGES order (each page's first appearance)", () => {
    expect([...new Set(p.map((x) => x.page))]).toEqual(PAGES);
  });

  test("workOrder and flowchart once per work, sequence once per step of every work, history once per part", () => {
    const count = (page: string) => p.filter((x) => x.page === page).length;
    expect([count("workOrder"), count("flowchart"), count("sequence"), count("history"), count("overview")]).toEqual([2, 2, 3, 5, 1]);
    expect(p.filter((x) => x.page === "sequence").map((x) => x.query.step)).toEqual(["STEP-001", "STEP-002", "STEP-003"]);
    expect(p.find((x) => x.page === "flowchart")!.subtitle).toBe("งานหนึ่ง");
  });
});

// D-040 (TASK-A-064): a diagram's labels stay ≥ 8 pt on paper — else its own landscape page, else also a parts table.
describe("diagram fit (D-040)", () => {
  const PX = 96 / 25.4;
  const portraitW = PAGE_MM.portrait.w * PX, portraitH = PAGE_MM.portrait.h * PX;
  const landscapeW = PAGE_MM.landscape.w * PX, landscapeH = PAGE_MM.landscape.h * PX;
  // an svg exactly as wide as the portrait box, scaled by `k` (k > 1 = bigger than the page)
  const wide = (k: number) => ({ w: portraitW * k, h: portraitH * 0.3 });

  test("the numbers: 8 pt, a 14 px label, the two content boxes in mm", () => {
    expect([MIN_LABEL_PT, LABEL_PX]).toEqual([8, 14]);
    expect(PAGE_MM).toEqual({ portrait: { w: 182, h: 240 }, landscape: { w: 269, h: 153 } });
  });

  test("printed label pt = label px × scale × 0.75; a diagram that already fits is not enlarged (scale ≤ 1)", () => {
    expect(printedLabelPt(100, 100, "portrait")).toBeCloseTo(10.5, 6); // 14 × 1 × 0.75
    expect(printedLabelPt(portraitW * 2, 100, "portrait")).toBeCloseTo(5.25, 6); // half size
    expect(printedLabelPt(100, portraitH * 4, "portrait")).toBeCloseTo(2.625, 6); // the height binds
  });

  test("8.0 pt stays portrait · 7.9 pt → landscape · below 8 pt even in landscape → landscape + a table", () => {
    // pt = 14 × (portraitW / w) × 0.75 = 8 → w = portraitW × 10.5 / 8
    const at8 = { w: (portraitW * 10.5) / 8, h: 10 };
    expect(planDiagram(at8.w, at8.h)).toMatchObject({ orient: "portrait", table: false });
    expect(planDiagram(at8.w * 1.01, at8.h)).toMatchObject({ orient: "landscape", table: false }); // ≈ 7.92 pt portrait, ≥ 8 in landscape
    // landscape reaches 8 pt up to w = landscapeW × 10.5 / 8; one pixel past that → the table too
    const edge = (landscapeW * 10.5) / 8;
    expect(planDiagram(edge, 10)).toMatchObject({ orient: "landscape", table: false });
    expect(planDiagram(edge + 1, 10)).toMatchObject({ orient: "landscape", table: true });
    expect(planDiagram(100, 100)).toEqual({ orient: "portrait", table: false, ptPortrait: 10.5, ptLandscape: 10.5 });
  });

  test("a tall diagram is bound by the height of the box: landscape would print it SMALLER, so it stays portrait (+ the table) — the worked web page, 1925 × 1808 px", () => {
    const p = planDiagram(1925, 1808);
    expect(p.ptPortrait).toBeCloseTo(3.75, 1); // ≈ 0.357 × 14 × 0.75 — what A-062 left printed
    expect(p.ptLandscape).toBeCloseTo(3.39, 1); // 0.323 × 14 × 0.75: the 153 mm height binds
    expect(p).toMatchObject({ orient: "portrait", table: true });
    expect(wide(1).w).toBeCloseTo(portraitW, 6);
  });

  test("a wide, flat diagram gains from landscape (the worked flowchart, 1623 × 224 px: 4.5 pt → 6.6 pt) and still needs the table", () => {
    const p = planDiagram(1623, 224);
    expect([p.ptPortrait.toFixed(1), p.ptLandscape.toFixed(1)]).toEqual(["4.5", "6.6"]);
    expect(p).toMatchObject({ orient: "landscape", table: true });
  });

  test("which sections are diagrams, and their size: flowchart LR layout, sequence layout, web layout — nothing else", () => {
    const sec = (page: string, vm: unknown) => ({ page, key: page, subtitle: null, vm }) as unknown as Section;
    expect(diagramSize(sec("flowchart", { layouts: { LR: { width: 900, height: 300 }, TB: { width: 1, height: 1 } } }))).toEqual({ w: 900, h: 300 });
    expect(diagramSize(sec("sequence", { layout: { width: 700, height: 410 } }))).toEqual({ w: 700, h: 410 });
    expect(diagramSize(sec("web", { layout: { width: 1925, height: 1808 } }))).toEqual({ w: 1925, h: 1808 });
    for (const page of ["overview", "workOrder", "screens", "api", "stuck", "history"]) expect(diagramSize(sec(page, {}))).toBeNull();
  });

  describe("the parts table — one row per part: kind word, title, titles it links to; no keys (REQ-008, TASK-A-064 item 3)", () => {
    const sec = (page: string, vm: unknown) => ({ page, key: page, subtitle: null, vm }) as unknown as Section;
    test("web: kind word from the core's legend, the title, and the titles at the far end of its edges (out only), in layout order", () => {
      const rows = partsTable(sec("web", { layout: {
        nodes: [
          { key: "SCR-001", kind: "screen", title: "หน้าจองห้อง" },
          { key: "API-001", kind: "api", title: "สร้างการจอง" },
          { key: "DAT-001", kind: "data", title: "การจอง" },
        ],
        edges: [{ id: "e1", kind: "calls", from: "SCR-001", to: "API-001" }, { id: "e2", kind: "writes", from: "API-001", to: "DAT-001" }, { id: "e3", kind: "reads", from: "SCR-001", to: "DAT-001" }],
      } }));
      expect(rows).toEqual([
        { kind: "หน้าจอ", title: "หน้าจองห้อง", links: ["สร้างการจอง", "การจอง"] },
        { kind: "API", title: "สร้างการจอง", links: ["การจอง"] },
        { kind: "ข้อมูล", title: "การจอง", links: [] },
      ]);
      expect(JSON.stringify(rows)).not.toMatch(/SCR-|API-|DAT-/);
    });
    test("flowchart: the work's steps are the rows (kind = ขั้นตอน), arrows are the links", () => {
      const rows = partsTable(sec("flowchart", {
        work: { steps: [{ key: "STEP-001", title: "ส่งคำขอ" }, { key: "STEP-002", title: "อนุมัติ" }] },
        layouts: { LR: { nodes: [{ key: "STEP-001" }, { key: "STEP-002" }], edges: [{ from: "STEP-001", to: "STEP-002", label: null }] } },
      }));
      expect(rows).toEqual([
        { kind: "ขั้นตอน", title: "ส่งคำขอ", links: ["อนุมัติ"] },
        { kind: "ขั้นตอน", title: "อนุมัติ", links: [] },
      ]);
    });
    test("sequence: the participants are the rows (their own kind word), the messages they send are the links, each once", () => {
      const rows = partsTable(sec("sequence", { layout: {
        participants: [{ key: "ROL-001", kind: "role", title: "ผู้จอง" }, { key: "SCR-001", kind: "screen", title: "หน้าจองห้อง" }],
        messages: [{ from: "ROL-001", to: "SCR-001" }, { from: "ROL-001", to: "SCR-001" }, { from: "SCR-001", to: null }],
      } }));
      expect(rows).toEqual([
        { kind: "คน", title: "ผู้จอง", links: ["หน้าจองห้อง"] },
        { kind: "หน้าจอ", title: "หน้าจองห้อง", links: [] },
      ]);
    });
    test("a link to a part that is not drawn is left out; a page with no diagram has no table", () => {
      const rows = partsTable(sec("web", { layout: { nodes: [{ key: "A", kind: "work", title: "งาน" }], edges: [{ id: "e", kind: "x", from: "A", to: "GONE" }] } }));
      expect(rows).toEqual([{ kind: "งาน", title: "งาน", links: [] }]);
      expect(partsTable(sec("stuck", {}))).toBeNull();
    });
  });

  // every .tsx of the default theme is read (a directory listing, not a fixed name): the web drawing moved from pages.tsx
  // to WebView.tsx once (TASK-A-068), and a test pinned to one file broke without the PDF rule being wrong.
  const DEFAULT_THEME = new URL("../../core/theme/default/", import.meta.url);
  const labelSizes = (files: string[]) => files.flatMap((f) => {
    const src = readFileSync(new URL(f, DEFAULT_THEME), "utf8");
    return [...src.matchAll(/fontSize=\{(\d+)\}/g), ...src.matchAll(/const WEB_PX = (\d+);/g)].map((m) => Number(m[1]));
  });

  test("LABEL_PX is the smallest label font the core's default diagrams draw (any .tsx there: fontSize={N}, const WEB_PX = N)", () => {
    const sizes = labelSizes(readdirSync(DEFAULT_THEME).filter((f) => f.endsWith(".tsx")));
    if (sizes.length === 0) throw new Error("no label font size found in core/theme/default/*.tsx — the drawing moved or its size is no longer a literal; LABEL_PX cannot be checked");
    expect(Math.min(...sizes)).toBe(LABEL_PX);
  });
});
