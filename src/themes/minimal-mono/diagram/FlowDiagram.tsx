"use client";

// ผังการทำงาน drawn in mono (TASK-A-019). Positions come from the core (FlowLayout) and are never recomputed;
// the theme only draws them and may slide a label plaque off a node or another plaque — never drop a label.
// A client file: it picks LR or TB by the screen width, and it measures label text to place the plaques.
import { useMediaQuery } from "@mantine/hooks";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import type { FlowLayout, RequiredItem, StepVM } from "@/core/theme/contract";
import { requiredId } from "@/core/theme/required";
import { pageLabel, stepEnds } from "@/core/words";
import { RequiredPicker } from "../parts/Required";
import s from "./diagram.module.css";

type Box = { x: number; y: number; w: number; h: number };
// Labels and step titles are 15 px so that, when the diagram is scaled down to fit its column (never below 0.94),
// they stay ≥ 14 px (15 × 0.94 = 14.1).
const PLAQUE_PAD_X = 8, PLAQUE_PAD_Y = 4, LABEL_PX = 15, GAP = 4, MIN_SCALE = 0.94;

const overlaps = (a: Box, b: Box) => a.x < b.x + b.w + GAP && b.x < a.x + a.w + GAP && a.y < b.y + b.h + GAP && b.y < a.y + a.h + GAP;

// Slide a plaque along its edge's direction (and across it) until it covers no node and no earlier plaque.
function placePlaques(layout: FlowLayout, sizes: { w: number; h: number }[]): Box[] {
  const taken: Box[] = layout.nodes.map((n) => ({ x: n.x, y: n.y, w: n.w, h: n.h }));
  const out: Box[] = [];
  layout.edges.forEach((e, i) => {
    if (!e.label || !e.labelAnchor) return;
    const { w, h } = sizes[i] ?? { w: 0, h: 0 };
    const a = e.points[0], b = e.points[e.points.length - 1];
    const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    const ux = (b.x - a.x) / len, uy = (b.y - a.y) / len; // along the edge
    const vx = -uy, vy = ux;                              // across it
    // nearest free spot first: along, across, then both, out to 160 px
    const tries: [number, number][] = [[0, 0]];
    for (let k = 1; k <= 20; k++) {
      const d = k * 8;
      tries.push([d, 0], [-d, 0], [0, d], [0, -d], [d, d], [-d, d], [d, -d], [-d, -d]);
    }
    let best: Box = { x: e.labelAnchor.x - w / 2, y: e.labelAnchor.y - h / 2, w, h };
    for (const [along, across] of tries) {
      const cx = e.labelAnchor.x + ux * along + vx * across, cy = e.labelAnchor.y + uy * along + vy * across;
      const box = { x: cx - w / 2, y: cy - h / 2, w, h };
      if (!taken.some((t) => overlaps(box, t)) && box.x >= 0 && box.y >= 0 && box.x + w <= layout.width && box.y + h <= layout.height) {
        best = box;
        break;
      }
    }
    taken.push(best);
    out[i] = best;
  });
  return out;
}

function Diagram({ layout, steps, required, scale }: { layout: FlowLayout; steps: StepVM[]; required: RequiredItem[]; scale: number }) {
  const stepOf = useMemo(() => new Map(steps.map((st) => [st.key, st])), [steps]);
  const picker = new RequiredPicker(required);
  const textRefs = useRef<(SVGTextElement | null)[]>([]);
  const [sizes, setSizes] = useState<{ w: number; h: number }[] | null>(null);

  useLayoutEffect(() => {
    setSizes(layout.edges.map((_, i) => {
      const t = textRefs.current[i];
      if (!t) return { w: 0, h: 0 };
      const bb = t.getBBox();
      return { w: bb.width + 2 * PLAQUE_PAD_X, h: bb.height + 2 * PLAQUE_PAD_Y };
    }));
  }, [layout]);

  const plaques = sizes ? placePlaques(layout, sizes) : null;
  const lr = layout.direction === "LR";

  return (
    <svg width={layout.width * scale} height={layout.height * scale} viewBox={`0 0 ${layout.width} ${layout.height}`} className={s.flow} role="presentation">
      <defs>
        <marker id="mono-tip" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
          <path d="M0 1 L9 5 L0 9 Z" fill="#000000" />
        </marker>
      </defs>

      <g aria-hidden="true">
        {layout.edges.map((e) => (
          <polyline key={`${e.from}-${e.to}`} points={e.points.map((p) => `${p.x},${p.y}`).join(" ")} className={s.edge} markerEnd="url(#mono-tip)" />
        ))}
      </g>

      {layout.nodes.map((n) => {
        const st = stepOf.get(n.key);
        const title = st?.title ?? n.key;
        const stuck = !!st?.stuck;
        const cls = [s.node, stuck ? s.nodeStuck : null].filter(Boolean).join(" ");
        const body = (
          <g className={cls}>
            <rect x={n.x} y={n.y} width={n.w} height={n.h} rx={n.ends ? n.h / 2 : 10} className={s.nodeBox} />
            <text x={n.x + (n.ends ? n.h / 2 : 14)} y={n.y + 22} className={s.nodeNumber}>
              {st?.number ?? ""}
              {n.ends ? <tspan className={s.nodeEnds} dx={8}>{stepEnds}</tspan> : null}
            </text>
            <text x={n.x + (n.ends ? n.h / 2 : 14)} y={n.y + n.h - 14} className={s.nodeTitle} {...picker.takeId(requiredId.step(n.key))}>
              {title}
            </text>
            {stuck ? (
              <g aria-hidden="true">
                <circle cx={n.x + n.w - 14} cy={n.y + 14} r={8} fill="#0B57D0" />
                <rect x={n.x + n.w - 15} y={n.y + 9} width={2} height={6} rx={1} fill="#FFFFFF" />
                <circle cx={n.x + n.w - 14} cy={n.y + 18} r={1.2} fill="#FFFFFF" />
              </g>
            ) : null}
            {n.isBranch ? (
              <polygon
                aria-hidden="true"
                className={s.fork}
                points={lr
                  ? `${n.x + n.w},${n.y + n.h / 2 - 6} ${n.x + n.w + 6},${n.y + n.h / 2} ${n.x + n.w},${n.y + n.h / 2 + 6} ${n.x + n.w - 6},${n.y + n.h / 2}`
                  : `${n.x + n.w / 2},${n.y + n.h - 6} ${n.x + n.w / 2 + 6},${n.y + n.h} ${n.x + n.w / 2},${n.y + n.h + 6} ${n.x + n.w / 2 - 6},${n.y + n.h}`}
              />
            ) : null}
          </g>
        );
        return st?.href ? (
          <a key={n.key} href={st.href} className={s.nodeLink} aria-label={`${st.number} ${title}`}>
            {body}
          </a>
        ) : (
          <g key={n.key}>{body}</g>
        );
      })}

      {layout.edges.map((e, i) => {
        if (!e.label || !e.labelAnchor) return null;
        const box = plaques?.[i];
        const cx = box ? box.x + box.w / 2 : e.labelAnchor.x, cy = box ? box.y + box.h / 2 : e.labelAnchor.y;
        // a plaque slid off its anchor keeps a thin leader back to its edge, so it never reads as another branch's
        const slid = box && Math.hypot(cx - e.labelAnchor.x, cy - e.labelAnchor.y) > box.h / 2 + 2;
        return (
          <g key={`label-${e.from}-${e.to}`} className={s.plaque} style={box ? undefined : { opacity: 0 }}>
            {slid ? <line x1={e.labelAnchor.x} y1={e.labelAnchor.y} x2={cx} y2={cy} className={s.leader} /> : null}
            {slid ? <circle cx={e.labelAnchor.x} cy={e.labelAnchor.y} r={2.5} className={s.leaderDot} /> : null}
            {box ? <rect x={box.x} y={box.y} width={box.w} height={box.h} rx={8} /> : null}
            <text
              ref={(t) => { textRefs.current[i] = t; }}
              x={cx}
              y={cy}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={LABEL_PX}
              {...picker.takeId(requiredId.branch(e.from, e.to))}
            >
              {e.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function FlowDiagram({ layouts, steps, required }: { layouts: { LR: FlowLayout; TB: FlowLayout }; steps: StepVM[]; required: RequiredItem[] }) {
  // Below 48em the core's top-to-bottom layout; the server render (and first paint) uses LR.
  const narrow = useMediaQuery("(max-width: 47.99em)") ?? false;
  const layout = narrow ? layouts.TB : layouts.LR;
  // Fit the column when the diagram is only a little wider (scale ≥ MIN_SCALE keeps every label ≥ 14 px); otherwise
  // keep its own size and scroll inside the box.
  const box = useRef<HTMLDivElement>(null);
  const [room, setRoom] = useState<number | null>(null);
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const measure = () => setRoom(el.clientWidth - 32); // .scroll pads 16 px each side
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const scale = room && room < layout.width && room / layout.width >= MIN_SCALE ? room / layout.width : 1;
  // First paint: the first stuck step's box fully inside the visible box — scrollLeft on the box only, as little as
  // needed (REVIEW-C-002 row 7). .scroll pads 16 px; 24 px of margin keeps its ring and stuck mark clear of the edge.
  useLayoutEffect(() => {
    const el = box.current;
    const stuckKey = steps.find((st) => st.stuck)?.key;
    const n = stuckKey ? layout.nodes.find((node) => node.key === stuckKey) : undefined;
    if (!el || !n) return;
    const left = 16 + n.x * scale, right = 16 + (n.x + n.w) * scale;
    if (right > el.scrollLeft + el.clientWidth) el.scrollLeft = right - el.clientWidth + 24;
    if (left < el.scrollLeft) el.scrollLeft = Math.max(0, left - 24);
  }, [layout, steps, scale]);
  return (
    <div ref={box} className={s.scroll} tabIndex={0} role="region" aria-label={pageLabel.flowchart}>
      <div style={scale < 1 ? { width: layout.width * scale } : undefined} className={s.fit}>
        <Diagram key={layout.direction} layout={layout} steps={steps} required={required} scale={scale} />
      </div>
    </div>
  );
}
