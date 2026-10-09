"use client";

// ลำดับการโต้ตอบ drawn in mono (TASK-A-021). Participants at the core's x, messages at the core's y, in order;
// nothing is recomputed. A client file only because the message plaques are sized from their measured text.
import { useLayoutEffect, useRef, useState } from "react";
import type { RequiredItem, SeqLayout } from "@/core/theme/contract";
import { requiredId } from "@/core/theme/required";
import { pageLabel } from "@/core/words";
import { KindMarkShape } from "../parts/KindMark";
import { RequiredList, RequiredPicker } from "../parts/Required";
import { useEdgeRoom } from "./useEdgeRoom";
import s from "./diagram.module.css";

const HEAD = 64;          // participant heads sit above the core's first message row
const LABEL_PX = 15, PAD_X = 8, PAD_Y = 4, MISSING = 40;

export function SeqDiagram({ layout, required }: { layout: SeqLayout; required: RequiredItem[] }) {
  const picker = new RequiredPicker(required);
  const xOf = new Map(layout.participants.map((p) => [p.key, p.x]));
  const texts = useRef<(SVGTextElement | null)[]>([]);
  const [sizes, setSizes] = useState<{ w: number; h: number }[] | null>(null);
  useLayoutEffect(() => {
    setSizes(layout.messages.map((_, i) => {
      const bb = texts.current[i]?.getBBox();
      return bb ? { w: bb.width + 2 * PAD_X, h: bb.height + 2 * PAD_Y } : { w: 0, h: 0 };
    }));
  }, [layout]);

  const top = 8;
  const width = layout.width, height = layout.height + 24;
  const { content, svgProps } = useEdgeRoom(width, height, [layout, sizes]);
  const messages = [...layout.messages].sort((a, b) => a.order - b.order);

  return (
    <div className={s.scroll} tabIndex={0} role="region" aria-label={pageLabel.sequence}>
      <svg {...svgProps} className={s.flow} role="presentation">
        <g ref={content}>
        <defs>
          <marker id="mono-seq-tip" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
            <path d="M0 1 L9 5 L0 9 Z" fill="#000000" />
          </marker>
        </defs>

        {/* participants: kind shape + title on top, a lifeline down */}
        {layout.participants.map((p) => (
          <g key={p.key}>
            <line x1={p.x} y1={top + HEAD - 6} x2={p.x} y2={height - 8} className={s.lifeline} />
            <g transform={`translate(${p.x - 8} ${top})`} aria-hidden="true">
              <KindMarkShape kind={p.kind} size={16} />
            </g>
            <text x={p.x} y={top + 40} textAnchor="middle" className={s.headTitle}>
              {p.title}
            </text>
          </g>
        ))}

        {messages.map((m, i) => {
          const x1 = m.from ? xOf.get(m.from) ?? null : null;
          const x2 = m.to ? xOf.get(m.to) ?? null : null;
          const a = x1 ?? (x2 ?? 0) - MISSING, b = x2 ?? (x1 ?? 0) + MISSING;
          const dir = b >= a ? 1 : -1;
          const y = m.y;
          const size = sizes?.[i];
          // the plaque sits clear above its arrow, never on the tip
          const cx = (a + b) / 2, cy = y - 22;
          return (
            <g key={m.key}>
              {x1 === null ? <circle cx={a} cy={y} r={6} className={s.missingEnd} /> : null}
              {x2 === null ? <circle cx={b} cy={y} r={6} className={s.missingEnd} /> : null}
              <line x1={a + dir * 2} y1={y} x2={b - dir * 6} y2={y} className={s.message} markerEnd="url(#mono-seq-tip)" />
              <text x={a - dir * 10} y={y + 5} textAnchor={dir > 0 ? "end" : "start"} className={s.order} aria-hidden="true">
                {m.order}
              </text>
              <g className={s.plaque} style={size ? undefined : { opacity: 0 }}>
                {size ? <rect x={cx - size.w / 2} y={cy - size.h / 2} width={size.w} height={size.h} rx={8} /> : null}
                <text
                  ref={(t) => { texts.current[i] = t; }}
                  x={cx}
                  y={cy}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={LABEL_PX}
                  {...picker.takeId(requiredId.message(m.key))}
                >
                  {m.text}
                </text>
              </g>
              {m.reply ? (
                <>
                  <line x1={b - dir * 2} y1={y + 22} x2={a + dir * 6} y2={y + 22} className={s.reply} markerEnd="url(#mono-seq-tip)" />
                  <text x={cx} y={y + 40} textAnchor="middle" className={s.replyText}>
                    {m.reply}
                  </text>
                </>
              ) : null}
            </g>
          );
        })}
        </g>
      </svg>
      <RequiredList items={picker.rest()} />
    </div>
  );
}
