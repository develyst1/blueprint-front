// ลำดับการโต้ตอบ — one step's messages: participant heads at the core's x, lifelines down, each message an arrow at its
// y in the VM's order with its text on a plaque; a reply is drawn dashed back. A null end is an open end, never hidden.
// The step chooser is a list of links (steps[].href). Required: every message text (by id).
import type { RequiredItem, SequenceVM } from "@/core/theme/contract";
import { findRequired, requiredId, requiredProps } from "@/core/theme/required";
import { pageLabel } from "@/core/words";
import { ArrowDefs, DiagramFrame, at } from "../primitives/Diagram";
import { KindMark } from "../primitives/KindMark";
import { Legend } from "../primitives/Legend";
import { Seal } from "../primitives/Seal";

const TOP = 72; // participant heads sit above the layout's own y range
const OPEN = 40; // how far an open end reaches out

export function Sequence({ vm, required }: { vm: SequenceVM; required: RequiredItem[] }) {
  const L = vm.layout;
  const xOf = new Map(L.participants.map((p) => [p.key, p.x]));
  const height = L.height + TOP;
  const arrow = "lg-seq-arrow";
  const titleOf = (k: string | null) => (k ? L.participants.find((p) => p.key === k)?.title ?? k : "");

  return (
    <div className="lg-page">
      <h1 className="lg-page-title">{pageLabel.sequence}</h1>

      <nav className="lg-step-tabs" aria-label={pageLabel.sequence} data-print="screen-only">
        {vm.steps.map((s) => (
          <a key={s.key} className="lg-step-tab" href={s.href} aria-current={s.key === vm.step.key ? "page" : undefined}>
            <span className="lg-step-tab-num">{s.number}</span>
            {s.title}
            {s.stuck && <Seal size={16} label={s.stuckWordings.join("; ")} />}
          </a>
        ))}
      </nav>

      <Legend only={[...new Set(L.participants.map((p) => p.kind))]} />

      <DiagramFrame label={pageLabel.sequence} width={L.width} height={height} className="lg-seq">
        <svg className="lg-lines" width={L.width} height={height} aria-hidden="true">
          <ArrowDefs id={arrow} />
          {L.participants.map((p) => (
            <line key={p.key} x1={p.x} x2={p.x} y1={TOP - 8} y2={height - 8} className="lg-lifeline" />
          ))}
          {L.messages.map((m) => {
            const y = m.y + TOP;
            const fx = m.from ? xOf.get(m.from)! : (m.to ? xOf.get(m.to)! : 0) - OPEN;
            const tx = m.to ? xOf.get(m.to)! : fx + OPEN;
            return (
              <g key={m.key}>
                <line x1={fx} x2={tx} y1={y} y2={y} className="lg-msg" markerEnd={`url(#${arrow})`} />
                {!m.from && <circle cx={fx} cy={y} r={5} className="lg-open-end" />}
                {!m.to && <circle cx={tx} cy={y} r={5} className="lg-open-end" />}
                {m.reply && <line x1={tx} x2={fx} y1={y + 22} y2={y + 22} className="lg-msg lg-msg-reply" markerEnd={`url(#${arrow})`} />}
              </g>
            );
          })}
        </svg>

        {L.participants.map((p) => (
          <span key={`head-${p.key}`} className="lg-seq-head" style={at(p.x, 30, true)}>
            <KindMark kind={p.kind} />
            {p.title}
          </span>
        ))}

        {L.messages.map((m) => {
          const fx = m.from ? xOf.get(m.from)! : (m.to ? xOf.get(m.to)! : 0) - OPEN;
          const tx = m.to ? xOf.get(m.to)! : fx + OPEN;
          const item = findRequired(required, requiredId.message(m.key));
          return (
            <span
              key={`text-${m.key}`}
              className="lg-msg-text"
              style={at((fx + tx) / 2, m.y + TOP - 14, true)}
              tabIndex={0}
              {...(item ? requiredProps(item) : {})}
            >
              <span className="lg-msg-n" aria-hidden="true">
                {m.order}
              </span>
              {m.text}
              {m.reply && <span className="lg-msg-reply-text">{m.reply}</span>}
            </span>
          );
        })}

        <ol className="lg-sr-only">
          {L.messages.map((m) => (
            <li key={`sr-${m.key}`}>
              {titleOf(m.from)} → {titleOf(m.to)}: {m.text}
              {m.reply ? ` / ${m.reply}` : ""}
            </li>
          ))}
        </ol>
      </DiagramFrame>
    </div>
  );
}
