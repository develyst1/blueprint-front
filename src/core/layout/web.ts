// Node web layout: every part a node, every link an edge. Deterministic (same input → same output, no randomness).
// Two stages (SPEC-B-001 v1.14 / v1.15):
//  1. the parts grouped on rings by kind — the work in the middle, then steps · participants · interactions · the rest —
//     ordered so linked parts sit near each other (fewer crossings, REQ-009 R4);
//  2. that picture packed into rows of tiles for a box of the wanted aspect (wide on a desktop, tall on a phone), so the whole
//     web is as small as it can be and the names are as big as they can be at the fit view (REQ-009 R1). Tiles are spaced by
//     `tileBox` — the box a theme's tile may fill — so they never touch at any zoom (`x`, `y` = the centre of a tile).
import type { PartKind } from "@/core/theme/contract";
import type { Layouts, UrlFreeWebLayout } from "@/core/model/build/types";
import { estimateLabel } from "./text";

export const WEB = { titlePx: 13, boxPadX: 12, boxPadY: 8, gap: 16, pad: 24 };

const RING_OF: Record<string, number> = {
  work: 0,
  step: 1,
  role: 2, screen: 2, api: 2, system: 2,
  interaction: 3,
};
/** The order kinds are listed in (a legend, a ring): the work first, then what it is made of. */
export const KIND_ORDER = ["work", "step", "role", "screen", "api", "system", "interaction", "data", "decision", "question"];
const byKey = (a: string, b: string) => a.localeCompare(b, "en", { numeric: true });

export function nodeBox(title: string) {
  const t = estimateLabel(title, WEB.titlePx);
  return { w: t.w + 2 * WEB.boxPadX, h: t.h + 2 * WEB.boxPadY };
}

/** Width ÷ height the two layouts are arranged for: a desktop box (1150 × 500 inside the page) and a phone box (342 × 444). */
export const WEB_ASPECT = { wide: 2.3, tall: 0.77 } as const;
/** Clear space between two tile boxes: across (a tile box already carries padding on each side) and down (rows). */
export const TILE_GAP = { x: 6, y: 12 } as const;
const TARGET = 44; // the desk's touch-target floor, which every theme's tile honours

/** The box a node's tile may fill, world px, centred on the node. Themes draw tiles of 14 px text (the layout counts 13),
 *  with a kind mark / icon on the left, 44 px tall; this is the generous bound the layout spaces tiles by and `fitView` keeps
 *  inside the view, so a tile that fits it is never cut at an edge nor touches its neighbour. A theme whose tiles are bigger
 *  must grow this, not its own tile. */
export function tileBox(n: { title: string }): { w: number; h: number } {
  const b = nodeBox(n.title);
  return { w: Math.ceil((b.w * 14) / 13) + 48, h: Math.max(b.h, TARGET) };
}

/** How many pairs of edges cross (REQ-009 AC-4): each edge is the straight segment between its two nodes' centres, as
 *  every theme draws it. Two edges that share a node meet at it and do not count; neither do touching or collinear ones.
 *  Pure, so "fewer crossings" is a test and not a feeling. */
export function webCrossings(layout: { nodes: { key: string; x: number; y: number }[]; edges: { from: string; to: string }[] }): number {
  const at = new Map(layout.nodes.map((n) => [n.key, n]));
  const segs = layout.edges.flatMap((e) => {
    const a = at.get(e.from), b = at.get(e.to);
    return a && b && e.from !== e.to ? [{ from: e.from, to: e.to, a, b }] : [];
  });
  const side = (p: { x: number; y: number }, q: { x: number; y: number }, r: { x: number; y: number }) => Math.sign((q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x));
  let crossings = 0;
  for (let i = 0; i < segs.length; i++) {
    for (let j = i + 1; j < segs.length; j++) {
      const s = segs[i]!, t = segs[j]!;
      if (s.from === t.from || s.from === t.to || s.to === t.from || s.to === t.to) continue; // they meet at a node
      if (side(s.a, s.b, t.a) * side(s.a, s.b, t.b) < 0 && side(t.a, t.b, s.a) * side(t.a, t.b, s.b) < 0) crossings++; // a proper crossing
    }
  }
  return crossings;
}

type In = Parameters<Layouts["web"]>[0][number];

type Links = Parameters<Layouts["web"]>[1];
type Placed = { n: In; x: number; y: number }[];

/** Stage 1: the rings (as shipped in TASK-B-031). Positions are the centres of the nodes, relative to the work at the middle. */
function ringPlacement(nodes: Parameters<Layouts["web"]>[0], links: Links): Placed {
  const kindRank = (k: string) => (KIND_ORDER.indexOf(k) + 1 || KIND_ORDER.length + 1);
  const sorted = [...nodes].sort((a, b) => kindRank(a.kind) - kindRank(b.kind) || byKey(a.key, b.key));
  const rings: In[][] = [[], [], [], [], []];
  for (const n of sorted) rings[RING_OF[n.kind] ?? 4]!.push(n);
  // More than one work: they share ring 0 like any other ring.

  // Who is linked to whom (any link kind, either direction), and the steps' own order — the layout groups linked parts
  // so fewer edges cross (REQ-009 R4): a ring's nodes are ordered by where the parts they link to already sit.
  const linked = new Map<string, Set<string>>();
  for (const l of links) {
    (linked.get(l.fromKey) ?? linked.set(l.fromKey, new Set()).get(l.fromKey)!).add(l.toKey);
    (linked.get(l.toKey) ?? linked.set(l.toKey, new Set()).get(l.toKey)!).add(l.fromKey);
  }
  const stepAt = new Map<string, number>();
  for (const l of links) if (l.kind === "has_step") stepAt.set(l.toKey, Math.min(stepAt.get(l.toKey) ?? Infinity, l.position ?? Infinity));
  const TAU = 2 * Math.PI;
  const apart = (a: number, b: number) => Math.abs(((a - b + Math.PI) % TAU + TAU) % TAU - Math.PI); // shortest way round
  const angleOf = new Map<string, number>(); // the angle each placed node sits at (the centre work has none)
  /** Where a node "wants" to be: the circular mean of the angles of the parts it links to that are already placed. */
  const wanted = (n: In): number | null => {
    let sx = 0, sy = 0;
    for (const k of linked.get(n.key) ?? []) { const a = angleOf.get(k); if (a !== undefined) { sx += Math.cos(a); sy += Math.sin(a); } }
    return Math.hypot(sx, sy) < 1e-9 ? null : Math.atan2(sy, sx);
  };

  const diag = (n: In) => { const b = nodeBox(n.title); return Math.hypot(b.w, b.h); };
  // 1. The radius of every ring (as before): neighbours at least one box diagonal + gap apart (chord), clear of the ring inside.
  const radius: number[] = [];
  let prevR = 0, prevDiag = 0;
  rings.forEach((ring, k) => {
    if (!ring.length) return;
    const d = Math.max(...ring.map(diag));
    if (k === 0 && ring.length === 1) radius[k] = 0;
    else {
      const chord = ring.length > 1 ? (d + WEB.gap) / (2 * Math.sin(Math.PI / ring.length)) : 0;
      radius[k] = Math.max(chord, prevR + (prevDiag + d) / 2 + WEB.gap);
    }
    prevR = radius[k]!;
    prevDiag = d;
  });

  // 2. Place one ring. Steps keep their order in the work; any other ring is ordered by the wanted angle of its nodes
  //    (those with none go last, in the old kind/key order), spread evenly — so no two boxes can touch — and turned to
  //    the rotation whose slots sit closest to the wanted angles.
  const arrange = (k: number, ring: In[]): In[] => {
    const want = new Map(ring.map((n) => [n.key, k <= 1 ? null : wanted(n)] as const));
    const ordered = k === 1
      ? [...ring].sort((a, b) => (stepAt.get(a.key) ?? Infinity) - (stepAt.get(b.key) ?? Infinity) || byKey(a.key, b.key))
      : k === 0 ? ring
      : [...ring].sort((a, b) => (want.get(a.key) ?? Infinity) - (want.get(b.key) ?? Infinity) || kindRank(a.kind) - kindRank(b.kind) || byKey(a.key, b.key));
    let turn = -Math.PI / 2 + (k % 2 ? Math.PI / ring.length : 0);
    const aims = ordered.map((n, i) => ({ i, a: want.get(n.key) })).filter((x): x is { i: number; a: number } => x.a != null);
    if (aims.length) {
      let best = Infinity;
      for (const c of aims) {
        const t = c.a - (TAU * c.i) / ring.length;
        const cost = aims.reduce((s, x) => s + apart(t + (TAU * x.i) / ring.length, x.a), 0);
        if (cost < best - 1e-9) { best = cost; turn = t; }
      }
    }
    ordered.forEach((n, i) => { if (radius[k]! > 0) angleOf.set(n.key, turn + (TAU * i) / ring.length); });
    return ordered;
  };
  const ordered: In[][] = rings.map((ring, k) => (ring.length ? arrange(k, ring) : ring));
  const where = () => ordered.flatMap((ring, k) => ring.map((n) => {
    const a = angleOf.get(n.key) ?? 0, r = radius[k] ?? 0;
    return { n, x: r * Math.cos(a), y: r * Math.sin(a) };
  }));
  const crossingsNow = () => webCrossings({ nodes: where().map((p) => ({ key: p.n.key, x: p.x, y: p.y })), edges: links.map((l) => ({ from: l.fromKey, to: l.toKey })) });

  // 3. Sweeps: now that every ring has a place, order the outer rings again by ALL the parts each node links to (inside
  //    and outside), keep the arrangement with the fewest crossings. Deterministic; at most a handful of rounds.
  let best = { crossings: crossingsNow(), ordered: ordered.map((r) => [...r]), angles: new Map(angleOf) };
  for (let sweep = 0; sweep < 6 && best.crossings > 0; sweep++) {
    for (let k = 2; k < rings.length; k++) if (ordered[k]!.length) ordered[k] = arrange(k, ordered[k]!);
    const c = crossingsNow();
    if (c < best.crossings) best = { crossings: c, ordered: ordered.map((r) => [...r]), angles: new Map(angleOf) };
  }
  best.ordered.forEach((r, k) => { ordered[k] = r; });
  angleOf.clear();
  best.angles.forEach((a, key) => angleOf.set(key, a));
  return where();
}

// ---------- Stage 2: rows of tiles for a box of the wanted aspect ----------
type Tile = { n: In; w: number; h: number; x: number; y: number };
type Rows = Tile[][];
const REF_H = 400;      // the box the candidates are compared in: this tall and `aspect` times as wide (the page's own box differs a little)
const ANGLES = 48;      // directions to read the rings in (every 3.75°) — rows are cut along one of them
const NEAR = 0.85;      // a candidate counts as fitting about as well as the best one from this fraction of its score …
const TRY = 80;         // … and of those, this many (best-fitting first) get their crossings counted, …
const POLISH = 3;       // … and the fewest-crossing ones among them get the reorder sweeps
const SWEEPS = 8;
const PASSES = 3;       // passes of neighbour swaps

/** Pack the rows one under another, each centred: the centre of every tile and the size of the whole. */
function pack(rows: Rows, rowH: number) {
  const widths = rows.map((r) => r.reduce((s, t) => s + t.w, 0) + TILE_GAP.x * Math.max(0, r.length - 1));
  const W = Math.max(0, ...widths);
  const at = new Map<string, { x: number; y: number }>();
  rows.forEach((r, ri) => {
    let x = (W - widths[ri]!) / 2;
    for (const t of r) { at.set(t.n.key, { x: x + t.w / 2, y: ri * (rowH + TILE_GAP.y) + rowH / 2 }); x += t.w + TILE_GAP.x; }
  });
  return { at, W, H: rows.length * (rowH + TILE_GAP.y) - TILE_GAP.y };
}

/** Cut the tiles, in reading order, into R rows of about the same total width. */
function cut(seq: Tile[], R: number): Rows {
  const T = seq.reduce((s, t) => s + t.w + TILE_GAP.x, 0) / R;
  const rows: Rows = [];
  let row: Tile[] = [], rw = 0;
  for (const t of seq) {
    row.push(t);
    rw += t.w + TILE_GAP.x;
    if (rw >= T && rows.length < R - 1) { rows.push(row); row = []; rw = 0; }
  }
  if (row.length) rows.push(row);
  return rows;
}

export function webLayout(nodes: Parameters<Layouts["web"]>[0], links: Links, aspect: number = WEB_ASPECT.wide): UrlFreeWebLayout {
  const edges = links.map((l) => ({ id: l.id, kind: l.kind, from: l.fromKey, to: l.toKey }));
  const placed = ringPlacement(nodes, links);
  if (!placed.length) return { width: Math.ceil(2 * WEB.pad), height: Math.ceil(2 * WEB.pad), nodes: [], edges };

  const base: Tile[] = placed.map((p) => ({ n: p.n, ...tileBox(p.n), x: p.x, y: p.y }));
  const rowH = Math.max(TARGET, ...base.map((t) => t.h));
  const scoreOf = (W: number, H: number) => Math.min(1, (REF_H * aspect) / W, REF_H / H); // the scale the web would fit at, in the reference box
  const edgeList = links.map((l) => ({ from: l.fromKey, to: l.toKey }));
  const crossingsOf = (rows: Rows) => {
    const { at } = pack(rows, rowH);
    return webCrossings({ nodes: [...at].map(([key, p]) => ({ key, ...p })), edges: edgeList });
  };

  // every direction × every number of rows: how well does it fit a box of this aspect?
  type Cand = { rows: Rows; score: number; area: number; order: number };
  const cands: Cand[] = [];
  for (let a = 0; a < ANGLES; a++) {
    const c = Math.cos((Math.PI * a) / ANGLES), s = Math.sin((Math.PI * a) / ANGLES);
    const rot = base.map((t) => ({ t, rx: t.x * c - t.y * s, ry: t.x * s + t.y * c }));
    const seq = [...rot].sort((p, q) => p.ry - q.ry || p.rx - q.rx || byKey(p.t.n.key, q.t.n.key));
    const rx = new Map(rot.map((r) => [r.t.n.key, r.rx]));
    for (let R = 1; R <= base.length; R++) {
      const rows = cut(seq.map((x) => x.t), R);
      const sorted = rows.map((r) => [...r].sort((p, q) => rx.get(p.n.key)! - rx.get(q.n.key)! || byKey(p.n.key, q.n.key)));
      const { W, H } = pack(sorted, rowH);
      cands.push({ rows: sorted, score: scoreOf(W, H), area: W * H, order: a * 1000 + R });
    }
  }
  cands.sort((p, q) => q.score - p.score || p.area - q.area || p.order - q.order);
  const near = cands.filter((c) => c.score >= NEAR * cands[0]!.score).slice(0, TRY); // fits (almost) as well as the best
  const counted = near.map((c) => ({ ...c, crossings: crossingsOf(c.rows) }));
  counted.sort((p, q) => p.crossings - q.crossings || q.score - p.score || p.order - q.order);

  // reorder each row by where the parts it links to sit in the other rows (barycentre sweeps), keep what crosses less
  const next = new Map<string, string[]>();
  for (const l of links) {
    if (l.fromKey === l.toKey) continue;
    (next.get(l.fromKey) ?? next.set(l.fromKey, []).get(l.fromKey)!).push(l.toKey);
    (next.get(l.toKey) ?? next.set(l.toKey, []).get(l.toKey)!).push(l.fromKey);
  }
  const polish = (start: Rows, startCrossings: number) => {
    let rows = start, best = startCrossings;
    for (let sweep = 0; sweep < SWEEPS && best > 0; sweep++) {
      let changed = false;
      const order = rows.map((_, i) => i);
      if (sweep % 2) order.reverse();
      for (const ri of order) {
        const { at } = pack(rows, rowH);
        const rowOf = new Map<string, number>();
        rows.forEach((r, i) => r.forEach((t) => rowOf.set(t.n.key, i)));
        const mean = (t: Tile) => {
          const xs = (next.get(t.n.key) ?? []).filter((k) => rowOf.get(k) !== ri && at.has(k)).map((k) => at.get(k)!.x);
          return xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : at.get(t.n.key)!.x;
        };
        const reordered = rows[ri]!.map((t, i) => ({ t, i, m: mean(t) })).sort((p, q) => p.m - q.m || p.i - q.i).map((o) => o.t);
        if (reordered.every((t, i) => t === rows[ri]![i])) continue;
        const trial = rows.map((r, i) => (i === ri ? reordered : r));
        const c = crossingsOf(trial);
        if (c < best) { best = c; rows = trial; changed = true; }
      }
      if (!changed) break;
    }
    // then neighbours in a row swapped one pair at a time, while that crosses less
    for (let pass = 0; pass < PASSES && best > 0; pass++) {
      let changed = false;
      for (let ri = 0; ri < rows.length && best > 0; ri++) {
        for (let i = 0; i + 1 < rows[ri]!.length && best > 0; i++) {
          const swapped = rows[ri]!.map((t, k) => (k === i ? rows[ri]![i + 1]! : k === i + 1 ? rows[ri]![i]! : t));
          const trial = rows.map((r, k) => (k === ri ? swapped : r));
          const c = crossingsOf(trial);
          if (c < best) { best = c; rows = trial; changed = true; }
        }
      }
      if (!changed) break;
    }
    return { rows, crossings: best };
  };
  const finalists = counted.slice(0, POLISH).map((c) => ({ ...polish(c.rows, c.crossings), score: c.score, order: c.order }));
  finalists.sort((p, q) => p.crossings - q.crossings || q.score - p.score || p.order - q.order);
  const win = finalists[0]!;

  const { at, W, H } = pack(win.rows, rowH);
  return {
    width: Math.ceil(W + 2 * WEB.pad),
    height: Math.ceil(H + 2 * WEB.pad),
    nodes: win.rows.flat().map((t) => ({
      key: t.n.key, kind: t.n.kind as PartKind, title: t.n.title, stuck: t.n.stuck,
      x: at.get(t.n.key)!.x + WEB.pad, y: at.get(t.n.key)!.y + WEB.pad,
    })),
    edges,
  };
}
