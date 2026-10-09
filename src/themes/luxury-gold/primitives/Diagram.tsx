// Shared drawing pieces for the luxury gold diagram pages (TASK-C-005). Positions always come from the core's layout
// (SPEC-B-001: layout is shared, drawing is the theme's) — these helpers only turn given points into SVG paths.
// A diagram = an SVG for the lines + HTML for nodes and labels at the given x/y, so text wraps, nodes can be real
// links, and required markers sit on visible text. The frame scrolls inside itself (AC-17).
import type { CSSProperties, ReactNode } from "react";
import type { Point } from "@/core/theme/contract";

/** An SVG path through the given points (straight segments, as the layout gives them). */
export function pathD(points: Point[]): string {
  return points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
}

/** The point at fraction t of a polyline's length — only for a labelled edge whose labelAnchor is null (TASK-C-002 Q3 default 55 %). */
export function pointAlong(points: Point[], t: number): Point {
  const seg = points.slice(1).map((p, i) => Math.hypot(p.x - points[i].x, p.y - points[i].y));
  let left = seg.reduce((a, b) => a + b, 0) * t;
  for (let i = 0; i < seg.length; i++) {
    if (left <= seg[i] || i === seg.length - 1) {
      const k = seg[i] ? Math.min(1, left / seg[i]) : 0;
      return { x: points[i].x + (points[i + 1].x - points[i].x) * k, y: points[i].y + (points[i + 1].y - points[i].y) * k };
    }
    left -= seg[i];
  }
  return points[0];
}

/** Arrowhead marker; `id` must be unique on the page (two flowcharts LR + TB live side by side). */
export function ArrowDefs({ id, color = "var(--lg-edge)" }: { id: string; color?: string }) {
  return (
    <defs>
      <marker id={id} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
        <path d="M0 0 10 5 0 10Z" fill={color} />
      </marker>
    </defs>
  );
}

/** The scrolling frame + a canvas of the layout's size. `label` names the region for screen readers (a page name). */
export function DiagramFrame({
  label,
  width,
  height,
  className,
  children,
}: {
  label: string;
  width: number;
  height: number;
  className?: string;
  children: ReactNode;
}) {
  const style: CSSProperties = { width, height };
  return (
    <div className={`lg-diagram ${className ?? ""}`} role="region" aria-label={label} tabIndex={0}>
      <div className="lg-canvas" style={style}>
        {children}
      </div>
    </div>
  );
}

/** Place an HTML piece at a layout point (top-left), or centred on it. */
export function at(x: number, y: number, centred = false): CSSProperties {
  return centred ? { left: x, top: y, transform: "translate(-50%, -50%)" } : { left: x, top: y };
}
