import type { ParticipantKind, PartKind } from "@/core/theme/contract";

// Who-is-what in a mono theme has no hue to spend, so it is told by shape (direction § 4, dataviz: identity never
// by colour alone): ● คน · ■ หน้าจอ · ◆ API · ▲ ระบบ — drawn, not glyphs. "solid" is the heavy form (the stuck
// step's row); "outline" the quiet one. Decorative: the words beside it (legend, lane title) carry the meaning.

/** The bare shape, for use inside an existing <svg> (sequence heads, web nodes). Drawn in a size × size box. */
export function KindMarkShape({ kind, size = 14, solid = false }: { kind: PartKind; size?: number; solid?: boolean }) {
  const s = size, h = s / 2, w = 1.5;
  const common = { fill: solid ? "#000000" : "#FFFFFF", stroke: "#000000", strokeWidth: w } as const;
  // Each kind its own outline; the participant kinds keep their swimlane shapes.
  // coordinates rounded to 0.01: the server and the browser compute trig a hair apart, and React flags the mismatch
  const r2 = (v: number) => Math.round(v * 100) / 100;
  const poly = (pts: [number, number][]) => pts.map(([x, y]) => `${r2(x)},${r2(y)}`).join(" ");
  const ring = (n: number, r: number, rot = 0): [number, number][] =>
    Array.from({ length: n }, (_, i) => [h + r * Math.cos(rot + (i * 2 * Math.PI) / n), h + r * Math.sin(rot + (i * 2 * Math.PI) / n)]);
  switch (kind) {
    case "role": return <circle cx={h} cy={h} r={h - w} {...common} />;
    case "screen": return <rect x={w} y={w} width={s - 2 * w} height={s - 2 * w} rx={1.5} {...common} />;
    case "api": return <polygon points={poly([[h, w / 2 + 0.5], [s - w / 2 - 0.5, h], [h, s - w / 2 - 0.5], [w / 2 + 0.5, h]])} {...common} />;
    case "system": return <polygon points={poly([[h, w + 0.5], [s - w, s - w], [w, s - w]])} strokeLinejoin="round" {...common} />;
    case "work": return <g><circle cx={h} cy={h} r={h - w} {...common} /><circle cx={h} cy={h} r={h / 2.2} fill="none" stroke="#000000" strokeWidth={w} /></g>;
    case "step": return <rect x={w} y={h / 2} width={s - 2 * w} height={s - h} rx={(s - h) / 2} {...common} />;
    case "interaction": return <circle cx={h} cy={h} r={h / 2.4} {...common} />;
    // data = parallelogram (the flowchart sign for data); decision = pentagon, point up — at 16 px a hexagon and an
    // octagon both read as the circle of คน (critique of TASK-A-021)
    case "data": return <polygon points={poly([[s * 0.3, w + 1], [s - w, w + 1], [s * 0.7, s - w - 1], [w, s - w - 1]])} {...common} />;
    case "decision": return <polygon points={poly(ring(5, h - w, -Math.PI / 2))} strokeLinejoin="round" {...common} />;
    case "question": return <polygon points={poly([[w, w + 1], [s - w, w + 1], [h, s - w]])} strokeLinejoin="round" {...common} />;
    default: return <circle cx={h} cy={h} r={h - w} {...common} />;
  }
}

export function KindMark({ kind, size = 14, solid = false }: { kind: ParticipantKind | PartKind; size?: number; solid?: boolean }) {
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true" focusable="false" style={{ flex: "none", display: "block" }}>
      <KindMarkShape kind={kind} size={size} solid={solid} />
    </svg>
  );
}

export const KIND_ORDER: ParticipantKind[] = ["role", "screen", "api", "system"];
export const PART_KIND_ORDER: PartKind[] = ["work", "step", "interaction", "role", "screen", "api", "system", "data", "decision", "question"];
