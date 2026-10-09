// Flowchart layout — positions for the theme to draw (px, origin top-left). Pure and deterministic.
//
// Carried over from the round-1 mockups (mockups/shared.js flowLayout, TASK-B-001): longest-path layers, a bend slot
// in every layer a long arrow crosses, rows ordered by a backward barycentre sweep. Added here:
//  - back edges (a loop in the flow) are found first and left out of the layering, then routed around everything;
//  - real boxes in both directions from the same layering (LR: layers left→right · TB: layers top→bottom);
//  - a long arrow crosses each layer horizontally (LR) / vertically (TB) through its own empty slot, so every other
//    segment lies inside a gap between layers — no arrow can cross a node box it does not start or end at;
//  - LR: the gap between layers is wide enough for the widest label, and a label's anchor sits on its arrow inside
//    that gap, past the fork (Team C Q3), far enough along that the labels of one fork stay ≥ 8 px apart;
//  - TB (TASK-B-010): each gap is only what its own labels need — label height + 2 × 12 px, else 48 px — and a fork's
//    labels sit side by side in the middle of it, the rows spread wide enough to keep them ≥ 8 px apart.
// A label's box is its plaque, conditionBox (text.ts) — measured against what the themes draw.
import type { FlowLayout, Point } from "@/core/theme/contract";
import type { ApiFlowchart } from "@/core/model/build/types";
import { conditionBox, estimateLabel } from "./text";

export const FLOW = {
  titlePx: 15,
  labelPx: 14,
  minW: 160,
  maxW: 280,
  padX: 16, // inside a node box, each side
  h: 64,
  rowGap: 48, // between two nodes of one layer — "one node-gap"
  labelMargin: 12, // clear space around a label box
  labelClear: 8, // between two labels of one fork (TASK-B-010)
  pad: 24, // around the whole drawing
};

type Slot = { layer: number; index: number };
type Chain = { from: string; to: string; label: string | null; slots: string[]; back: boolean };

/** The bits of the round-1 algorithm: layers, bend slots, row order. Direction-free. */
function arrange(diagram: ApiFlowchart) {
  const keys = diagram.nodes.map((n) => n.key);
  const known = new Set(keys);
  const arrows = diagram.arrows.filter((a) => known.has(a.from) && known.has(a.to));
  const pos = new Map(diagram.nodes.map((n, i) => [n.key, n.position ?? 1e6 + i]));

  // Back edges: depth-first from each node in position order; an arrow into a node still on the stack closes a loop.
  const out = new Map(keys.map((k) => [k, arrows.filter((a) => a.from === k)]));
  const state = new Map<string, 0 | 1 | 2>(keys.map((k) => [k, 0]));
  const back = new Set<(typeof arrows)[number]>();
  const visit = (k: string) => {
    state.set(k, 1);
    for (const a of out.get(k)!) {
      if (state.get(a.to) === 1) back.add(a);
      else if (state.get(a.to) === 0) visit(a.to);
    }
    state.set(k, 2);
  };
  for (const k of [...keys].sort((a, b) => pos.get(a)! - pos.get(b)!)) if (state.get(k) === 0) visit(k);
  const forward = arrows.filter((a) => !back.has(a));

  // Longest-path layers over the forward arrows (a DAG now, so this settles).
  const layer = new Map(keys.map((k) => [k, 0]));
  for (let pass = 0; pass < keys.length; pass++) {
    for (const a of forward) layer.set(a.to, Math.max(layer.get(a.to)!, layer.get(a.from)! + 1));
  }
  const depth = keys.length ? Math.max(...layer.values()) + 1 : 0;
  const members: string[][] = Array.from({ length: depth }, () => []);
  const succ = new Map<string, string[]>();
  keys.forEach((k) => members[layer.get(k)!]!.push(k));

  const chains: Chain[] = arrows.map((a, ai) => {
    const slots: string[] = [];
    if (!back.has(a)) {
      let prev = a.from;
      for (let L = layer.get(a.from)! + 1; L < layer.get(a.to)!; L++) {
        const id = `bend:${ai}:${L}`;
        members[L]!.push(id);
        pos.set(id, pos.get(a.to)!);
        layer.set(id, L);
        slots.push(id);
        if (!succ.has(prev)) succ.set(prev, []);
        succ.get(prev)!.push(id);
        prev = id;
      }
      if (!succ.has(prev)) succ.set(prev, []);
      succ.get(prev)!.push(a.to);
    }
    return { from: a.from, to: a.to, label: a.label, slots, back: back.has(a) };
  });

  // Backward barycentre sweep (round 1, unchanged).
  if (depth) members[depth - 1]!.sort((a, b) => pos.get(a)! - pos.get(b)!);
  for (let L = depth - 2; L >= 0; L--) {
    const next = members[L + 1]!;
    const bary = (k: string) => {
      const s = (succ.get(k) ?? []).map((x) => next.indexOf(x)).filter((i) => i >= 0);
      return s.length ? s.reduce((x, y) => x + y, 0) / s.length : next.length + pos.get(k)!;
    };
    members[L]!.sort((a, b) => bary(a) - bary(b) || pos.get(a)! - pos.get(b)!);
  }

  const slot = new Map<string, Slot>();
  members.forEach((m, L) => m.forEach((k, i) => slot.set(k, { layer: L, index: i })));
  const maxRows = Math.max(1, ...members.map((m) => m.length));
  return { depth, maxRows, members, slot, chains };
}

export function flowLayout(diagram: ApiFlowchart, direction: "LR" | "TB"): FlowLayout {
  const { depth, maxRows, members, slot, chains } = arrange(diagram);
  const c = FLOW;
  const labels = new Map(chains.filter((ch) => ch.label).map((ch) => [ch, conditionBox(ch.label!, c.labelPx)]));
  const maxLabel = { w: Math.max(0, ...[...labels.values()].map((l) => l.w)), h: Math.max(0, ...[...labels.values()].map((l) => l.h)) };
  const W = Math.min(c.maxW, Math.max(c.minW, ...diagram.nodes.map((n) => estimateLabel(n.title, c.titlePx).w + 2 * c.padX)));
  const H = c.h;
  const hasBack = chains.some((ch) => ch.back);

  // Between rows (across the flow). TB: two labels of a fork sit side by side halfway between their parent and the
  // children one row-step apart, so their centres are (W + rowGap) / 2 apart — enough for the two widest + the clearance.
  const tMax = 0.85;
  const rowGap = direction === "LR"
    ? c.rowGap
    : Math.max(c.rowGap, 2 * maxLabel.w + 2 * c.labelClear - W);
  const back = hasBack ? 2 * c.rowGap : 0; // a lane outside everything for loops

  // across = position across the flow, mapped to y (LR) / x (TB).
  const span = direction === "LR" ? H : W; // a node's size across the flow
  const acrossOf = (index: number, count: number) =>
    c.pad + back + ((maxRows - count) / 2 + index) * (span + rowGap);
  const acrossMid = (k: string) => { const s = slot.get(k)!; return acrossOf(s.index, members[s.layer]!.length) + span / 2; };

  // Between layers (along the flow). LR: one width for every gap — a label lies across it. TB: gap L (below layer L) is
  // what the labels starting in it need — their plaque + 2 × 12 px — and, for a label whose arrow drops nearly straight,
  // enough length that its anchor (mid-gap) is more than one node-gap past the fork; a gap with no label is 48 px.
  const lrGap = Math.max(120, maxLabel.w + 2 * c.labelMargin);
  const gaps = Array.from({ length: Math.max(0, depth - 1) }, () => (direction === "LR" ? lrGap : c.rowGap));
  if (direction === "TB") {
    for (const ch of chains) {
      const size = labels.get(ch);
      if (!size || ch.back) continue;
      const L = slot.get(ch.from)!.layer;
      const dx = Math.abs(acrossMid(ch.slots[0] ?? ch.to) - acrossMid(ch.from));
      const past = 2 * (c.rowGap + 1); // anchor at mid-gap: ½·hypot(dx, gap) > rowGap
      const straight = dx < past ? Math.ceil(Math.sqrt(past * past - dx * dx)) : 0;
      gaps[L] = Math.max(gaps[L]!, size.h + 2 * c.labelMargin, straight);
    }
  }
  const gapAfter = (layer: number) => gaps[layer] ?? c.rowGap;
  const alongStart = gaps.reduce<number[]>((acc, g) => [...acc, acc.at(-1)! + (direction === "LR" ? W : H) + g], [c.pad]);
  const alongOf = (layer: number) => alongStart[layer]!;
  const box = (k: string) => {
    const s = slot.get(k)!;
    const along = alongOf(s.layer), across = acrossOf(s.index, members[s.layer]!.length);
    return direction === "LR" ? { x: along, y: across, w: W, h: H } : { x: across, y: along, w: W, h: H };
  };

  const nodes = diagram.nodes.map((n) => ({
    key: n.key, ...box(n.key), layer: slot.get(n.key)!.layer, isBranch: n.isBranch, ends: n.ends,
  }));

  const exitOf = (b: { x: number; y: number; w: number; h: number }): Point =>
    direction === "LR" ? { x: b.x + b.w, y: b.y + b.h / 2 } : { x: b.x + b.w / 2, y: b.y + b.h };
  const entryOf = (b: { x: number; y: number; w: number; h: number }): Point =>
    direction === "LR" ? { x: b.x, y: b.y + b.h / 2 } : { x: b.x + b.w / 2, y: b.y };
  const outside = c.pad + back / 2; // the loop lane: above everything (LR) / left of everything (TB)

  const edges = chains.map((ch) => {
    const a = box(ch.from), b = box(ch.to);
    let points: Point[];
    if (ch.back) {
      const s = exitOf(a), e = entryOf(b);
      const fromLayer = slot.get(ch.from)!.layer, toLayer = slot.get(ch.to)!.layer;
      const out = (direction === "LR" ? s.x : s.y) + gapAfter(fromLayer) / 2;
      const into = (direction === "LR" ? e.x : e.y) - gapAfter(toLayer - 1) / 2;
      points = direction === "LR"
        ? [s, { x: out, y: s.y }, { x: out, y: outside }, { x: into, y: outside }, { x: into, y: e.y }, e]
        : [s, { x: s.x, y: out }, { x: outside, y: out }, { x: outside, y: into }, { x: e.x, y: into }, e];
    } else {
      points = [exitOf(a)];
      for (const id of ch.slots) {
        const sb = box(id);
        points.push(entryOf(sb), exitOf(sb)); // straight through its own empty slot
      }
      points.push(entryOf(b));
    }
    return { from: ch.from, to: ch.to, label: ch.label, points, labelAnchor: null as Point | null, chain: ch };
  });

  // Label anchors, one fork (= arrows from one node) at a time.
  const at = (p: Point, q: Point, t: number): Point => ({ x: p.x + (q.x - p.x) * t, y: p.y + (q.y - p.y) * t });
  const forks = new Map<string, typeof edges>();
  for (const e of edges) if (e.label) (forks.get(e.from) ?? forks.set(e.from, []).get(e.from)!).push(e);
  for (const fork of forks.values()) {
    for (const e of fork.filter((x) => x.chain.back)) {
      e.labelAnchor = at(e.points[2]!, e.points[3]!, 0.5); // the loop's long run outside everything
    }
    const fwd = fork.filter((x) => !x.chain.back);
    const sizes = fwd.map((x) => labels.get(x.chain)!);
    let t = 0.5;
    const clear = (tt: number) => fwd.every((x, i) => fwd.every((y, j) => {
      if (j <= i) return true;
      const p = at(x.points[0]!, x.points[1]!, tt), q = at(y.points[0]!, y.points[1]!, tt);
      const dx = Math.abs(p.x - q.x) - (sizes[i]!.w + sizes[j]!.w) / 2;
      const dy = Math.abs(p.y - q.y) - (sizes[i]!.h + sizes[j]!.h) / 2;
      return dx >= c.labelClear || dy >= c.labelClear;
    }));
    // TB: mid-gap — the gap was sized for exactly that; LR: slide along the gap until the fork's labels are clear
    if (direction === "LR") while (t < tMax && !clear(t)) t = Math.min(tMax, t + 0.05);
    for (const x of fwd) x.labelAnchor = at(x.points[0]!, x.points[1]!, t);
  }

  const allX = [...nodes.flatMap((n) => [n.x + n.w]), ...edges.flatMap((e) => e.points.map((p) => p.x))];
  const allY = [...nodes.flatMap((n) => [n.y + n.h]), ...edges.flatMap((e) => e.points.map((p) => p.y))];
  return {
    direction,
    width: depth ? Math.ceil(Math.max(...allX) + c.pad) : 0,
    height: depth ? Math.ceil(Math.max(...allY) + c.pad) : 0,
    nodes,
    edges: edges.map(({ chain: _chain, ...e }) => e),
  };
}
