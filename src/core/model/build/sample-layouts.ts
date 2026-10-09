// sample positions — the real layout is TASK-B-006.
// Simple and honest: longest-path layers on a grid, participants at fixed x, messages one row apart, the node web on
// a circle with the work in the middle. Good enough to draw; not tuned for readability.
import type { PartKind, ParticipantVM, Point } from "@/core/theme/contract";
import type { ApiFlowchart, Layouts } from "./types";

function flow(diagram: ApiFlowchart, direction: "LR" | "TB") {
  const keys = diagram.nodes.map((n) => n.key);
  const layer = new Map(keys.map((k) => [k, 0]));
  for (let i = 0; i < keys.length; i++) {
    for (const a of diagram.arrows) if (layer.has(a.from) && layer.has(a.to)) layer.set(a.to, Math.max(layer.get(a.to)!, layer.get(a.from)! + 1));
  }
  const row = new Map<string, number>();
  const used = new Map<number, number>();
  for (const k of keys) { const l = layer.get(k)!; row.set(k, used.get(l) ?? 0); used.set(l, (used.get(l) ?? 0) + 1); }
  const W = 160, H = 56, GAP_L = 80, GAP_R = 40, PAD = 20;
  const at = (k: string) => {
    const l = layer.get(k) ?? 0, r = row.get(k) ?? 0;
    return direction === "LR" ? { x: PAD + l * (W + GAP_L), y: PAD + r * (H + GAP_R) } : { x: PAD + r * (W + GAP_R), y: PAD + l * (H + GAP_L) };
  };
  const nodes = diagram.nodes.map((n) => ({ key: n.key, ...at(n.key), w: W, h: H, layer: layer.get(n.key) ?? 0, isBranch: n.isBranch, ends: n.ends }));
  const edges = diagram.arrows.map((a) => {
    const p = at(a.from), q = at(a.to);
    const start: Point = direction === "LR" ? { x: p.x + W, y: p.y + H / 2 } : { x: p.x + W / 2, y: p.y + H };
    const end: Point = direction === "LR" ? { x: q.x, y: q.y + H / 2 } : { x: q.x + W / 2, y: q.y };
    // a third of the way along: after the fork, never at the split
    const labelAnchor = a.label ? { x: start.x + (end.x - start.x) / 3, y: start.y + (end.y - start.y) / 3 } : null;
    return { from: a.from, to: a.to, label: a.label, points: [start, end], labelAnchor };
  });
  const width = nodes.length ? Math.max(...nodes.map((n) => n.x + n.w)) + PAD : 0;
  const height = nodes.length ? Math.max(...nodes.map((n) => n.y + n.h)) + PAD : 0;
  return { direction, width, height, nodes, edges };
}

function swimLanes(lanes: ParticipantVM[]) {
  return lanes.map((p, index) => ({ ...p, index }));
}

function sequence(participants: ParticipantVM[], messages: Parameters<Layouts["sequence"]>[1]) {
  return {
    width: 100 + participants.length * 180,
    height: 80 + messages.length * 56 + 40,
    participants: participants.map((p, i) => ({ ...p, x: 100 + i * 180 })),
    messages: messages.map((m, i) => ({ key: m.key, order: i + 1, y: 80 + (i + 1) * 56, from: m.from, to: m.to, text: m.text, reply: m.reply })),
  };
}

function web(nodes: { key: string; kind: PartKind | string; title: string; stuck: boolean }[], links: Parameters<Layouts["web"]>[1]) {
  const size = 720, c = size / 2, r = 300;
  const centre = nodes.find((n) => n.kind === "work");
  const ring = nodes.filter((n) => n !== centre);
  const placed = [
    ...(centre ? [{ ...centre, x: c, y: c }] : []),
    ...ring.map((n, i) => {
      const a = (2 * Math.PI * i) / Math.max(ring.length, 1) - Math.PI / 2;
      return { ...n, x: Math.round(c + r * Math.cos(a)), y: Math.round(c + r * Math.sin(a)) };
    }),
  ];
  return {
    width: size,
    height: size,
    nodes: placed.map((n) => ({ key: n.key, kind: n.kind as PartKind, title: n.title, x: n.x, y: n.y, stuck: n.stuck })),
    edges: links.map((l) => ({ id: l.id, kind: l.kind, from: l.fromKey, to: l.toKey })),
  };
}

export const sampleLayouts: Layouts = { flow, swimLanes, sequence, web };
