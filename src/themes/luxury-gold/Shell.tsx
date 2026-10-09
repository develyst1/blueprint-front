// The luxury gold shell (direction § 2): a sticky spine at 1440 — wordmark, project, readiness, page list —
// and the page's stage beside it. At ≤ 640 px the same elements become a sticky top bar (project + readiness)
// with the page list as one horizontal strip. The readiness is rendered once, so its required marker is never
// duplicated or hidden at one width (the required-content check looks for a visible marker).
import type { FrameVM, RequiredItem } from "@/core/theme/contract";
import { contentHref } from "@/core/theme/anchors";
import { findRequired, requiredId, requiredProps } from "@/core/theme/required";
import { skipToContent } from "@/core/words";
import type { ReactNode } from "react";
import { NavStrip } from "./client/NavStrip";
import { Readiness } from "./primitives/Seal";

export function Shell({ frame, required, children }: { frame: FrameVM; required: RequiredItem[]; children: ReactNode }) {
  const readinessItem = findRequired(required, requiredId.readiness); // by id, never by text (contract v1.3)
  const others = required.filter((r) => r !== readinessItem);
  return (
    <div className="lg-shell">
      {/* First focusable element: jump past the page list to the core's <main id="content"> (SPEC-B-001 § Skip link). */}
      <a className="lg-skip" href={contentHref}>
        {skipToContent}
      </a>
      <header className="lg-spine">
        <p className="lg-wordmark">Blueprint</p>
        <p className="lg-spine-project">{frame.project.name}</p>
        <div className="lg-spine-readiness">
          <Readiness
            stuckCount={frame.readiness.stuckCount}
            label={frame.readiness.label}
            ready={frame.readiness.ready}
            labelProps={readinessItem ? requiredProps(readinessItem) : undefined}
          />
          {others.map((r) => (
            <span key={r.id} className="lg-spine-required" {...requiredProps(r)}>
              {r.text}
            </span>
          ))}
        </div>
        <NavStrip nav={frame.nav} />
      </header>
      {/* The core passes <main id="content"> as children (SPEC-B-001 § Skip link) — a div here, never a second main. */}
      <div className="lg-stage">{children}</div>
    </div>
  );
}
