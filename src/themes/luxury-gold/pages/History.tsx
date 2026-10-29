// ประวัติ — choose a part (links from the VM), then its changes as a timeline, oldest first in the VM's order
// (never re-sorted). Each entry: atLabel (core-formatted, D-006), cause (already words), whatLabel (v1.7; the raw `what`
// code is never shown), summary. REQ-103: each entry also says who typed it; with no part chosen the whole project's
// changes lead, under "ประวัติการแก้ทั้งหมด" (an audit row has no word, so its action code stands in `what`).
// Required: the chosen part's title.
import type { HistoryVM, RequiredItem } from "@/core/theme/contract";
import { findRequired, requiredId, requiredProps } from "@/core/theme/required";
import { historyAll, pageLabel } from "@/core/words";
import { PartChooser } from "../client/PartChooser";

function Entries({ vm }: { vm: HistoryVM }) {
  return (
    <ol className="lg-timeline">
      {vm.entries.map((e, i) => (
        <li key={`${e.at}:${i}`} className="lg-timeline-entry" data-at={e.at}>
          <span className="lg-timeline-dot" aria-hidden="true" />
          <div className="lg-timeline-head">
            <span className="lg-timeline-date">{e.atLabel}</span>
            {e.by && <span className="lg-timeline-by">{e.by}</span>}
            {e.cause && <span className="lg-timeline-cause">{e.cause}</span>}
            {/* whatLabel = words.historyWhat[what], "" when no word exists. Per part the raw code is never shown; project-wide an
                audit row's action code stands in, since the PM has given no word for it (TASK-108 Q1). */}
            {(e.whatLabel || (!vm.part && e.what)) && <span className="lg-timeline-what">{e.whatLabel || e.what}</span>}
          </div>
          {/* v1.8: summary may be "" (no title to show) — then no line at all, never a placeholder. */}
          {e.summary && <p className="lg-timeline-summary">{e.summary}</p>}
        </li>
      ))}
    </ol>
  );
}

export function History({ vm, required }: { vm: HistoryVM; required: RequiredItem[] }) {
  const partItem = vm.part ? findRequired(required, requiredId.part(vm.part.key)) : undefined;
  // No part chosen yet: the chooser is the page's main content, under its own heading (v1.8 historyPick) — not a side
  // plaque beside an empty stage.
  if (!vm.part) {
    return (
      <div className="lg-page lg-history">
        <h1 className="lg-page-title">{pageLabel.history}</h1>
        {vm.entries.length > 0 && (
          <>
            <h2 className="lg-history-part">{historyAll}</h2>
            <Entries vm={vm} />
          </>
        )}
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
        {vm.entries.length > 0 && <Entries vm={vm} />}
      </div>

      {vm.parts.length > 0 && <PartChooser parts={vm.parts} current={vm.part.key} />}
    </div>
  );
}
