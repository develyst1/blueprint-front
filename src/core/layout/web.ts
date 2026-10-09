// Node web layout: every part a node, every link an edge. Deterministic (same input → same output, no randomness):
// the work in the middle, then rings by kind group — steps · participants · interactions · everything else —
// each ring wide enough that no two node boxes touch (`x`, `y` = the centre of a node's box).
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
const KIND_ORDER = ["work", "step", "role", "screen", "api", "system", "interaction", "data", "decision", "question"];
const byKey = (a: string, b: string) => a.localeCompare(b, "en", { numeric: true });

export function nodeBox(title: string) {
  const t = estimateLabel(title, WEB.titlePx);
  return { w: t.w + 2 * WEB.boxPadX, h: t.h + 2 * WEB.boxPadY };
}

type In = Parameters<Layouts["web"]>[0][number];

export function webLayout(nodes: Parameters<Layouts["web"]>[0], links: Parameters<Layouts["web"]>[1]): UrlFreeWebLayout {
  const kindRank = (k: string) => (KIND_ORDER.indexOf(k) + 1 || KIND_ORDER.length + 1);
  const sorted = [...nodes].sort((a, b) => kindRank(a.kind) - kindRank(b.kind) || byKey(a.key, b.key));
  const rings: In[][] = [[], [], [], [], []];
  for (const n of sorted) rings[RING_OF[n.kind] ?? 4]!.push(n);
  // More than one work: they share ring 0 like any other ring.

  const diag = (n: In) => { const b = nodeBox(n.title); return Math.hypot(b.w, b.h); };
  const placed: { n: In; x: number; y: number }[] = [];
  let prevR = 0, prevDiag = 0;
  rings.forEach((ring, k) => {
    if (!ring.length) return;
    const d = Math.max(...ring.map(diag));
    let r: number;
    if (k === 0 && ring.length === 1) r = 0;
    else {
      // neighbours on the ring at least one box diagonal + gap apart (chord), and clear of the ring inside it
      const chord = ring.length > 1 ? (d + WEB.gap) / (2 * Math.sin(Math.PI / ring.length)) : 0;
      r = Math.max(chord, prevR + (prevDiag + d) / 2 + WEB.gap);
    }
    ring.forEach((n, i) => {
      const a = -Math.PI / 2 + (2 * Math.PI * i) / ring.length + (k % 2 ? Math.PI / ring.length : 0);
      placed.push({ n, x: r * Math.cos(a), y: r * Math.sin(a) });
    });
    prevR = r;
    prevDiag = d;
  });

  // Move to the top-left origin.
  const minX = Math.min(...placed.map((p) => p.x - nodeBox(p.n.title).w / 2));
  const minY = Math.min(...placed.map((p) => p.y - nodeBox(p.n.title).h / 2));
  const out = placed.map((p) => ({
    key: p.n.key, kind: p.n.kind as PartKind, title: p.n.title, stuck: p.n.stuck,
    x: Math.round(p.x - minX + WEB.pad), y: Math.round(p.y - minY + WEB.pad),
  }));
  const maxX = Math.max(0, ...out.map((p) => p.x + nodeBox(p.title).w / 2));
  const maxY = Math.max(0, ...out.map((p) => p.y + nodeBox(p.title).h / 2));
  return {
    width: Math.ceil(maxX + WEB.pad),
    height: Math.ceil(maxY + WEB.pad),
    nodes: out,
    edges: links.map((l) => ({ id: l.id, kind: l.kind, from: l.fromKey, to: l.toKey })),
  };
}
