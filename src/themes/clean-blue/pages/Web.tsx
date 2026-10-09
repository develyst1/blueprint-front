"use client";

// ใยโหนด (ref 3) — every part a soft tile of its group colour, sized by the core's own box so the layout's spacing
// holds; a stuck part in amber; each tile a link to itself. The selected part's card sits on the right (below on a
// narrow screen): where it came from, who stamped it, when, and every link read in words.
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
import { KindTile } from "../parts/Tile";
import s from "./pages.module.css";

export function Web({ vm, required }: { vm: PageVMs["web"]; required: RequiredItem[] }) {
  const l = vm.layout;
  const at = new Map(l.nodes.map((n) => [n.key, n]));
  const sel = vm.selected;
  const near = new Set(sel ? [sel.key, ...sel.links.map((x) => x.key)] : []);
  const kinds = [...new Set(l.nodes.map((n) => n.kind))] as PartKind[];
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
          <div className={s.legend}>
            {kinds.map((k) => <span key={k} className={s.legendItem}><KindTile kind={k} size="sm" />{partKind[k]}</span>)}
          </div>
          <div ref={ref} className={s.scroll} tabIndex={0} role="region" aria-label={pageLabel.web} style={{ maxHeight: "72vh" }} data-print="expand">
            <svg width={l.width} height={l.height} viewBox={`0 0 ${l.width} ${l.height}`}>
              {l.edges.map((e) => {
                const a = at.get(e.from), b = at.get(e.to);
                const lit = sel && (e.from === sel.key || e.to === sel.key);
                return a && b ? (
                  <line key={e.id} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={lit ? color.blue : color.line} strokeWidth={lit ? 2 : 1} />
                ) : null;
              })}
              {l.nodes.map((n) => {
                const box = nodeBox(n.title);
                const g = group[kindGroup[n.kind]];
                const current = sel?.key === n.key;
                const dim = sel && !near.has(n.key);
                return (
                  <a key={n.key} href={n.href} className={s.webNode} aria-current={current ? "true" : undefined} style={dim ? { opacity: 0.55 } : undefined}>
                    <rect x={n.x - box.w / 2} y={n.y - box.h / 2} width={box.w} height={box.h} rx={10}
                      fill={n.stuck ? color.stuckSoft : current ? g.fg : g.bg}
                      stroke={n.stuck ? color.stuck : g.fg} strokeWidth={n.stuck || current ? 2 : 1} />
                    <text x={n.x} y={n.y + 5} textAnchor="middle" fontSize={13} fontWeight={current ? 700 : 500}
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
          <Card title={<span className={s.panelHead}><KindTile kind={sel.kind} size="lg" /><span>{sel.title}</span></span>}>
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
