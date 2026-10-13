"use client";

// ใยโหนด drawn in mono (TASK-A-021 → TASK-A-066, REQ-009). Every part at the core's x/y, every link a thin line;
// nothing laid out here. The view — whole web first, zoom, pan, centre a chosen node — is the core's `useWebView`
// (SPEC-B-001 v1.14): this file renders through its `style` and calls its controls, it never computes a transform.
// Each node is a tile inside the core's `tileBox` bound: kind shape on the left, the name always shown (cut with … when
// it does not fit, full in its tooltip and accessible name — R4 as amended 2026-10-12); a stuck node is the solid black
// tile (R5). A chosen node, its links and its neighbours stay full ink; everything else fades (R3).
// Each node is a link to the core's own href for it (contract v1.4); ดูทั้งหมด / Escape go to `allHref` (nothing chosen).
// v1.16 (REQ-009 R7): the hook is owned by WebDesk (it also draws the panel) and handed in as `view`; every link that
// chooses or clears a node spreads `view.linkProps(href)` — a client navigation, never a page load.
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { RequiredItem, WebLayout } from "@/core/theme/contract";
import { requiredId } from "@/core/theme/required";
import { fitView, neighbours, tileBox } from "@/core/web/view";
import type { WebViewApi } from "@/core/web/useWebView";
import { pageLabel, stuckNodeName, webAll, zoomIn, zoomOut } from "@/core/words";
import { KindMarkShape } from "../parts/KindMark";
import { RequiredList, RequiredPicker } from "../parts/Required";
import { StuckIcon } from "../parts/StuckIcon";
import s from "./diagram.module.css";

const TILE_H = 44;   // the desk's target floor; tileBox keeps it
const MARK = 16;     // kind shape, drawn at the tile's left
const PAD = 12;      // tile padding left / right
const GAP = 8;       // between the shape and the name
const BIG = MARK * 2; // the kind mark alone, on the phone's whole view (A-067)

/** Cut each name that is wider than its tile with … (measured in the browser; the server draws the whole name). */
function useEllipsis(deps: unknown[]) {
  const root = useRef<SVGGElement>(null);
  useLayoutEffect(() => {
    root.current?.querySelectorAll<SVGTextElement>("text[data-max]").forEach((t) => {
      const full = t.getAttribute("data-full") ?? "";
      const max = Number(t.getAttribute("data-max"));
      t.textContent = full;
      if (t.getComputedTextLength() <= max) return;
      let lo = 0, hi = full.length;
      while (lo < hi) {
        const mid = Math.ceil((lo + hi) / 2);
        t.textContent = `${full.slice(0, mid)}…`;
        if (t.getComputedTextLength() <= max) lo = mid; else hi = mid - 1;
      }
      t.textContent = `${full.slice(0, lo)}…`;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return root;
}

export function WebDiagram({ view, selectedKey, allHref, required }: {
  view: WebViewApi<WebLayout>; selectedKey: string | null; allHref: string; required: RequiredItem[];
}) {
  const picker = new RequiredPicker(required);
  // with a node chosen, showAll() without an event clears it the hook's way (its clearHref, a client navigation)
  const clear = () => view.showAll();
  const all = view.linkProps(allHref);
  // v1.15: the hook picks the wide or the tall arrangement by the box's shape — everything below draws the one it returns
  const layout = view.layout;
  const at = new Map(layout.nodes.map((n) => [n.key, n]));
  const near = new Set(selectedKey ? [selectedKey, ...neighbours(layout, selectedKey)] : []);
  const content = useEllipsis([layout, selectedKey]);
  // D-042: on a phone the whole-web view shows kind marks (and the stuck mark) only; names from the first zoom-in on.
  // The box is measured here only to know that fit scale (the core's fitView); the view itself stays the hook's.
  const [box, setBox] = useState<{ w: number; h: number; phone: boolean } | null>(null);
  const boxEl = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = boxEl.current;
    if (!el) return;
    const q = window.matchMedia("(max-width: 47.99em)");
    const measure = () => { const r = el.getBoundingClientRect(); setBox({ w: r.width, h: r.height, phone: q.matches }); };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    q.addEventListener("change", measure);
    return () => { ro.disconnect(); q.removeEventListener("change", measure); };
  }, []);
  const namesOff = !!box?.phone && !selectedKey && view.scale <= fitView(layout, box).scale * 1.01;
  // The name card: at the whole-web view the tiles' names are drawn but too small to read, so the node under the pointer
  // or keyboard focus shows its full name at 14 px beside it, outside the scaled web (A-066 critique, H6). Decorative for
  // a screen reader — the node's own accessible name already says it.
  const frame = useRef<HTMLDivElement>(null);
  const [card, setCard] = useState<{ name: string; x: number; y: number; stuck: boolean } | null>(null);
  // a choice is now a client navigation (v1.16): the view moves under a card placed for the old view — drop it
  useEffect(() => setCard(null), [selectedKey]);
  const show = (el: Element, name: string, stuck: boolean) => {
    const f = frame.current?.getBoundingClientRect(), r = el.getBoundingClientRect();
    if (f) setCard({ name, stuck, x: r.left + r.width / 2 - f.left, y: r.top - f.top });
  };

  // Escape anywhere on the page clears a chosen node (R3), not only inside the web box
  useEffect(() => {
    if (!selectedKey) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !e.defaultPrevented) clear(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedKey, allHref]);

  return (
    <div ref={frame} className={s.webFrame}>
      {/* the controls: a right-aligned row above the box at every width (R2, A-067) */}
      <div className={s.webControls}>
        <button type="button" className={s.webControl} aria-label={zoomIn} onClick={view.zoomIn}>+</button>
        <button type="button" className={s.webControl} aria-label={zoomOut} onClick={view.zoomOut}>−</button>
        <a {...all} className={`${s.webControl} ${s.webAll}`} onClick={(e) => (selectedKey ? all.onClick(e) : view.showAll(e))}>{webAll}</a>
      </div>
      <div
        ref={(el) => { view.viewportRef(el); boxEl.current = el; }}
        data-names={namesOff ? "off" : undefined}
        {...view.handlers}
        className={view.dragging ? `${s.webView} ${s.webViewDragging}` : s.webView}
        tabIndex={0}
        role="region"
        aria-label={pageLabel.web}
      >
        <svg className={s.webSvg} role="presentation">
          <g ref={content} style={view.style}>
            <g aria-hidden="true">
              {layout.edges.map((e) => {
                const a = at.get(e.from), b = at.get(e.to);
                if (!a || !b) return null;
                const mine = selectedKey !== null && (e.from === selectedKey || e.to === selectedKey);
                const faded = selectedKey !== null && !mine;
                return <line key={e.id} x1={a.x} y1={a.y} x2={b.x} y2={b.y} className={mine ? s.webEdgeSelected : faded ? `${s.webEdge} ${s.webFaded}` : s.webEdge} />;
              })}
            </g>
            {layout.nodes.map((n) => {
              const t = tileBox(n);
              const selected = n.key === selectedKey;
              const faded = selectedKey !== null && !near.has(n.key);
              const x = n.x - t.w / 2, y = n.y - TILE_H / 2;
              // a stuck tile also carries mono's one stuck mark (parts/StuckIcon, direction § 5) left of the name (R5, A-066 R1)
              const stuckX = x + PAD + MARK + GAP;
              const textX = n.stuck ? stuckX + MARK + GAP : stuckX;
              const name = n.stuck ? stuckNodeName(n.title) : n.title;
              const cls = [s.nodeLink, faded ? s.webFaded : ""].filter(Boolean).join(" ");
              return (
                <a
                  key={n.key}
                  {...view.linkProps(n.href)}
                  className={cls}
                  aria-label={name}
                  aria-current={selected ? "true" : undefined}
                  onMouseEnter={(e) => show(e.currentTarget, n.title, n.stuck)}
                  onFocus={(e) => show(e.currentTarget, n.title, n.stuck)}
                  onMouseLeave={() => setCard(null)}
                  onBlur={() => setCard(null)}
                >
                  <title>{n.title}</title>
                  {/* the phone's whole view (names off, D-042): the kind mark alone, twice its tile size, on the tile's
                      transparent hit box — no empty bordered tiles (A-067); a stuck node keeps its black ground and
                      mono's stuck mark. Hidden by CSS whenever the tiles show. */}
                  <g className={s.webMarkOnly}>
                    <rect x={x} y={y} width={t.w} height={TILE_H} className={s.webHitBox} />
                    {n.stuck ? <circle cx={n.x} cy={n.y} r={BIG * 0.8} className={s.webStuckDisc} /> : null}
                    <g transform={`translate(${n.x - BIG / 2} ${n.y - BIG / 2})`} className={n.stuck ? s.webMarkOnStuck : undefined}>
                      <KindMarkShape kind={n.kind} size={BIG} solid={false} />
                    </g>
                    {n.stuck ? (
                      <g transform={`translate(${n.x + BIG * 0.35} ${n.y - BIG * 0.95})`}>
                        <circle cx={MARK / 2} cy={MARK / 2} r={MARK / 2} fill="#FFFFFF" />
                        <StuckIcon size={MARK} />
                      </g>
                    ) : null}
                  </g>
                  <g className={s.webTileGroup}>
                  {/* a chosen stuck tile keeps its black and gets the chosen ring outside it */}
                  {selected && n.stuck ? <rect x={x - 5} y={y - 5} width={t.w + 10} height={TILE_H + 10} rx={14} className={s.webStuckRing} /> : null}
                  <rect x={x} y={y} width={t.w} height={TILE_H} rx={10} className={n.stuck ? s.webTileStuck : selected ? s.webTileSelected : s.webTile} />
                  <g transform={`translate(${x + PAD} ${n.y - MARK / 2})`} className={n.stuck ? s.webMarkOnStuck : undefined}>
                    <KindMarkShape kind={n.kind} size={MARK} solid={false} />
                  </g>
                  {n.stuck ? (
                    <g transform={`translate(${stuckX} ${n.y - MARK / 2})`}>
                      {/* a white disc under the mark, so its cut-out "!" reads on the black tile */}
                      <circle cx={MARK / 2} cy={MARK / 2} r={MARK / 2} fill="#FFFFFF" />
                      <StuckIcon size={MARK} />
                    </g>
                  ) : null}
                  <text
                    x={textX}
                    y={n.y}
                    dominantBaseline="central"
                    className={n.stuck ? s.webLabelStuck : s.webLabel}
                    data-full={n.title}
                    data-max={Math.max(0, x + t.w - PAD - textX)}
                    {...picker.takeId(requiredId.part(n.key))}
                  >
                    {n.title}
                  </text>
                  </g>
                </a>
              );
            })}
          </g>
        </svg>
      </div>
      {card ? (
        <div className={card.stuck ? `${s.webName} ${s.webNameStuck}` : s.webName} style={{ left: card.x, top: card.y }} aria-hidden="true">
          {card.name}
        </div>
      ) : null}
      <RequiredList items={picker.rest()} />
    </div>
  );
}
