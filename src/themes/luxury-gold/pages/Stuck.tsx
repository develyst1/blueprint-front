// ติดอยู่ตรงไหน — every stuck item, in the VM's order: its wording (already REQ words), its title, a link to the part it
// is about, and the proposed answer when there is one (labelled, no button — answering waits for the chat REQ).
// Required: each item's wording.
import type { RequiredItem, StuckVM } from "@/core/theme/contract";
import { findRequired, requiredId, requiredProps } from "@/core/theme/required";
import { pageLabel, proposedAnswer } from "@/core/words";
import { Seal } from "../primitives/Seal";

export function Stuck({ vm, required }: { vm: StuckVM; required: RequiredItem[] }) {
  return (
    <div className="lg-page">
      <h1 className="lg-page-title">{pageLabel.stuck}</h1>
      {vm.items.length > 0 && (
        <ol className="lg-stuck-list">
          {vm.items.map((it) => {
            const item = findRequired(required, requiredId.stuck(it));
            return (
              <li key={`${it.key}:${it.reason ?? it.kind}`} className="lg-stuck-item">
                <Seal size={26} />
                <div className="lg-stuck-body">
                  <p className="lg-stuck-wording" {...(item ? requiredProps(item) : {})}>
                    {it.wording}
                  </p>
                  {/* When the item is its own target, the link below already names it — compare ids, never text (v1.3). */}
                  {it.key !== it.target.key && <p className="lg-stuck-title">{it.title}</p>}
                  <a className="lg-stuck-target" href={it.target.href}>
                    {it.target.title}
                  </a>
                  {it.proposedAnswer && (
                    <div className="lg-stuck-answer">
                      <span className="lg-stuck-answer-label">{proposedAnswer}</span>
                      <span>{it.proposedAnswer}</span>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
