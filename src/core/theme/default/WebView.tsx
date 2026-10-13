"use client";

// The default theme's node web, interactive (REQ-009, SPEC-B-001 v1.14). A client component of its own because the zoom /
// pan / focus hook is one — `pages.tsx` stays a server module and passes `vm` + `required` down (the same split as State.tsx).
// The page opens on the whole web (fit), a chosen node is centred with its edges strong and the rest faded, and the core's
// `useWebView` does every transform — this file only draws. Tiles keep TASK-B-024/B-025: 14 px text, ⚠ on a stuck node, 44 px
// tall, the kind's mark; a name longer than CAP is cut with … on screen, but its full text stays in the DOM (required items)
// and in the link's accessible name and tooltip (REQ-009 R4, amended 2026-10-12).
import { useId } from "react";
import type { PageVMs, RequiredItem } from "../contract";
import { requiredId } from "../required";
import { neighbours } from "@/core/web/view";
import { useWebView } from "@/core/web/useWebView";
import { estimateLabel } from "@/core/layout/text";
import { KIND_ORDER } from "@/core/layout/web";
import { linkedWith, pageLabel, partKind, webAll, zoomIn, zoomOut } from "@/core/words";
import { markAttrs } from "./Mark";
import s from "./default.module.css";

const WEB_PX = 14;
const MARK = 10, MARK_GAP = 6, PAD_X = 10, TILE_H = 44;
const CAP = 240; // the widest a tile's text is drawn (px); longer is cut with …

const markOf = (k: string) => (k === "work" || k === "step" || k === "interaction" ? k : ["role", "screen", "api", "system"].includes(k) ? "actor" : "other");
function KindMark({ kind, x, y, fill }: { kind: string; x: number; y: number; fill: string }) {
  const h = MARK / 2, m = markOf(kind);
  if (m === "step") return <circle cx={x} cy={y} r={h} fill={fill} />;
  if (m === "interaction") return <path d={`M${x} ${y - h - 1}L${x + h + 1} ${y}L${x} ${y + h + 1}L${x - h - 1} ${y}Z`} fill={fill} />;
  if (m === "actor") return <rect x={x - h + 1} y={y - h + 1} width={MARK - 2} height={MARK - 2} fill="none" stroke={fill} strokeWidth={2} />;
  if (m === "other") return <circle cx={x} cy={y} r={h - 1} fill="none" stroke={fill} strokeWidth={2} />;
  return <rect x={x - h} y={y - h} width={MARK} height={MARK} rx={2} fill={fill} />;
}

export function WebView({ vm, required }: { vm: PageVMs["web"]; required: RequiredItem[] }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const sel = vm.selected?.key ?? null;
  // the wide layout for a desktop box, the tall one for a phone — the hook picks by the measured box; draw what it returns
  const view = useWebView(vm.layout, sel, { clearHref: vm.allHref, tall: vm.tall });
  const l = view.layout;
  const all = view.linkProps(vm.allHref); // ดูทั้งหมด: a plain click clears the choice in the page; with nothing chosen it just re-fits
  const at = new Map(l.nodes.map((n) => [n.key, n]));
  const near = new Set(sel ? neighbours(l, sel) : []);
  const lit = (e: { from: string; to: string }) => !!sel && (e.from === sel || e.to === sel);
  const kinds = [...new Set(l.nodes.map((n) => n.kind))].sort((a, b) => (KIND_ORDER.indexOf(a) + 1 || 99) - (KIND_ORDER.indexOf(b) + 1 || 99)); // the legend keeps one order, whatever the rows hold
  const ell = estimateLabel("…", WEB_PX).w;
  return (
    <>
      <h2>{pageLabel.web}</h2>
      <ul className={s.webLegend} aria-hidden>
        {kinds.map((k) => (
          <li key={k}><svg width={14} height={14}><KindMark kind={k} x={7} y={7} fill="#5b6573" /></svg>{partKind[k] ?? k}</li>
        ))}
      </ul>
      <div className={s.webBar} data-print="screen-only">
        <button type="button" className={s.webBtn} aria-label={zoomIn} title={zoomIn} onClick={view.zoomIn}>+</button>
        <button type="button" className={s.webBtn} aria-label={zoomOut} title={zoomOut} onClick={view.zoomOut}>−</button>
        <a className={s.webAll} {...all} onClick={(e) => (sel ? all.onClick(e) : view.showAll(e))}>{webAll}</a>
      </div>
      <div ref={view.viewportRef} className={`${s.webViewport} ${view.dragging ? s.webDragging : ""}`} tabIndex={0} role="region" aria-label={pageLabel.web}
        data-print="expand" {...view.handlers}>
        <div className={s.webStage} style={{ ...view.style, width: l.width, height: l.height }}>
          <svg width={l.width} height={l.height} viewBox={`0 0 ${l.width} ${l.height}`} style={{ overflow: "visible" }}>
            <defs>
              {l.nodes.map((n, i) => {
                const full = estimateLabel(`${n.stuck ? "⚠ " : ""}${n.title}`, WEB_PX).w;
                if (full <= CAP) return null;
                const x0 = n.x - (CAP + 2 * PAD_X + MARK + MARK_GAP) / 2;
                return <clipPath key={n.key} id={`${uid}c${i}`}><rect x={x0 + PAD_X + MARK + MARK_GAP} y={n.y - TILE_H / 2} width={CAP - ell} height={TILE_H} /></clipPath>;
              })}
            </defs>
            {[...l.edges].sort((a, b) => Number(lit(a)) - Number(lit(b))).map((e) => {
              const a = at.get(e.from), b = at.get(e.to);
              return a && b ? (
                <line key={e.id} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={lit(e) ? "#1458c4" : "#aeb6c1"} strokeWidth={lit(e) ? 2.5 : 1.25}
                  opacity={sel && !lit(e) ? 0.25 : 1} />
              ) : null;
            })}
            {l.nodes.map((n, i) => {
              const current = sel === n.key;
              const label = `${n.stuck ? "⚠ " : ""}${n.title}`;
              const full = estimateLabel(label, WEB_PX).w;
              const cut = full > CAP;
              const w = Math.min(full, CAP) + 2 * PAD_X + MARK + MARK_GAP;
              const x0 = n.x - w / 2;
              const tx = x0 + PAD_X + MARK + MARK_GAP;
              const ink = current ? "#ffffff" : n.stuck ? "#a6460a" : "#1b1f24";
              return (
                <a key={n.key} {...view.linkProps(n.href)} className={s.webNode} aria-current={current ? "true" : undefined} aria-label={label}
                  style={{ opacity: sel && !current && !near.has(n.key) ? 0.35 : 1 }}>
                  {cut && <title>{label}</title>}
                  <rect x={x0} y={n.y - TILE_H / 2} width={w} height={TILE_H} rx={10}
                    fill={current ? "#1458c4" : n.stuck ? "#fdf1e7" : "#ffffff"}
                    stroke={current ? "#1458c4" : n.stuck ? "#e8c3a5" : "#d5dae1"} />
                  <KindMark kind={n.kind} x={x0 + PAD_X + MARK / 2} y={n.y} fill={current ? "#ffffff" : n.stuck ? "#a6460a" : "#5b6573"} />
                  {/* 14 px is the desk's text floor (TASK-B-024); a stuck node carries ⚠ so colour is never its only sign.
                      The text holds the whole name; a long one is clipped to the tile and ends in … */}
                  <text x={tx} y={n.y + 5} fontSize={WEB_PX} fontWeight={current ? 700 : 500} fill={ink}
                    clipPath={cut ? `url(#${uid}c${i})` : undefined} {...markAttrs(required, requiredId.part(n.key))}>
                    {n.stuck ? "⚠ " : null}{n.title}
                  </text>
                  {cut && <text x={tx + CAP - ell} y={n.y + 5} fontSize={WEB_PX} fontWeight={current ? 700 : 500} fill={ink} aria-hidden>…</text>}
                </a>
              );
            })}
          </svg>
        </div>
      </div>
      {vm.selected && (
        <section className={s.detail}>
          <h3>{vm.selected.title}</h3>
          <p className={s.muted}>{partKind[vm.selected.kind] ?? vm.selected.kind} · {vm.selected.cameFrom} · {vm.selected.stampLabel} · {vm.selected.dateLabel}</p>
          {sel && near.size > 0 && (
            <>
              <h4>{linkedWith}</h4>
              <ul className={s.list} aria-label={linkedWith}>
                {[...near].map((k) => { const n = at.get(k); return n ? <li key={k}><a {...view.linkProps(n.href)}>{n.title}</a></li> : null; })}
              </ul>
            </>
          )}
          <ul className={s.list}>
            {vm.selected.links.map((x, i) => <li key={i}>{x.label && <>{x.label} </>}<a {...view.linkProps(x.href)}>{x.title}</a></li>)}
          </ul>
        </section>
      )}
    </>
  );
}
