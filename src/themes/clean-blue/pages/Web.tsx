"use client";

// ใยโหนด (ref 3) — every part a soft tile of its group colour with its kind icon; a stuck part in amber with ⚠; each tile a
// link to itself. The selected part's card sits on the right (below on a narrow screen): its kind, stamp, where it came from,
// when, the parts it is linked with (เชื่อมกับ) and every link read in words.
// REQ-009 (TASK-B-032): the page opens on the whole web and the core's `useWebView` does every zoom / pan / focus — this file
// only draws, inside `tileBox`. A chosen part is centred, its edges and neighbours stay strong, the rest fade; Escape or
// ดูทั้งหมด clears it. Names are shown at every zoom: a name wider than CAP is cut with …, the full text stays in the DOM
// (required items), the tooltip and the accessible name. A stuck part's accessible name is `stuckNodeName` (REQ-009 R5).
import { WarningFilled } from "@ant-design/icons";
import { Button, Card, Tag } from "antd";
import { useId } from "react";
import { estimateLabel } from "@/core/layout/text";
import { KIND_ORDER } from "@/core/layout/web";
import type { PageVMs, PartKind, RequiredItem } from "@/core/theme/contract";
import { requiredId } from "@/core/theme/required";
import { useWebView } from "@/core/web/useWebView";
import { neighbours, tileBox } from "@/core/web/view";
import { linkedWith, pageLabel, partKind, stuckNodeName, webAll, zoomIn, zoomOut } from "@/core/words";
import { color, group, kindGroup } from "../tokens";
import { PageHead } from "../parts/PageHead";
import { reqAttrs } from "../parts/Req";
import { KindTile, kindIcon } from "../parts/Tile";
import { useEdges } from "../parts/useEdges";
import s from "./pages.module.css";

const PX = 14;
const ICON_X = 16, TEXT_X = 32, PAD_R = 10; // the kind icon's round tile inside the tile's left end, then the name
const TILE_H = 40, HIT_H = 44;
const CAP = 240; // the widest a name is drawn (px)
// the room for a name: never past CAP, and never so wide that the tile leaves the core's tileBox (the layout spaces tiles by
// it, so tiles never touch at any zoom) — a stuck name with its ⚠ is the one that may need the cut
const room = (n: { title: string }) => Math.min(CAP, tileBox(n).w - TEXT_X - PAD_R);

export function Web({ vm, required }: { vm: PageVMs["web"]; required: RequiredItem[] }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const sel = vm.selected;
  // every link that chooses or clears a part spreads view.linkProps: a plain click is a client navigation, never a page load, so
  // the view glides to the new choice (REQ-009 R7, SPEC v1.16, TASK-B-036); Escape clears through clearHref the same way
  const view = useWebView(vm.layout, sel?.key ?? null, { clearHref: vm.allHref, tall: vm.tall });
  const all = view.linkProps(vm.allHref); // ดูทั้งหมด: with a part chosen it clears it in the page; with none it just re-fits
  const l = view.layout; // the wide or the tall layout, whichever suits the box — draw this one
  const at = new Map(l.nodes.map((n) => [n.key, n]));
  const near = new Set(sel ? neighbours(l, sel.key) : []);
  const lit = (e: { from: string; to: string }) => !!sel && (e.from === sel.key || e.to === sel.key);
  const kinds = ([...new Set(l.nodes.map((n) => n.kind))] as PartKind[]).sort((a, b) => (KIND_ORDER.indexOf(a) + 1 || 99) - (KIND_ORDER.indexOf(b) + 1 || 99));
  const stuckPage = vm.frame.nav.find((n) => n.page === "stuck");
  const anyStuck = l.nodes.some((n) => n.stuck);
  const ell = estimateLabel("…", PX).w;
  const legendRow = useEdges<HTMLDivElement>();
  return (
    <>
      <PageHead page="web" />
      <div className={sel ? s.webLayout : undefined}>
        <section className={`${s.panel} ${s.diagram} ${s.webPanel}`}>
          {/* a grid: at 1440 the stuck chip above, the legend left and the controls right; at ≤ 640 the controls sit beside the
              page heading and the legend is one row that scrolls sideways, so the web box is in view on open (TASK-B-034) */}
          <div className={s.webHead}>
            {anyStuck && stuckPage && (
              <a href={stuckPage.href} className={`${s.stuckNote} ${s.stuckLink} ${s.webStuck}`}><WarningFilled aria-hidden />{vm.frame.readiness.label}</a>
            )}
            <div ref={legendRow} className={`${s.legend} ${s.webLegend}`} data-legend>
              {kinds.map((k) => <span key={k} className={s.legendItem}><KindTile kind={k} size="sm" />{partKind[k]}</span>)}
            </div>
            <div className={s.webBar} data-print="screen-only">
              <Button size="large" className={s.webBtn} aria-label={zoomIn} title={zoomIn} onClick={view.zoomIn}>+</Button>
              <Button size="large" className={s.webBtn} aria-label={zoomOut} title={zoomOut} onClick={view.zoomOut}>−</Button>
              <Button size="large" {...all} onClick={(e) => (sel ? all.onClick(e) : view.showAll(e))}>{webAll}</Button>
            </div>
          </div>
          <div ref={view.viewportRef} className={`${s.webViewport} ${view.dragging ? s.webDragging : ""}`} tabIndex={0} role="region"
            aria-label={pageLabel.web} data-print="expand" {...view.handlers}>
            <div className={s.webStage} style={{ ...view.style, width: l.width, height: l.height }}>
              <svg width={l.width} height={l.height} viewBox={`0 0 ${l.width} ${l.height}`} style={{ overflow: "visible" }}>
                <defs>
                  {l.nodes.map((n, i) => {
                    const full = estimateLabel(`${n.stuck ? "⚠ " : ""}${n.title}`, PX).w, max = room(n);
                    if (full <= max) return null;
                    const x0 = n.x - (max + TEXT_X + PAD_R) / 2;
                    return <clipPath key={n.key} id={`${uid}c${i}`}><rect x={x0 + TEXT_X} y={n.y - HIT_H / 2} width={max - ell} height={HIT_H} /></clipPath>;
                  })}
                </defs>
                {[...l.edges].sort((a, b) => Number(lit(a)) - Number(lit(b))).map((e) => {
                  const a = at.get(e.from), b = at.get(e.to);
                  return a && b ? (
                    <line key={e.id} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={lit(e) ? color.blue : color.line} strokeWidth={lit(e) ? 2.5 : 1.25}
                      opacity={sel && !lit(e) ? 0.25 : 1} />
                  ) : null;
                })}
                {l.nodes.map((n, i) => {
                  const label = `${n.stuck ? "⚠ " : ""}${n.title}`;
                  const full = estimateLabel(label, PX).w;
                  const max = room(n);
                  const cut = full > max;
                  const w = Math.min(full, max) + TEXT_X + PAD_R;
                  const x0 = n.x - w / 2;
                  const Glyph = kindIcon[n.kind];
                  const g = group[kindGroup[n.kind]];
                  const current = sel?.key === n.key;
                  const ink = n.stuck ? color.stuck : current ? color.paper : color.ink;
                  return (
                    <a key={n.key} {...view.linkProps(n.href)} className={s.webNode} aria-current={current ? "true" : undefined}
                      aria-label={n.stuck ? stuckNodeName(n.title) : n.title} style={{ opacity: sel && !current && !near.has(n.key) ? 0.35 : 1 }}>
                      {cut && <title>{n.title}</title>}
                      <rect x={x0} y={n.y - HIT_H / 2} width={w} height={HIT_H} fill="transparent" />
                      <rect x={x0} y={n.y - TILE_H / 2} width={w} height={TILE_H} rx={10}
                        fill={n.stuck ? color.stuckSoft : current ? g.fg : g.bg}
                        stroke={n.stuck ? color.stuck : g.fg} strokeWidth={n.stuck || current ? 2 : 1} />
                      <circle cx={x0 + ICON_X} cy={n.y} r={11} fill={g.bg} stroke={g.fg} strokeWidth={1} aria-hidden />
                      <foreignObject x={x0 + ICON_X - 7} y={n.y - 7} width={14} height={14} aria-hidden>
                        <span className={s.nodeGlyph} style={{ color: g.fg }}><Glyph aria-hidden /></span>
                      </foreignObject>
                      <text x={x0 + TEXT_X} y={n.y + 5} fontSize={PX} fontWeight={current ? 700 : 500} fill={ink}
                        clipPath={cut ? `url(#${uid}c${i})` : undefined} {...reqAttrs(required, requiredId.part(n.key))}>
                        {n.stuck ? "⚠ " : null}{n.title}
                      </text>
                      {cut && <text x={x0 + TEXT_X + max - ell} y={n.y + 5} fontSize={PX} fontWeight={current ? 700 : 500} fill={ink} aria-hidden>…</text>}
                    </a>
                  );
                })}
              </svg>
            </div>
          </div>
        </section>
        {sel && (
          <Card title={<h3 className={s.cardTitle}><KindTile kind={sel.kind} size="lg" /><span>{sel.title}</span></h3>}>
            <div className={s.decisionBody}>
              <div className={s.detailMeta}>
                <Tag>{partKind[sel.kind]}</Tag>
                {sel.stampLabel && <Tag className={s.tagBlue}>{sel.stampLabel}</Tag>}
                <Tag>{sel.cameFrom}</Tag>
                <Tag>{sel.dateLabel}</Tag>
              </div>
              {near.size > 0 && (
                <div className={s.linkedWith}>
                  <h4 className={s.linkedHead}>{linkedWith}</h4>
                  <ul className={s.linkList} aria-label={linkedWith}>
                    {[...near].map((k) => {
                      const n = at.get(k);
                      return n ? <li key={k} className={s.linkRow}><KindTile kind={n.kind} size="sm" /><a {...view.linkProps(n.href)} className={s.linkTag}>{n.title}</a></li> : null;
                    })}
                  </ul>
                </div>
              )}
              <ul className={s.linkList}>
                {sel.links.map((x, i) => (
                  <li key={i} className={s.linkRow}>
                    {x.label && <span className={s.muted}>{x.label}</span>}
                    <a {...view.linkProps(x.href)} className={s.linkTag}>{x.title}</a>
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
