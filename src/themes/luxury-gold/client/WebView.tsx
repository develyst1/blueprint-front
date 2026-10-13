"use client";

// ใยโหนด's map table (REQ-009, TASK-C-026): the whole web on open, then zoom into one node — every view comes from the
// core's `useWebView` (SPEC-B-001 v1.14); this file never computes a transform. The lines are an SVG, the nodes real links
// at the core's x/y, both inside one canvas the hook moves. With a node chosen: its own threads are hot, every thread and
// node it does not touch fades. Every link that chooses or clears a node — a node, ดูทั้งหมด, ปิด, a เชื่อมกับ entry —
// spreads the hook's `linkProps`, so a click never reloads the page (R7, TASK-C-027); that is why the chosen part's plaque
// is drawn here, beside the stage. Escape clears through the hook (`clearHref`). Words only from @/core/words.
import type { ReactNode } from "react";
import { neighbours } from "@/core/web/view";
import { useWebView } from "@/core/web/useWebView";
import type { WebVM } from "@/core/theme/contract";
import { closeDialog, linkedWith, pageLabel, partKind, stuckNodeName, webAll, zoomIn, zoomOut } from "@/core/words";
import { PartMark } from "../primitives/PartMark";
import { Seal } from "../primitives/Seal";

// − and + drawn as strokes of one weight: the font's U+2212 rendered as a short hyphen (Sector's review, C-026)
const Sign = ({ plus }: { plus?: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
    <path d={plus ? "M2 8h12M8 2v12" : "M2 8h12"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export function WebView({ head, wide, tall, selected, allHref, titleProps }: {
  /** the page title and the legend, drawn on the server, first in the stage */
  head: ReactNode;
  wide: WebVM["layout"];
  /** the same web arranged for a portrait box (v1.15) — the hook picks one by the box */
  tall: WebVM["tall"];
  selected: WebVM["selected"];
  allHref: string;
  /** the required-content marker for each node title, by part key (resolved on the server page) */
  titleProps: Record<string, Record<string, string>>;
}) {
  const chosen = selected?.key ?? null;
  const view = useWebView(wide, chosen, { clearHref: allHref, tall });
  // draw the layout the hook picked, never the one passed in (SPEC v1.15)
  const layout = view.layout;
  const pos = new Map(layout.nodes.map((n) => [n.key, n]));
  const near = new Set(chosen ? neighbours(layout, chosen) : []);
  // ดูทั้งหมด: with a node chosen it clears the choice in the page; with none it just re-fits (as the core's default theme)
  const all = view.linkProps(allHref);

  return (
    <>
      <div className="lg-page-stage">
        {head}
        <div className="lg-web-table">
          <div className="lg-web-tools">
            <button type="button" className="lg-web-tool" aria-label={zoomOut} onClick={view.zoomOut}>
              <Sign />
            </button>
            <button type="button" className="lg-web-tool" aria-label={zoomIn} onClick={view.zoomIn}>
              <Sign plus />
            </button>
            <a className="lg-web-all" {...all} onClick={(e) => (chosen ? all.onClick(e) : view.showAll(e))}>{webAll}</a>
          </div>
          <div
            ref={view.viewportRef}
            {...view.handlers}
            className="lg-diagram lg-web"
            role="region"
            aria-label={pageLabel.web}
            tabIndex={0}
            data-chosen={chosen ? "" : undefined}
            data-dragging={view.dragging || undefined}
          >
            <div className="lg-canvas" style={{ ...view.style, width: layout.width, height: layout.height }}>
              <svg className="lg-lines" width={layout.width} height={layout.height} aria-hidden="true">
                {layout.edges.map((e) => {
                  const a = pos.get(e.from), b = pos.get(e.to);
                  if (!a || !b) return null;
                  const hot = chosen !== null && (e.from === chosen || e.to === chosen);
                  return <line key={e.id} x1={a.x} y1={a.y} x2={b.x} y2={b.y} className={hot ? "lg-thread lg-thread-hot" : "lg-thread"} />;
                })}
              </svg>
              {layout.nodes.map((n) => (
                <a
                  key={n.key}
                  {...view.linkProps(n.href)}
                  className="lg-wnode"
                  data-stuck={n.stuck || undefined}
                  data-kind={n.kind}
                  data-near={near.has(n.key) || undefined}
                  aria-current={chosen === n.key ? "true" : undefined}
                  style={{ left: n.x, top: n.y }}
                >
                  <PartMark kind={n.kind} />
                  <span className="lg-wnode-title" {...titleProps[n.key]}>
                    {n.title}
                  </span>
                  {n.stuck && <Seal size={16} label={stuckNodeName(n.title)} />}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* the chosen part's plaque: kind, name, stampLabel / dateLabel / cameFrom, ปิด and เชื่อมกับ — never the raw stamp,
          date or link kind (v1.5, v1.6) */}
      {selected && (
        <aside className="lg-plaque lg-web-detail">
          <div className="lg-web-detail-head">
            <PartMark kind={selected.kind} />
            <span className="lg-web-kind">{partKind[selected.kind]}</span>
            <a className="lg-web-close" {...view.linkProps(allHref)}>{closeDialog}</a>
          </div>
          <h2 className="lg-plaque-title">{selected.title}</h2>
          <ul className="lg-web-facts">
            {[selected.stampLabel, selected.dateLabel, selected.cameFrom].filter(Boolean).map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
          {selected.links.length > 0 && (
            <>
              <h3 className="lg-web-linked">{linkedWith}</h3>
              <ul className="lg-web-links">
                {selected.links.map((l) => (
                  <li key={`${l.kind}-${l.direction}-${l.key}`}>
                    <span className="lg-web-link-label">{l.label}</span>
                    <a className="lg-chip-link" {...view.linkProps(l.href)}>
                      {l.title}
                    </a>
                  </li>
                ))}
              </ul>
            </>
          )}
        </aside>
      )}
    </>
  );
}
