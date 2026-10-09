// ผังการทำงาน — the work as medallion steps on a bronze thread, drawn at the core's positions. Both directions are
// server-rendered and switched by CSS (LR ≥ 768 px, TB below). Each condition sits on a plaque at its edge's
// labelAnchor (after the fork); a labelled edge with no anchor gets its label at 55 % along its path. Required: every
// step title and every condition (by id). Both directions carry the markers; the hidden one never counts.
import type { FlowLayout, FlowchartVM, RequiredItem, StepVM } from "@/core/theme/contract";
import { findRequired, requiredId, requiredProps } from "@/core/theme/required";
import { pageLabel, stepEnds } from "@/core/words";
import { CenterOn } from "../client/CenterOn";
import { ArrowDefs, DiagramFrame, at, pathD, pointAlong } from "../primitives/Diagram";
import { Seal } from "../primitives/Seal";
import { StuckLines } from "../primitives/StuckLines";

const PAD = 24;

function FlowDiagram({
  layout,
  dir,
  steps,
  required,
}: {
  layout: FlowLayout;
  dir: "LR" | "TB";
  steps: Map<string, StepVM>;
  required: RequiredItem[];
}) {
  const arrow = `lg-flow-arrow-${dir}`;
  const shift = (p: { x: number; y: number }) => ({ x: p.x + PAD, y: p.y + PAD });
  // Open with the first stuck step in view (the core's position, never one we compute).
  const stuck = layout.nodes.find((n) => steps.get(n.key)?.stuck);
  const focus = stuck ? { x: stuck.x + stuck.w / 2 + PAD, y: stuck.y + stuck.h / 2 + PAD } : { x: 0, y: 0 };
  return (
    <CenterOn x={focus.x} y={focus.y} nearest>
    <DiagramFrame label={pageLabel.flowchart} width={layout.width + PAD * 2} height={layout.height + PAD * 2} className={`lg-flow lg-flow-${dir}`}>
      <svg className="lg-lines" width={layout.width + PAD * 2} height={layout.height + PAD * 2} aria-hidden="true">
        <ArrowDefs id={arrow} />
        {layout.edges.map((e) => (
          <path key={`${e.from}-${e.to}`} d={pathD(e.points.map(shift))} className="lg-edge" markerEnd={`url(#${arrow})`} />
        ))}
      </svg>

      {layout.nodes.map((n) => {
        const s = steps.get(n.key);
        if (!s) return null;
        const item = findRequired(required, requiredId.step(n.key));
        return (
          <a
            key={n.key}
            href={s.href}
            className="lg-fnode"
            data-stuck={s.stuck || undefined}
            data-end={s.ends || undefined}
            style={{ ...at(n.x + PAD, n.y + PAD), width: n.w, minHeight: n.h }}
          >
            <span className="lg-fnode-medal" aria-hidden="true">
              {s.number}
            </span>
            <span className="lg-fnode-text">
              <span className="lg-fnode-title" {...(item ? requiredProps(item) : {})}>
                {s.title}
              </span>
              {s.ends && <span className="lg-medallion-end">{stepEnds}</span>}
            </span>
            {/* The node keeps its title and seal only; the wordings are on the plaque (REVIEW-A-002 row 1). The seal
                still names them for screen readers, "; " between them so each is heard as its own. */}
            {s.stuck && (
              <span className="lg-fnode-seal">
                <Seal size={20} label={s.stuckWordings.join("; ")} />
              </span>
            )}
          </a>
        );
      })}

      {layout.edges
        .filter((e) => e.label)
        .map((e) => {
          const p = shift(e.labelAnchor ?? pointAlong(e.points, 0.55));
          const item = findRequired(required, requiredId.branch(e.from, e.to));
          return (
            <span
              key={`label-${e.from}-${e.to}`}
              className="lg-flabel"
              style={at(p.x, p.y, true)}
              {...(item ? requiredProps(item) : {})}
            >
              {e.label}
            </span>
          );
        })}

      {/* For screen readers: every arrow, in the layout's order, with its condition. */}
      <ol className="lg-sr-only">
        {layout.edges.map((e) => (
          <li key={`sr-${e.from}-${e.to}`}>
            {steps.get(e.from)?.title} → {steps.get(e.to)?.title}
            {e.label ? ` (${e.label})` : ""}
          </li>
        ))}
      </ol>
    </DiagramFrame>
    </CenterOn>
  );
}

export function Flowchart({ vm, required }: { vm: FlowchartVM; required: RequiredItem[] }) {
  const steps = new Map(vm.work.steps.map((s) => [s.key, s]));
  const stuck = vm.work.steps.filter((s) => s.stuck);
  return (
    // Stage + plaque only when there is something stuck to put on the plaque; otherwise the picture takes the width.
    <div className={stuck.length > 0 ? "lg-page lg-page-split" : "lg-page"}>
      <div className="lg-page-stage">
      <h1 className="lg-page-title">{pageLabel.flowchart}</h1>
      {vm.works.length > 1 && (
        <nav className="lg-chip-links" aria-label={pageLabel.flowchart} data-print="screen-only">
          {vm.works.map((w) => (
            <a key={w.key} className="lg-chip-link" href={w.href} aria-current={w.key === vm.work.key ? "page" : undefined}>
              {w.title}
            </a>
          ))}
        </nav>
      )}
      <h2 className="lg-work-title">{vm.work.title}</h2>
      <FlowDiagram layout={vm.layouts.LR} dir="LR" steps={steps} required={required} />
      <FlowDiagram layout={vm.layouts.TB} dir="TB" steps={steps} required={required} />
      </div>

      {/* Direction § 4: seal + "!" on the node, the stuck wording on the plaque — each step's wordings one line each. */}
      {stuck.length > 0 && (
        <aside className="lg-plaque">
          {stuck.map((s) => (
            <div className="lg-plaque-stuck" key={s.key}>
              <Seal size={22} />
              <div>
                <a className="lg-plaque-step" href={s.href}>
                  {s.number} {s.title}
                </a>
                <StuckLines wordings={s.stuckWordings} />
              </div>
            </div>
          ))}
        </aside>
      )}
    </div>
  );
}
