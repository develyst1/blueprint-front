// The view of the node web, pure (REQ-009, SPEC-B-001 v1.14): what part of the layout the box shows. A view is
// `screen = world × scale + (x, y)`. Every theme draws the web through `useWebView`, which is built on these — a theme
// never computes a transform itself, so the three themes zoom, centre and fit the same way.
import { tileBox } from "@/core/layout/web";

export { tileBox }; // moved to the layout (it spaces tiles by it); every import of it from here keeps working

export interface Box { w: number; h: number }
export interface View { scale: number; x: number; y: number }
type Node = { key: string; title: string; x: number; y: number };
type Layout = { nodes: Node[]; edges: { from: string; to: string }[] };

export const MARGIN = 24;          // free space around the whole web on open (px, on screen)
export const MIN_SCALE = 0.1;      // zooming out stops here
export const MAX_SCALE = 3;        // zooming in stops here
export const READABLE_SCALE = 1;   // a chosen node is shown at least at its own size: 14 px text is 14 px

const IDENTITY: View = { scale: 1, x: 0, y: 0 };
const clamp = (s: number) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, s));

/** Which of the web's two layouts suits the box: the one whose width ÷ height is nearer the box's (SPEC v1.15) — the wide one for a
 *  desktop box, the tall one for a phone. With no tall layout, or a box not measured yet, the wide one. */
export function pickLayout<L extends { width: number; height: number }>(wide: L, tall: L | undefined, box: Box): L {
  if (!tall || box.w <= 0 || box.h <= 0) return wide;
  const off = (l: L) => Math.abs(Math.log(l.width / l.height / (box.w / box.h)));
  return off(tall) < off(wide) ? tall : wide;
}

/** The whole web inside the box, margin all round, centred; never enlarged past 1:1 (a small web stays its size). */
export function fitView(layout: Layout, box: Box, margin = MARGIN): View {
  if (!layout.nodes.length || box.w <= 0 || box.h <= 0) return IDENTITY;
  const rects = layout.nodes.map((n) => { const t = tileBox(n); return { l: n.x - t.w / 2, t: n.y - t.h / 2, r: n.x + t.w / 2, b: n.y + t.h / 2 }; });
  const [l, t, r, b] = [Math.min(...rects.map((x) => x.l)), Math.min(...rects.map((x) => x.t)), Math.max(...rects.map((x) => x.r)), Math.max(...rects.map((x) => x.b))];
  const scale = clamp(Math.min(1, (box.w - 2 * margin) / (r - l), (box.h - 2 * margin) / (b - t)));
  return { scale, x: (box.w - (r - l) * scale) / 2 - l * scale, y: (box.h - (b - t) * scale) / 2 - t * scale };
}

/** One node centred in the box at a readable size — at least its own size, and at least the whole-web scale. */
export function focusView(layout: Layout, key: string, box: Box): View {
  const node = layout.nodes.find((n) => n.key === key);
  if (!node) return fitView(layout, box);
  const scale = clamp(Math.max(fitView(layout, box).scale, READABLE_SCALE));
  return { scale, x: box.w / 2 - node.x * scale, y: box.h / 2 - node.y * scale };
}

/** The parts an edge joins to this one, either way, each once, in edge order; never itself. */
export function neighbours(layout: Layout, key: string): string[] {
  const out: string[] = [];
  for (const e of layout.edges) {
    const other = e.from === key ? e.to : e.to === key ? e.from : null;
    if (other && other !== key && !out.includes(other)) out.push(other);
  }
  return out;
}

/** Zoom by `factor` keeping the screen point (px, py) over the same spot of the web. */
export function zoomAt(view: View, factor: number, px: number, py: number): View {
  const scale = clamp(view.scale * factor);
  const k = scale / view.scale;
  return { scale, x: px - (px - view.x) * k, y: py - (py - view.y) * k };
}

/** Move the view by a drag of (dx, dy) screen px. */
export const panBy = (view: View, dx: number, dy: number): View => ({ ...view, x: view.x + dx, y: view.y + dy });
