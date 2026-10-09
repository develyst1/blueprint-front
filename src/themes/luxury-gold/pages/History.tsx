// ประวัติ — choose a part (links from the VM), then its changes as a timeline, oldest first in the VM's order
// (never re-sorted). Each entry: atLabel (core-formatted, D-006), cause (already words), whatLabel (v1.7; the raw `what`
// code is never shown), summary.
// Required: the chosen part's title.
import type { HistoryVM, RequiredItem } from "@/core/theme/contract";
import { findRequired, requiredId, requiredProps } from "@/core/theme/required";
import { pageLabel } from "@/core/words";
import { PartChooser } from "../client/PartChooser";

export function History({ vm, required }: { vm: HistoryVM; required: RequiredItem[] }) {
  const partItem = vm.part ? findRequired(required, requiredId.part(vm.part.key)) : undefined;
  // No part chosen yet: the chooser is the page's main content, under its own heading (v1.8 historyPick) — not a side
  // plaque beside an empty stage.
  if (!vm.part) {
    return (
      <div className="lg-page lg-history">
        <h1 className="lg-page-title">{pageLabel.history}</h1>
        {vm.parts.length > 0 && <PartChooser parts={vm.parts} current={null} main />}
      </div>
    );
  }
  return (
    <div className="lg-page lg-page-split lg-history">
      <div className="lg-page-stage">
        <h1 className="lg-page-title">{pageLabel.history}</h1>
        <h2 className="lg-history-part" {...(partItem ? requiredProps(partItem) : {})}>
          {vm.part.title}
        </h2>
        {vm.entries.length > 0 && (
          <ol className="lg-timeline">
            {vm.entries.map((e, i) => (
              <li key={`${e.at}:${i}`} className="lg-timeline-entry" data-at={e.at}>
                <span className="lg-timeline-dot" aria-hidden="true" />
                <div className="lg-timeline-head">
                  <span className="lg-timeline-date">{e.atLabel}</span>
                  <span className="lg-timeline-cause">{e.cause}</span>
                  {/* whatLabel = words.historyWhat[what], "" when no word exists — then nothing; the raw code is never shown. */}
                  {e.whatLabel && <span className="lg-timeline-what">{e.whatLabel}</span>}
                </div>
                {/* v1.8: summary may be "" (no title to show) — then no line at all, never a placeholder. */}
                {e.summary && <p className="lg-timeline-summary">{e.summary}</p>}
              </li>
            ))}
          </ol>
        )}
      </div>

      {vm.parts.length > 0 && <PartChooser parts={vm.parts} current={vm.part.key} />}
    </div>
  );
}
