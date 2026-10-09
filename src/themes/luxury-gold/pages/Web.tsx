// ใยโหนด — every part at the core's x/y as a small medallion with its kind's shape, each a link to its own href
// (the core resolves `selected`); links drawn as hairline threads. The chosen part's plaque: title, stampLabel,
// dateLabel, cameFrom and its links (label + link) — never the raw stamp / date / link kind (v1.5, v1.6).
// Required: the stuck parts' titles (by id).
import type { RequiredItem, WebVM } from "@/core/theme/contract";
import { findRequired, requiredId, requiredProps } from "@/core/theme/required";
import { pageLabel, partKind } from "@/core/words";
import { CenterOn } from "../client/CenterOn";
import { DiagramFrame, at } from "../primitives/Diagram";
import { PartMark } from "../primitives/PartMark";
import { Seal } from "../primitives/Seal";

const PAD = 60;

export function Web({ vm, required }: { vm: WebVM; required: RequiredItem[] }) {
  const L = vm.layout;
  const pos = new Map(L.nodes.map((n) => [n.key, { x: n.x + PAD, y: n.y + PAD }]));
  const sel = vm.selected;
  const focus = (sel && pos.get(sel.key)) ?? { x: (L.width + PAD * 2) / 2, y: (L.height + PAD * 2) / 2 };
  const present = [...new Set(L.nodes.map((n) => n.kind))];

  return (
    // Stage + plaque only when a part is chosen (the plaque); otherwise the web takes the full width.
    <div className={sel ? "lg-page lg-page-split" : "lg-page"}>
      <div className="lg-page-stage">
        <h1 className="lg-page-title">{pageLabel.web}</h1>
        <ul className="lg-legend">
          {present.map((k) => (
            <li key={k}>
              <PartMark kind={k} />
              {partKind[k]}
            </li>
          ))}
        </ul>
        <CenterOn x={focus.x} y={focus.y}>
          <DiagramFrame label={pageLabel.web} width={L.width + PAD * 2} height={L.height + PAD * 2} className="lg-web">
            <svg className="lg-lines" width={L.width + PAD * 2} height={L.height + PAD * 2} aria-hidden="true">
              {L.edges.map((e) => {
                const a = pos.get(e.from), b = pos.get(e.to);
                if (!a || !b) return null;
                const hot = sel && (e.from === sel.key || e.to === sel.key);
                return <line key={e.id} x1={a.x} y1={a.y} x2={b.x} y2={b.y} className={hot ? "lg-thread lg-thread-hot" : "lg-thread"} />;
              })}
            </svg>
            {L.nodes.map((n) => {
              const p = pos.get(n.key)!;
              const item = findRequired(required, requiredId.part(n.key));
              return (
                <a
                  key={n.key}
                  href={n.href}
                  className="lg-wnode"
                  data-stuck={n.stuck || undefined}
                  data-kind={n.kind}
                  aria-current={sel?.key === n.key ? "true" : undefined}
                  style={at(p.x, p.y, true)}
                >
                  <PartMark kind={n.kind} />
                  <span className="lg-wnode-title" {...(item ? requiredProps(item) : {})}>
                    {n.title}
                  </span>
                  {n.stuck && <Seal size={16} />}
                </a>
              );
            })}
          </DiagramFrame>
        </CenterOn>
      </div>

      {sel && (
        <aside className="lg-plaque lg-web-detail">
          <div className="lg-web-detail-head">
            <PartMark kind={sel.kind} />
            <span className="lg-web-kind">{partKind[sel.kind]}</span>
          </div>
          <h2 className="lg-plaque-title">{sel.title}</h2>
          <ul className="lg-web-facts">
            {[sel.stampLabel, sel.dateLabel, sel.cameFrom].filter(Boolean).map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
          {sel.links.length > 0 && (
            <ul className="lg-web-links">
              {sel.links.map((l) => (
                <li key={`${l.kind}-${l.direction}-${l.key}`}>
                  <span className="lg-web-link-label">{l.label}</span>
                  <a className="lg-chip-link" href={l.href}>
                    {l.title}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </aside>
      )}
    </div>
  );
}
