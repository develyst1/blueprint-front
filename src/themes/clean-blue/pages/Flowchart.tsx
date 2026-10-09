"use client";

// ผังการทำงาน — drawn from the core's layouts (positions, arrow paths, label anchors after the fork): left to right
// when it fits its box at full size, top to bottom when it does not (never shrunk: the 14 px floor, REVIEW-A-004 row 3).
// White step cards; a stuck step in amber with a ⚠ badge, and its words under the diagram (never colour alone, row 2);
// an end step as a pill; a branch's condition as a chip exactly the core's conditionBox, so two chips after one fork
// keep the layout's ≥ 8 px apart (row 6).
import { WarningFilled } from "@ant-design/icons";
import { useId } from "react";
import { conditionBox } from "@/core/layout/text";
import type { FlowLayout, PageVMs, RequiredItem, StepVM } from "@/core/theme/contract";
import { requiredId } from "@/core/theme/required";
import { pageLabel } from "@/core/words";
import { color } from "../tokens";
import { useWidth } from "../parts/useWidth";
import { Choose, PageHead } from "../parts/PageHead";
import { reqAttrs } from "../parts/Req";
import s from "./pages.module.css";

const LABEL_PX = 14; // the core's flow labelPx — the size conditionBox measures

function Diagram({ lay, steps, required }: { lay: FlowLayout; steps: Map<string, StepVM>; required: RequiredItem[] }) {
  const arrow = useId().replace(/:/g, "");
  const r = (id: string) => reqAttrs(required, id);
  return (
    // a named group, not an image: it holds the step links (row 14)
    <svg width={lay.width} height={lay.height} viewBox={`0 0 ${lay.width} ${lay.height}`} role="group" aria-label={pageLabel.flowchart}>
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
            {stuck && (
              // the ⚠ badge on the node's corner; the words are in the list under the diagram
              <g aria-hidden>
                <circle cx={n.x + n.w - 2} cy={n.y + 2} r={11} fill={color.stuck} stroke={color.paper} strokeWidth={2} />
                <text x={n.x + n.w - 2} y={n.y + 7} textAnchor="middle" fontSize={14} fontWeight={700} fill={color.paper}>!</text>
              </g>
            )}
          </a>
        );
      })}
      {lay.edges.filter((e) => e.labelAnchor && e.label).map((e, i) => {
        const box = conditionBox(e.label!, LABEL_PX);
        return (
          <g key={`l${i}`}>
            <rect x={e.labelAnchor!.x - box.w / 2} y={e.labelAnchor!.y - box.h / 2} width={box.w} height={box.h} rx={box.h / 2}
              fill={color.blueSoft} stroke={color.paper} strokeWidth={2} />
            <text x={e.labelAnchor!.x} y={e.labelAnchor!.y + 5} textAnchor="middle" fontSize={LABEL_PX} fontWeight={500} fill={color.blue}
              {...r(requiredId.branch(e.from, e.to))}>
              {e.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/** Under a diagram: each stuck step with its words — the diagram's amber is never the only signal (row 2). */
export function StuckSteps({ steps }: { steps: StepVM[] }) {
  const stuck = steps.filter((st) => st.stuck && st.stuckWordings.length > 0);
  if (!stuck.length) return null;
  return (
    <ul className={s.stuckSteps}>
      {stuck.map((st) => (
        <li key={st.key} className={s.stuckNote}>
          <WarningFilled aria-hidden />
          {/* one wording per line: joined, several reasons ran past two lines on a phone (AC-8) */}
          <span className={s.stepText}>
            <a href={st.href} className={s.stuckStep}>{st.number} {st.title}</a>
            {st.stuckWordings.map((t, i) => <span key={i}>{t}</span>)}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function Flowchart({ vm, required }: { vm: PageVMs["flowchart"]; required: RequiredItem[] }) {
  const steps = new Map(vm.work.steps.map((st) => [st.key, st]));
  // left to right when it fits the box at full size; otherwise top to bottom (measured, not guessed from the viewport)
  const [ref, box] = useWidth<HTMLDivElement>();
  const lay = box === 0 || vm.layouts.LR.width <= box ? vm.layouts.LR : vm.layouts.TB;
  return (
    <>
      <PageHead page="flowchart">
        {vm.works.length > 1 && <Choose label={pageLabel.flowchart} current={vm.work.key} items={vm.works} />}
      </PageHead>
      <div className={`${s.panel} ${s.diagram}`}>
        <StuckSteps steps={vm.work.steps} />
        <div ref={ref} className={s.scroll} tabIndex={0} role="region" aria-label={pageLabel.flowchart} data-print="expand">
          <Diagram lay={lay} steps={steps} required={required} />
        </div>
      </div>
    </>
  );
}
