"use client";

// ผังการทำงาน — drawn from the core's layouts (positions, arrow paths, label anchors after the fork): left to right
// when it fits its box, top to bottom when it does not. White step cards with their number tile; a stuck step in amber;
// an end step as a pill; a branch's condition as a chip on its arrow, never dropped.
import { useId } from "react";
import { fitStyle, useWidth } from "../parts/useWidth";
import type { FlowLayout, PageVMs, RequiredItem, StepVM } from "@/core/theme/contract";
import { requiredId } from "@/core/theme/required";
import { pageLabel } from "@/core/words";
import { color } from "../tokens";
import { Choose, PageHead } from "../parts/PageHead";
import { reqAttrs } from "../parts/Req";
import s from "./pages.module.css";

// rough width of a label chip: Thai and Latin at 14 px average ~8 px a character
const chipW = (t: string) => Math.max(40, t.length * 8 + 20);

function Diagram({ lay, steps, required, box }: { lay: FlowLayout; steps: Map<string, StepVM>; required: RequiredItem[]; box: number }) {
  const arrow = useId().replace(/:/g, "");
  const r = (id: string) => reqAttrs(required, id);
  return (
    <svg width={lay.width} height={lay.height} viewBox={`0 0 ${lay.width} ${lay.height}`} style={fitStyle(lay.width, box, 0.9)}>
      <defs>
        <marker id={arrow} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill={color.ink2} />
        </marker>
      </defs>
      {lay.edges.map((e, i) => (
        <polyline key={i} points={e.points.map((p) => `${p.x},${p.y}`).join(" ")} fill="none" stroke={color.lineStrong}
          strokeWidth={2} strokeLinejoin="round" markerEnd={`url(#${arrow})`} />
      ))}
      {lay.nodes.map((n) => {
        const st = steps.get(n.key);
        const stuck = st?.stuck ?? false;
        return (
          <a key={n.key} href={st?.href}>
            <rect x={n.x} y={n.y} width={n.w} height={n.h} rx={n.ends ? n.h / 2 : 14}
              fill={stuck ? color.stuckSoft : color.paper} stroke={stuck ? color.stuck : n.ends ? color.ink2 : color.line} strokeWidth={stuck ? 2 : 1.5} />
            <text x={n.x + n.w / 2} y={n.y + n.h / 2 + 5} textAnchor="middle" fontSize={15} fontWeight={600} fill={color.ink} {...r(requiredId.step(n.key))}>
              {st ? `${st.number} ${st.title}` : n.key}
            </text>
          </a>
        );
      })}
      {lay.edges.filter((e) => e.labelAnchor && e.label).map((e, i) => {
        const w = chipW(e.label!);
        return (
          <g key={`l${i}`}>
            <rect x={e.labelAnchor!.x - w / 2} y={e.labelAnchor!.y - 14} width={w} height={28} rx={14} fill={color.blueSoft} />
            <text x={e.labelAnchor!.x} y={e.labelAnchor!.y + 5} textAnchor="middle" fontSize={14} fontWeight={500} fill={color.blue}
              {...r(requiredId.branch(e.from, e.to))}>
              {e.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function Flowchart({ vm, required }: { vm: PageVMs["flowchart"]; required: RequiredItem[] }) {
  const steps = new Map(vm.work.steps.map((st) => [st.key, st]));
  // left to right when it fits the box at 90 % or more (step text stays ≥ 13.5 px); otherwise top to bottom (measured, not guessed from the viewport)
  const [ref, box] = useWidth<HTMLDivElement>();
  const lay = box === 0 || vm.layouts.LR.width * 0.9 <= box ? vm.layouts.LR : vm.layouts.TB;
  return (
    <>
      <PageHead page="flowchart">
        {vm.works.length > 1 && <Choose label={pageLabel.flowchart} current={vm.work.key} items={vm.works} />}
      </PageHead>
      <div className={`${s.panel} ${s.diagram}`}>
        <div ref={ref} className={s.scroll} tabIndex={0} role="region" aria-label={pageLabel.flowchart} data-print="expand">
          <Diagram lay={lay} steps={steps} required={required} box={box} />
        </div>
      </div>
    </>
  );
}
