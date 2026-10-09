"use client";

// ลำดับการโต้ตอบ — one step at a time (pills to choose it). Participants are header boxes over a dashed lifeline;
// each message an arrow at its y with its order and text above; a reply, dashed, back to the sender just below it
// (the core spaces messages 52 px apart: text y-9, reply text y+20, reply line y+26, next text y+43).
import { useId } from "react";
import type { PageVMs, RequiredItem } from "@/core/theme/contract";
import { requiredId } from "@/core/theme/required";
import { pageLabel } from "@/core/words";
import { color } from "../tokens";
import { Choose, PageHead } from "../parts/PageHead";
import { reqAttrs } from "../parts/Req";
import s from "./pages.module.css";

const HEAD = 44; // participant box height; the core's message y values start below it

export function Sequence({ vm, required }: { vm: PageVMs["sequence"]; required: RequiredItem[] }) {
  const l = vm.layout;
  const arrow = useId().replace(/:/g, "");
  const x = (k: string | null) => l.participants.find((p) => p.key === k)?.x ?? null;
  const boxW = (t: string) => Math.max(88, t.length * 8 + 28);
  return (
    <>
      <PageHead page="sequence" />
      <Choose label={pageLabel.sequence} current={vm.step.key}
        items={vm.steps.map((st) => ({ key: st.key, href: st.href, title: <><span className={s.num}>{st.number}</span>{st.title}</> }))} />
      <section className={`${s.panel} ${s.diagram}`}>
        <div className={s.panelHead}>
          <span className={vm.step.stuck ? `${s.num} ${s.numStuck}` : s.num}>{vm.step.number}</span>
          <h3>{vm.step.title}</h3>
        </div>
        {vm.step.stuckWordings.map((t, i) => <p key={i} className={s.stuckNote}>{t}</p>)}
        <div className={s.scroll} tabIndex={0} role="region" aria-label={pageLabel.sequence} data-print="expand">
          <svg width={l.width} height={l.height} viewBox={`0 0 ${l.width} ${l.height}`}>
            <defs>
              <marker id={arrow} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
                <path d="M0,0 L10,5 L0,10 z" fill={color.ink} />
              </marker>
            </defs>
            {l.participants.map((p) => {
              const w = boxW(p.title);
              return (
                <g key={p.key}>
                  <line x1={p.x} x2={p.x} y1={HEAD} y2={l.height - 8} stroke={color.lineStrong} strokeDasharray="4 6" />
                  <rect x={p.x - w / 2} y={4} width={w} height={HEAD - 8} rx={10} fill={color.paper} stroke={color.line} />
                  <text x={p.x} y={HEAD / 2 + 5} textAnchor="middle" fontSize={14} fontWeight={600} fill={color.ink}>{p.title}</text>
                </g>
              );
            })}
            {l.messages.map((m) => {
              const a = x(m.from), b = x(m.to);
              const mid = ((a ?? b ?? 0) + (b ?? a ?? 0)) / 2;
              return (
                <g key={m.key}>
                  {a !== null && b !== null && (
                    <line x1={a} x2={b} y1={m.y} y2={m.y} stroke={color.ink} strokeWidth={2} markerEnd={`url(#${arrow})`} />
                  )}
                  <text x={mid} y={m.y - 9} textAnchor="middle" fontSize={14} fill={color.ink} paintOrder="stroke" stroke={color.paper} strokeWidth={5}
                    {...reqAttrs(required, requiredId.message(m.key))}>
                    {m.order}. {m.text}
                  </text>
                  {m.reply && a !== null && b !== null && (
                    <>
                      <line x1={b} x2={a} y1={m.y + 26} y2={m.y + 26} stroke={color.ink2} strokeWidth={1.5} strokeDasharray="6 4" markerEnd={`url(#${arrow})`} />
                      <text x={mid} y={m.y + 20} textAnchor="middle" fontSize={13} fill={color.ink2} paintOrder="stroke" stroke={color.paper} strokeWidth={5}>{m.reply}</text>
                    </>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </section>
    </>
  );
}
