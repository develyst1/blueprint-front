"use client";

// ใยโหนด (ref 3) — every part a soft tile of its group colour, sized by the core's own box so the layout's spacing
// holds; a stuck part in amber; each tile a link to itself. The selected part's card sits on the right (below on a
// narrow screen): where it came from, who stamped it, when, and every link read in words.
// REVIEW-A-004: titles at 14 px in a box grown by 14/13 from the core's 13 px estimate (row 3); the kind icon on a round
// tile on each node's left edge (row 10); a 44 px tall hit area per node (row 13); a stuck node carries a ⚠ badge, and
// the page says how much is stuck with a link to ติดอยู่ตรงไหน (row 2); with a part chosen, the edges that do not touch
// it fade (row 10).
const PX = 14;
const grow = (b: { w: number; h: number }) => ({ w: Math.ceil(b.w * (PX / 13)), h: b.h });
import { WarningFilled } from "@ant-design/icons";
import { Card, Tag } from "antd";
import { nodeBox } from "@/core/layout/web";
import { useEffect } from "react";
import { useWidth } from "../parts/useWidth";
import type { PageVMs, PartKind, RequiredItem } from "@/core/theme/contract";
import { requiredId } from "@/core/theme/required";
import { pageLabel, partKind } from "@/core/words";
import { color, group, kindGroup } from "../tokens";
import { PageHead } from "../parts/PageHead";
import { reqAttrs } from "../parts/Req";
import { KindTile, kindIcon } from "../parts/Tile";
import s from "./pages.module.css";

export function Web({ vm, required }: { vm: PageVMs["web"]; required: RequiredItem[] }) {
  const l = vm.layout;
  const at = new Map(l.nodes.map((n) => [n.key, n]));
  const sel = vm.selected;
  const near = new Set(sel ? [sel.key, ...sel.links.map((x) => x.key)] : []);
  const kinds = [...new Set(l.nodes.map((n) => n.kind))] as PartKind[];
  const stuckPage = vm.frame.nav.find((n) => n.page === "stuck");
  const anyStuck = l.nodes.some((n) => n.stuck);
  const [ref, box] = useWidth<HTMLDivElement>();
  // full size keeps every title readable (shrinking a web this size puts text under 10 px); instead the box opens
  // centred on the selected part, or on the work when nothing is selected
  const focus = (sel && at.get(sel.key)) ?? l.nodes.find((n) => n.kind === "work");
  useEffect(() => {
    const el = ref.current;
    if (!el || !focus || box === 0) return;
    el.scrollLeft = Math.max(0, focus.x - el.clientWidth / 2);
    el.scrollTop = Math.max(0, focus.y - el.clientHeight / 2);
  }, [ref, focus, box]);
  return (
    <>
      <PageHead page="web" />
      <div className={sel ? s.webLayout : undefined}>
        <section className={`${s.panel} ${s.diagram}`}>
          {anyStuck && stuckPage && (
            <a href={stuckPage.href} className={`${s.stuckNote} ${s.stuckLink}`}><WarningFilled aria-hidden />{vm.frame.readiness.label}</a>
          )}
          <div className={s.legend}>
            {kinds.map((k) => <span key={k} className={s.legendItem}><KindTile kind={k} size="sm" />{partKind[k]}</span>)}
          </div>
          <div ref={ref} className={s.scroll} tabIndex={0} role="region" aria-label={pageLabel.web} style={{ maxHeight: "72vh" }} data-print="expand">
            <svg width={l.width} height={l.height} viewBox={`0 0 ${l.width} ${l.height}`}>
              {l.edges.map((e) => {
                const a = at.get(e.from), b = at.get(e.to);
                const lit = sel && (e.from === sel.key || e.to === sel.key);
                return a && b ? (
                  <line key={e.id} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={lit ? color.blue : color.line} strokeWidth={lit ? 2 : 1}
                    opacity={sel && !lit ? 0.3 : 1} />
                ) : null;
              })}
              {l.nodes.map((n) => {
                const box = grow(nodeBox(n.title));
                const Glyph = kindIcon[n.kind];
                const g = group[kindGroup[n.kind]];
                const current = sel?.key === n.key;
                const dim = sel && !near.has(n.key);
                return (
                  <a key={n.key} href={n.href} className={s.webNode} aria-current={current ? "true" : undefined} style={dim ? { opacity: 0.55 } : undefined}>
                    <rect x={n.x - box.w / 2} y={n.y - 22} width={box.w} height={44} fill="transparent" />
                    <rect x={n.x - box.w / 2} y={n.y - box.h / 2} width={box.w} height={box.h} rx={10}
                      fill={n.stuck ? color.stuckSoft : current ? g.fg : g.bg}
                      stroke={n.stuck ? color.stuck : g.fg} strokeWidth={n.stuck || current ? 2 : 1} />
                    <circle cx={n.x - box.w / 2} cy={n.y} r={11} fill={g.bg} stroke={g.fg} strokeWidth={1} aria-hidden />
                    <foreignObject x={n.x - box.w / 2 - 7} y={n.y - 7} width={14} height={14} aria-hidden>
                      <span className={s.nodeGlyph} style={{ color: g.fg }}><Glyph aria-hidden /></span>
                    </foreignObject>
                    {n.stuck && (
                      <g aria-hidden>
                        <circle cx={n.x + box.w / 2 - 2} cy={n.y - box.h / 2 + 2} r={10} fill={color.stuck} stroke={color.paper} strokeWidth={2} />
                        <text x={n.x + box.w / 2 - 2} y={n.y - box.h / 2 + 7} textAnchor="middle" fontSize={PX} fontWeight={700} fill={color.paper}>!</text>
                      </g>
                    )}
                    <text x={n.x} y={n.y + 5} textAnchor="middle" fontSize={PX} fontWeight={current ? 700 : 500}
                      fill={n.stuck ? color.stuck : current ? color.paper : color.ink} {...reqAttrs(required, requiredId.part(n.key))}>
                      {n.title}
                    </text>
                  </a>
                );
              })}
            </svg>
          </div>
        </section>
        {sel && (
          <Card title={<h3 className={s.cardTitle}><KindTile kind={sel.kind} size="lg" /><span>{sel.title}</span></h3>}>
            <div className={s.decisionBody}>
              <div className={s.detailMeta}>
                <Tag>{partKind[sel.kind]}</Tag>
                {sel.stampLabel && <Tag color="blue">{sel.stampLabel}</Tag>}
                <Tag>{sel.cameFrom}</Tag>
                <Tag>{sel.dateLabel}</Tag>
              </div>
              <ul className={s.linkList}>
                {sel.links.map((x, i) => (
                  <li key={i} className={s.linkRow}>
                    {x.label && <span className={s.muted}>{x.label}</span>}
                    <a href={x.href} className={s.linkTag}>{x.title}</a>
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        )}
      </div>
    </>
  );
}
