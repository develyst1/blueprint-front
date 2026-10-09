// ลำดับงาน — participants down a fixed column, each step a band across; inside a band, a mark where the step uses a
// lane and the step's hand-offs as numbered arrows from the `from` lane to the `to` lane, in the VM's `order` (never
// re-sorted, never derived). Hover / focus shows a hand-off's text. A null end is drawn open, never hidden.
// Positions are grid slots from the VM's own indexes (lane.index, row order, hand-off order) — no layout of our own.
import type { RequiredItem, WorkOrderVM } from "@/core/theme/contract";
import { findRequired, requiredId, requiredProps } from "@/core/theme/required";
import { pageLabel, stepEnds } from "@/core/words";
import { CenterOn } from "../client/CenterOn";
import { SwimHeads } from "../client/SwimHeads";
import { KindMark } from "../primitives/KindMark";
import { Legend } from "../primitives/Legend";
import { Seal } from "../primitives/Seal";

const HEAD = 84; // band header height
const LANE = 56; // one participant row (≥ 44 px hit area)
const SLOT = 64; // one hand-off column inside a band
const PAD = 14;

export function WorkOrder({ vm, required }: { vm: WorkOrderVM; required: RequiredItem[] }) {
  const lanes = vm.layout.lanes.slice().sort((a, b) => a.index - b.index);
  const row = new Map(lanes.map((l, i) => [l.key, i]));
  const yOf = (key: string) => HEAD + (row.get(key) ?? 0) * LANE + LANE / 2;
  const height = HEAD + lanes.length * LANE;

  let x = 0;
  const bands = vm.layout.rows.map((r) => {
    const w = Math.max(1, r.handoffs.length) * SLOT + PAD * 2;
    const b = { r, x, w };
    x += w + 8;
    return b;
  });
  const width = Math.max(x - 8, 1);
  const stuck = bands.find((b) => b.r.step.stuck); // opens with the first stuck band in view

  return (
    <div className="lg-page">
      <h1 className="lg-page-title">{pageLabel.workOrder}</h1>
      {vm.works.length > 1 && (
        <nav className="lg-chip-links" aria-label={pageLabel.workOrder}>
          {vm.works.map((w) => (
            <a key={w.key} className="lg-chip-link" href={w.href} aria-current={w.key === vm.work.key ? "page" : undefined}>
              {w.title}
            </a>
          ))}
        </nav>
      )}
      <Legend />

      <div className="lg-swim">
        <SwimHeads
          heads={bands.map(({ r, x: bx, w }) => ({ key: r.step.key, number: r.step.number, title: r.step.title, stuck: r.step.stuck, x: bx, w }))}
          width={width}
          headHeight={HEAD}
        />
        <div className="lg-swim-lanes" style={{ paddingTop: HEAD }}>
          {lanes.map((l) => {
            const item = findRequired(required, requiredId.lane(l.key));
            return (
              <div key={l.key} className="lg-swim-lane" style={{ height: LANE }}>
                <KindMark kind={l.kind} />
                <span {...(item ? requiredProps(item) : {})}>{l.title}</span>
              </div>
            );
          })}
        </div>

        <CenterOn x={stuck ? stuck.x + stuck.w / 2 : 0} y={0} nearest>
        <div className="lg-diagram lg-swim-scroll" role="region" aria-label={pageLabel.workOrder} tabIndex={0}>
          <div className="lg-canvas" style={{ width, height }}>
            {lanes.slice(1).map((l, i) => (
              <span key={`rule-${l.key}`} className="lg-swim-rule" style={{ top: HEAD + (i + 1) * LANE, width }} aria-hidden="true" />
            ))}

            {bands.map(({ r, x: bx, w }) => {
              const item = findRequired(required, requiredId.step(r.step.key));
              return (
                <section
                  key={r.step.key}
                  className="lg-band"
                  data-stuck={r.step.stuck || undefined}
                  style={{ left: bx, width: w, height }}
                  aria-label={`${r.step.number} ${r.step.title}`}
                >
                  <header className="lg-band-head" style={{ height: HEAD }}>
                    <span className="lg-band-num">{r.step.number}</span>
                    <span className="lg-band-title" {...(item ? requiredProps(item) : {})}>
                      {r.step.title}
                    </span>
                    {r.step.ends && <span className="lg-medallion-end">{stepEnds}</span>}
                    {r.step.stuck && <Seal size={20} label={r.step.stuckWordings.join("; ")} />}
                  </header>

                  {/* where this step uses a lane */}
                  {r.lanes.map((k) => (
                    <span key={`use-${k}`} className="lg-band-use" style={{ top: yOf(k) - 4 }} aria-hidden="true" />
                  ))}

                  {/* the hand-offs, in order */}
                  {r.handoffs.map((h, i) => {
                    const cx = PAD + i * SLOT + SLOT / 2;
                    const y1 = h.from ? yOf(h.from) : HEAD + 6;
                    const y2 = h.to ? yOf(h.to) : height - 6;
                    const top = Math.min(y1, y2);
                    const down = y2 >= y1;
                    return (
                      <button
                        key={h.key}
                        type="button"
                        className="lg-handoff"
                        data-open-from={h.from ? undefined : true}
                        data-open-to={h.to ? undefined : true}
                        data-down={down || undefined}
                        style={{ left: cx - 22, top: top - 16, height: Math.abs(y2 - y1) + 32 }}
                        aria-label={`${r.step.number}.${h.order} ${h.text}`}
                      >
                        <span className="lg-handoff-line" aria-hidden="true" />
                        <span className="lg-handoff-n" aria-hidden="true">
                          {h.order}
                        </span>
                        <span className="lg-handoff-tip" role="tooltip">
                          {h.text}
                        </span>
                      </button>
                    );
                  })}
                </section>
              );
            })}
          </div>
        </div>
        </CenterOn>
      </div>
    </div>
  );
}
