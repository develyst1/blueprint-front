// The shared layouts against recorded API data: the worked example and the large invented seed, both directions.
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import type { FlowLayout, ParticipantVM, Point } from "@/core/theme/contract";
import type { ApiFlowchart, ApiLink, ApiPart, ApiSequence } from "@/core/model/build/types";
import { FLOW, flowLayout } from "./flow";
import { sequenceLayout } from "./sequence";
import { conditionBox, estimateLabel } from "./text";
import { nodeBox, webLayout } from "./web";

const fixture = <T>(name: string): T =>
  JSON.parse(readFileSync(path.join(process.cwd(), "tests/fixtures/api", `${name}.json`), "utf8")) as T;

type Rect = { x: number; y: number; w: number; h: number };
const overlap = (a: Rect, b: Rect) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
const centred = (p: Point, size: { w: number; h: number }): Rect => ({ x: p.x - size.w / 2, y: p.y - size.h / 2, w: size.w, h: size.h });
/** Clear space between two boxes: the larger of the horizontal and vertical gaps (negative = they overlap). */
const clearance = (a: Rect, b: Rect) => Math.max(Math.max(a.x, b.x) - Math.min(a.x + a.w, b.x + b.w), Math.max(a.y, b.y) - Math.min(a.y + a.h, b.y + b.h));

/** Does segment p→q pass through the inside of r? (Liang–Barsky clip; touching an edge does not count.) */
function crosses(p: Point, q: Point, r: Rect): boolean {
  const e = 0.5; // the inside, not the border the arrow starts or ends on
  const [x0, y0, x1, y1] = [r.x + e, r.y + e, r.x + r.w - e, r.y + r.h - e];
  let t0 = 0, t1 = 1;
  const dx = q.x - p.x, dy = q.y - p.y;
  for (const [pp, qq] of [[-dx, p.x - x0], [dx, x1 - p.x], [-dy, p.y - y0], [dy, y1 - p.y]] as const) {
    if (pp === 0) { if (qq < 0) return false; continue; }
    const t = qq / pp;
    if (pp < 0) { if (t > t1) return false; if (t > t0) t0 = t; } else { if (t < t0) return false; if (t < t1) t1 = t; }
  }
  return t0 < t1;
}

const projects = ["worked", "large"] as const;

function checkFlow(lay: FlowLayout) {
  const problems: string[] = [];
  // no two node boxes overlap
  for (const [i, a] of lay.nodes.entries()) for (const b of lay.nodes.slice(i + 1)) if (overlap(a, b)) problems.push(`nodes ${a.key} × ${b.key}`);
  for (const e of lay.edges) {
    // no segment crosses a node box other than its own ends
    for (let i = 0; i < e.points.length - 1; i++) {
      for (const n of lay.nodes) {
        if (n.key === e.from || n.key === e.to) continue;
        if (crosses(e.points[i]!, e.points[i + 1]!, n)) problems.push(`arrow ${e.from}→${e.to} segment ${i} crosses ${n.key}`);
      }
    }
    // labelled ↔ anchor
    if (e.label && !e.labelAnchor) problems.push(`arrow ${e.from}→${e.to} labelled without anchor`);
    if (!e.label && e.labelAnchor) problems.push(`arrow ${e.from}→${e.to} has an anchor but no label`);
    // the anchor is past the fork: more than one node-gap from the arrow's start
    if (e.labelAnchor) {
      const d = Math.hypot(e.labelAnchor.x - e.points[0]!.x, e.labelAnchor.y - e.points[0]!.y);
      if (d <= FLOW.rowGap) problems.push(`arrow ${e.from}→${e.to} anchor ${d.toFixed(0)}px from its start (≤ ${FLOW.rowGap})`);
    }
  }
  // the label boxes of one fork: ≥ 8 px clear of each other (TASK-B-010), not on any node
  const forks = new Map<string, typeof lay.edges>();
  for (const e of lay.edges) if (e.labelAnchor) (forks.get(e.from) ?? forks.set(e.from, []).get(e.from)!).push(e);
  for (const fork of forks.values()) {
    const boxes = fork.map((e) => ({ e, r: centred(e.labelAnchor!, conditionBox(e.label!, FLOW.labelPx)) }));
    for (const [i, a] of boxes.entries()) {
      for (const b of boxes.slice(i + 1)) {
        const gap = clearance(a.r, b.r);
        if (gap < 8) problems.push(`labels "${a.e.label}" × "${b.e.label}" ${gap.toFixed(1)} px apart (< 8)`);
      }
      for (const n of lay.nodes) if (overlap(a.r, n)) problems.push(`label "${a.e.label}" on node ${n.key}`);
    }
  }
  return problems;
}

describe("flowchart", () => {
  for (const p of projects) {
    for (const dir of ["LR", "TB"] as const) {
      test(`${p} ${dir}: no overlaps, no crossings, anchors past the fork`, () => {
        const diagram = fixture<ApiFlowchart>(`${p}-flowchart-WRK-001`);
        const lay = flowLayout(diagram, dir);
        expect(lay.nodes).toHaveLength(diagram.nodes.length);
        expect(lay.edges).toHaveLength(diagram.arrows.length);
        expect(lay.edges.filter((e) => e.label).length).toBe(diagram.arrows.filter((a) => a.label).length);
        expect(checkFlow(lay)).toEqual([]);
        for (const n of lay.nodes) {
          expect(n.x + n.w).toBeLessThanOrEqual(lay.width);
          expect(n.y + n.h).toBeLessThanOrEqual(lay.height);
        }
      });
    }
  }

  test("a loop (an arrow back to an earlier step) is laid out and routed outside everything", () => {
    const d = fixture<ApiFlowchart>("worked-flowchart-WRK-001");
    const looped: ApiFlowchart = { ...d, arrows: [...d.arrows, { from: "STEP-004", to: "STEP-002", label: "ส่งกลับไปแก้" }] };
    for (const dir of ["LR", "TB"] as const) {
      const lay = flowLayout(looped, dir);
      expect(checkFlow(lay)).toEqual([]);
      const back = lay.edges.find((e) => e.from === "STEP-004" && e.to === "STEP-002")!;
      expect(back.points).toHaveLength(6);
    }
  });

  test("the crossing check itself: through a box counts, along its edge does not", () => {
    const box = { x: 100, y: 100, w: 100, h: 50 };
    expect(crosses({ x: 0, y: 125 }, { x: 300, y: 125 }, box)).toBe(true); // straight through
    expect(crosses({ x: 0, y: 0 }, { x: 300, y: 300 }, box)).toBe(true); // diagonal through a corner region
    expect(crosses({ x: 0, y: 100 }, { x: 300, y: 100 }, box)).toBe(false); // along the top edge
    expect(crosses({ x: 200, y: 125 }, { x: 300, y: 125 }, box)).toBe(false); // starts on its right edge, leaves
    expect(crosses({ x: 0, y: 0 }, { x: 90, y: 0 }, box)).toBe(false); // nowhere near
  });

  test("the flow check catches a crossing (an arrow forced through a box)", () => {
    const lay = flowLayout(fixture<ApiFlowchart>("large-flowchart-WRK-001"), "LR");
    const n = lay.nodes[2]!;
    const forced = { ...lay, edges: [...lay.edges, { from: "X", to: "Y", label: null, labelAnchor: null, points: [{ x: n.x - 10, y: n.y + n.h / 2 }, { x: n.x + n.w + 10, y: n.y + n.h / 2 }] }] };
    expect(checkFlow(forced).some((p) => p.includes("crosses"))).toBe(true);
  });

  test("the check itself catches an overlap (a node moved onto another)", () => {
    const lay = flowLayout(fixture<ApiFlowchart>("worked-flowchart-WRK-001"), "LR");
    const moved = { ...lay, nodes: lay.nodes.map((n, i) => (i === 1 ? { ...n, x: lay.nodes[0]!.x, y: lay.nodes[0]!.y } : n)) };
    expect(checkFlow(moved).length).toBeGreaterThan(0);
  });
});

describe("sequence", () => {
  for (const p of projects) {
    test(`${p}: every step — y strictly increasing by order, participant x distinct`, () => {
      const spec = fixture<{ parts: ApiPart[]; links: ApiLink[] }>(`${p}-project`);
      const steps = spec.links.filter((l) => l.kind === "has_step").map((l) => l.toKey);
      expect(steps.length).toBeGreaterThan(0);
      for (const step of steps) {
        const seq = fixture<ApiSequence>(`${p}-sequence-${step}`);
        const lay = sequenceLayout(seq.participants as ParticipantVM[], seq.messages);
        const ys = [...lay.messages].sort((a, b) => a.order - b.order).map((m) => m.y);
        for (let i = 1; i < ys.length; i++) expect(ys[i]!).toBeGreaterThan(ys[i - 1]!);
        const xs = lay.participants.map((x) => x.x);
        expect(new Set(xs).size).toBe(xs.length);
        for (const m of lay.messages) expect(m.y).toBeLessThan(lay.height);
        for (const x of xs) expect(x).toBeLessThan(lay.width);
      }
    });
  }
});

describe("node web", () => {
  for (const p of projects) {
    test(`${p}: every part a node, every link an edge, no overlap, same input → same output`, () => {
      const spec = fixture<{ parts: ApiPart[]; links: ApiLink[] }>(`${p}-project`);
      const nodes = spec.parts.map((x) => ({ key: x.key, kind: x.kind, title: x.title, stuck: false }));
      const a = webLayout(nodes, spec.links);
      const b = webLayout(structuredClone(nodes), structuredClone(spec.links));
      expect(a).toEqual(b);
      expect(a.nodes).toHaveLength(spec.parts.length);
      expect(a.edges).toHaveLength(spec.links.length);
      const boxes = a.nodes.map((n) => ({ key: n.key, r: centred({ x: n.x, y: n.y }, nodeBox(n.title)) }));
      const hits: string[] = [];
      for (const [i, x] of boxes.entries()) for (const y of boxes.slice(i + 1)) if (overlap(x.r, y.r)) hits.push(`${x.key} × ${y.key}`);
      expect(hits).toEqual([]);
      for (const x of boxes) {
        expect(x.r.x).toBeGreaterThanOrEqual(0);
        expect(x.r.y).toBeGreaterThanOrEqual(0);
        expect(x.r.x + x.r.w).toBeLessThanOrEqual(a.width);
        expect(x.r.y + x.r.h).toBeLessThanOrEqual(a.height);
      }
    });
  }
});

describe("label size estimate", () => {
  test("Thai marks above/below add no width; deterministic", () => {
    expect(estimateLabel("ปฏิเสธ").w).toBe(estimateLabel("ปฏิเสธ").w);
    expect(estimateLabel("กี่").w).toBe(estimateLabel("ก").w);
    expect(estimateLabel("abc", 10)).toEqual({ w: 18, h: 16 });
  });

  // Rendered at 390 px in Chrome, 2026-10-09 (TASK-B-010 harness measure-labels.mjs): the widest drawing of each label
  // in the three themes — luxury-gold's plaque (text 600 weight + 2 × 10 px padding + border), height 26 px.
  const rendered: [string, number][] = [
    ["ห้องใหญ่ ต้องอนุมัติ", 139], ["ห้องเล็ก ไม่ต้องอนุมัติ", 149], ["อนุมัติ", 58], ["ปฏิเสธ", 62], ["เส้นทางปกติ", 95],
    ["ข้ามการเตรียม", 106], ["ผ่านการตรวจ", 99], ["ไม่ผ่านการตรวจ", 113], ["ต้องแก้ไข", 78], ["ไม่ต้องแก้ไข", 93],
  ];
  test("a condition's box is never smaller than its widest rendered plaque", () => {
    for (const [label, w] of rendered) {
      const b = conditionBox(label, FLOW.labelPx);
      expect(b.w, label).toBeGreaterThanOrEqual(w);
      expect(b.h, label).toBeGreaterThanOrEqual(26);
    }
  });
});

describe("TB height (TASK-B-010: a layer gap is what its labels need)", () => {
  test("worked < 1000 px and large < 3000 px tall top-to-bottom (were 1624 / 5404)", () => {
    expect(flowLayout(fixture<ApiFlowchart>("worked-flowchart-WRK-001"), "TB").height).toBeLessThan(1000);
    expect(flowLayout(fixture<ApiFlowchart>("large-flowchart-WRK-001"), "TB").height).toBeLessThan(3000);
  });
});
