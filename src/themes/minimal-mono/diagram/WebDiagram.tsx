"use client";

// ใยโหนด drawn in mono (TASK-A-021). Every part at the core's x/y, every link as a thin line; nothing recomputed.
// Kind by shape (legend on the page), stuck = solid black, the selected part ringed 3 px. Interactions — the
// many small steps-within-steps — are small dots without a label so the web stays readable; their words are in
// each dot's tooltip and in the sequence page. A stuck part is always labelled.
// Each node is a link to the core's own href for it (contract v1.4), with the theme's 2 px ring.
// A client file: on first paint the scroll box centres the selected part (else the first stuck part, else the work).
import { useLayoutEffect, useRef } from "react";
import type { RequiredItem, WebLayout } from "@/core/theme/contract";
import { requiredId } from "@/core/theme/required";
import { pageLabel } from "@/core/words";
import { KindMarkShape } from "../parts/KindMark";
import { RequiredList, RequiredPicker } from "../parts/Required";
import { useEdgeRoom } from "./useEdgeRoom";
import s from "./diagram.module.css";

const SIZE: Record<string, number> = { work: 28, step: 22, interaction: 20 }; // interaction dot ≈ 8.3 px (TASK-A-027)
const sizeOf = (kind: string) => SIZE[kind] ?? 18;

export function WebDiagram({ layout, selectedKey, required }: { layout: WebLayout; selectedKey: string | null; required: RequiredItem[] }) {
  const picker = new RequiredPicker(required);
  const at = new Map(layout.nodes.map((n) => [n.key, n]));
  const box = useRef<HTMLDivElement>(null);
  const { content, room, svgProps } = useEdgeRoom(layout.width, layout.height, [layout, selectedKey]);

  // First paint: centre the box (its own scrollLeft/scrollTop only) on the selected part, else the first stuck part,
  // else the work — never on the canvas's empty corner (REVIEW-C-002 row 15).
  useLayoutEffect(() => {
    const el = box.current;
    const sel = (selectedKey ? at.get(selectedKey) : undefined) ?? layout.nodes.find((n) => n.stuck) ?? layout.nodes.find((n) => n.kind === "work");
    if (!el || !sel) return;
    el.scrollLeft = Math.max(0, sel.x + room.left - el.clientWidth / 2);
    el.scrollTop = Math.max(0, sel.y + room.top - el.clientHeight / 2);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layout, selectedKey, room.left, room.top]);

  return (
    <div ref={box} className={`${s.scroll} ${s.webScroll}`} tabIndex={0} role="region" aria-label={pageLabel.web}>
      <svg {...svgProps} className={s.flow} role="presentation">
        <g ref={content}>
        <g aria-hidden="true">
          {layout.edges.map((e) => {
            const a = at.get(e.from), b = at.get(e.to);
            // the selected part's own links in ink, the rest recede
            const mine = selectedKey !== null && (e.from === selectedKey || e.to === selectedKey);
            return a && b ? <line key={e.id} x1={a.x} y1={a.y} x2={b.x} y2={b.y} className={mine ? s.webEdgeSelected : s.webEdge} /> : null;
          })}
        </g>
        {layout.nodes.map((n) => {
          const sz = sizeOf(n.kind);
          const labelled = n.kind !== "interaction" || n.stuck;
          const selected = n.key === selectedKey;
          const body = (
            <>
              <title>{n.title}</title>
              <circle cx={n.x} cy={n.y} r={22} className={s.hit} />
              {selected ? <circle cx={n.x} cy={n.y} r={sz / 2 + 7} className={s.selectedRing} /> : null}
              <g transform={`translate(${n.x - sz / 2} ${n.y - sz / 2})`}>
                <KindMarkShape kind={n.kind} size={sz} solid={n.stuck} />
              </g>
              {labelled ? (
                <text x={n.x} y={n.y + sz / 2 + (selected ? 26 : 18)} textAnchor="middle" className={n.stuck ? s.webLabelStuck : s.webLabel} {...picker.takeId(requiredId.part(n.key))}>
                  {n.title}
                </text>
              ) : null}
            </>
          );
          return (
            <a key={n.key} href={n.href} className={s.nodeLink} aria-label={n.title}>{body}</a>
          );
        })}
        </g>
      </svg>
      <RequiredList items={picker.rest()} />
    </div>
  );
}
