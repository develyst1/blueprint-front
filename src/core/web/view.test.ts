// The web's view mechanics, pure (REQ-009 AC-1, AC-3): where the view sits when the page opens, when a node is chosen, and
// what zooming and panning do — against the worked example and the large seed, in a desktop box and a phone box.
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import type { ApiLink, ApiPart } from "@/core/model/build/types";
import { nodeBox, webLayout, WEB_ASPECT } from "@/core/layout/web";
import { fitView, focusView, MARGIN, MAX_SCALE, MIN_SCALE, neighbours, panBy, pickLayout, READABLE_SCALE, tileBox, zoomAt, type View } from "./view";

const fixture = <T>(name: string): T =>
  JSON.parse(readFileSync(path.join(process.cwd(), "tests/fixtures/api", `${name}.json`), "utf8")) as T;
const layoutOf = (p: string) => {
  const spec = fixture<{ parts: ApiPart[]; links: ApiLink[] }>(`${p}-project`);
  return { spec, layout: webLayout(spec.parts.map((x) => ({ key: x.key, kind: x.kind, title: x.title, stuck: false })), spec.links) };
};
const BOXES = { desktop: { w: 1440, h: 700 }, phone: { w: 390, h: 600 } } as const;
/** A node's tile on screen under a view: [left, top, right, bottom]. */
const onScreen = (n: { x: number; y: number; title: string }, v: View) => {
  const t = tileBox(n);
  return [(n.x - t.w / 2) * v.scale + v.x, (n.y - t.h / 2) * v.scale + v.y, (n.x + t.w / 2) * v.scale + v.x, (n.y + t.h / 2) * v.scale + v.y] as const;
};

describe("tileBox", () => {
  test("is never smaller than the layout's own node box, and at least the 44 px target tall", () => {
    for (const title of ["A", "ห้องที่จุเกิน 10 คนต้องให้ผู้ดูแลอนุมัติ", "x".repeat(60)]) {
      const t = tileBox({ title }), b = nodeBox(title);
      expect(t.w).toBeGreaterThanOrEqual(b.w);
      expect(t.h).toBeGreaterThanOrEqual(Math.max(b.h, 44));
    }
  });
});

describe("fitView (AC-1): the whole web inside the box, with a margin", () => {
  for (const p of ["worked", "large"] as const) {
    for (const [name, box] of Object.entries(BOXES)) {
      test(`${p} in a ${name} box (${box.w}×${box.h}): every node tile inside, margin ${MARGIN} px, centred`, () => {
        const { layout } = layoutOf(p);
        const v = fitView(layout, box);
        expect(v.scale).toBeGreaterThanOrEqual(MIN_SCALE);
        expect(v.scale).toBeLessThanOrEqual(1);
        const rects = layout.nodes.map((n) => onScreen(n, v));
        const [l, t, r, b] = [Math.min(...rects.map((x) => x[0])), Math.min(...rects.map((x) => x[1])), Math.max(...rects.map((x) => x[2])), Math.max(...rects.map((x) => x[3]))];
        expect(l).toBeGreaterThanOrEqual(MARGIN - 0.5);
        expect(t).toBeGreaterThanOrEqual(MARGIN - 0.5);
        expect(r).toBeLessThanOrEqual(box.w - MARGIN + 0.5);
        expect(b).toBeLessThanOrEqual(box.h - MARGIN + 0.5);
        // centred on the free axis
        expect(Math.abs((l + r) / 2 - box.w / 2)).toBeLessThan(1);
        expect(Math.abs((t + b) / 2 - box.h / 2)).toBeLessThan(1);
      });
    }
  }

  test("a tiny web is not blown up past 1:1, and an empty or unmeasured box gives the identity", () => {
    const tiny = { nodes: [{ key: "a", title: "A", x: 50, y: 50 }, { key: "b", title: "B", x: 150, y: 50 }], edges: [] };
    expect(fitView(tiny, BOXES.desktop).scale).toBe(1);
    expect(fitView({ nodes: [], edges: [] }, BOXES.desktop)).toEqual({ scale: 1, x: 0, y: 0 });
    expect(fitView(tiny, { w: 0, h: 0 })).toEqual({ scale: 1, x: 0, y: 0 });
  });
});

describe("focusView (AC-3): the chosen node centred at a readable size", () => {
  for (const p of ["worked", "large"] as const) {
    for (const [name, box] of Object.entries(BOXES)) {
      test(`${p}, ${name} box: the node's centre lands on the box's centre at scale ≥ ${READABLE_SCALE} and ≥ the fit`, () => {
        const { layout } = layoutOf(p);
        const fit = fitView(layout, box);
        for (const n of [layout.nodes[0]!, layout.nodes[Math.floor(layout.nodes.length / 2)]!, layout.nodes.at(-1)!]) {
          const v = focusView(layout, n.key, box);
          expect(v.scale).toBeGreaterThanOrEqual(READABLE_SCALE);
          expect(v.scale).toBeGreaterThanOrEqual(fit.scale);
          expect(v.scale).toBeLessThanOrEqual(MAX_SCALE);
          expect(n.x * v.scale + v.x).toBeCloseTo(box.w / 2, 5);
          expect(n.y * v.scale + v.y).toBeCloseTo(box.h / 2, 5);
        }
      });
    }
  }

  test("a key that is not in the web gives the whole-web view", () => {
    const { layout } = layoutOf("worked");
    expect(focusView(layout, "NO-SUCH", BOXES.desktop)).toEqual(fitView(layout, BOXES.desktop));
  });
});

describe("neighbours: a node's link ends", () => {
  test("DEC-001 in the worked example = every part an edge joins it to, either way, no repeats, never itself", () => {
    const { spec, layout } = layoutOf("worked");
    const want = new Set<string>();
    for (const l of spec.links) { if (l.fromKey === "DEC-001") want.add(l.toKey); if (l.toKey === "DEC-001") want.add(l.fromKey); }
    want.delete("DEC-001");
    expect(want.size).toBeGreaterThan(0);
    const got = neighbours(layout, "DEC-001");
    expect(new Set(got)).toEqual(want);
    expect(got).toHaveLength(want.size);
    expect(neighbours(layout, "NO-SUCH")).toEqual([]);
  });
});

describe("zoomAt and panBy", () => {
  const v0: View = { scale: 0.5, x: 100, y: 40 };

  test("zooming keeps the point under the pointer where it is", () => {
    const [px, py] = [300, 200];
    const worldBefore = [(px - v0.x) / v0.scale, (py - v0.y) / v0.scale];
    const v1 = zoomAt(v0, 1.5, px, py);
    expect(v1.scale).toBeCloseTo(0.75, 10);
    expect([(px - v1.x) / v1.scale, (py - v1.y) / v1.scale][0]).toBeCloseTo(worldBefore[0]!, 8);
    expect([(px - v1.x) / v1.scale, (py - v1.y) / v1.scale][1]).toBeCloseTo(worldBefore[1]!, 8);
  });

  test("the scale stays between MIN_SCALE and MAX_SCALE however far you zoom", () => {
    expect(zoomAt(v0, 1e6, 0, 0).scale).toBe(MAX_SCALE);
    expect(zoomAt(v0, 1e-6, 0, 0).scale).toBe(MIN_SCALE);
  });

  test("panBy moves the view by the drag and leaves the scale", () => {
    expect(panBy(v0, 15, -9)).toEqual({ scale: 0.5, x: 115, y: 31 });
  });
});

// TASK-B-033 (SPEC v1.15, D-042): the page picks the layout shaped like its box, and at the desktop fit the names are readable.
describe("pickLayout and a readable fit (REQ-009 R1, TASK-B-033)", () => {
  const BOX = { desktop: { w: 1152, h: 500 }, phone: { w: 342, h: 444 } } as const; // the page's own boxes at 1440 and 390 (measured, TASK-B-031 probe)
  const B031 = { worked: 0.2589, large: 0.2463 } as const; // the fit scale of the ring layout at 1152×500 (TASK-B-031 probe) → names 3.6 / 3.4 px
  const both = (p: string) => {
    const spec = fixture<{ parts: ApiPart[]; links: ApiLink[] }>(`${p}-project`);
    const nodes = spec.parts.map((x) => ({ key: x.key, kind: x.kind, title: x.title, stuck: false }));
    return { wide: webLayout(nodes, spec.links, WEB_ASPECT.wide), tall: webLayout(nodes, spec.links, WEB_ASPECT.tall) };
  };

  test("a desktop box gets the wide layout, a phone box the tall one; with no tall layout, the wide one", () => {
    const { wide, tall } = both("worked");
    expect(pickLayout(wide, tall, BOX.desktop)).toBe(wide);
    expect(pickLayout(wide, tall, BOX.phone)).toBe(tall);
    expect(pickLayout(wide, undefined, BOX.phone)).toBe(wide);
    expect(pickLayout(wide, tall, { w: 0, h: 0 })).toBe(wide); // not measured yet
  });

  for (const p of ["worked", "large"] as const) {
    for (const [name, box] of Object.entries(BOX)) {
      test(`${p} in the ${name} box (${box.w}×${box.h}): the picked layout fills ≥ 85 % of the limiting dimension, every tile inside`, () => {
        const l = both(p);
        const lay = pickLayout(l.wide, l.tall, box);
        const v = fitView(lay, box);
        const rects = lay.nodes.map((n) => onScreen(n, v));
        const [x0, y0, x1, y1] = [Math.min(...rects.map((r) => r[0])), Math.min(...rects.map((r) => r[1])), Math.max(...rects.map((r) => r[2])), Math.max(...rects.map((r) => r[3]))];
        const fill = Math.max((x1 - x0) / (box.w - 2 * MARGIN), (y1 - y0) / (box.h - 2 * MARGIN));
        console.log(`${p} ${name}: fit scale ${v.scale.toFixed(3)} → names ${(14 * v.scale).toFixed(1)} px; fills ${(100 * fill).toFixed(0)} % of the limiting dimension`);
        expect(fill).toBeGreaterThanOrEqual(0.85);
        expect(x0).toBeGreaterThanOrEqual(MARGIN - 0.5);
        expect(y0).toBeGreaterThanOrEqual(MARGIN - 0.5);
        expect(x1).toBeLessThanOrEqual(box.w - MARGIN + 0.5);
        expect(y1).toBeLessThanOrEqual(box.h - MARGIN + 0.5);
      });
    }

    test(`${p} at the 1440 fit view: names are at least 10 px (D-042) — was ${(14 * B031[p]).toFixed(1)} px`, () => {
      const l = both(p);
      const v = fitView(pickLayout(l.wide, l.tall, BOX.desktop), BOX.desktop);
      expect(14 * v.scale).toBeGreaterThanOrEqual(10);
      expect(v.scale).toBeGreaterThan(B031[p]);
    });
  }
});
