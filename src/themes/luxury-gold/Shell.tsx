// The luxury gold shell (direction § 2): a sticky spine at 1440 — wordmark, project, readiness, page list —
// and the page's stage beside it. At ≤ 640 px the same elements become a sticky top bar (project + readiness)
// with the page list as one horizontal strip. The readiness is rendered once, so its required marker is never
// duplicated or hidden at one width (the required-content check looks for a visible marker).
// `tools` (contract v1.11, optional): core-owned controls (today the PDF export) placed beside the readiness — in the
// spine at 1440, in the top bar at 390; absent → nothing, no gap. Print hooks (v1.11): the skip link, the page list and
// the tools are `data-print="screen-only"`.
// The way home (REQ-002 AC-22, D-036, contract v1.12): the wordmark (`productMark`, named by its own text) and a visible
// `allProjects` link, both to the core's `frame.homeHref`, kept together: stacked in the spine at 1440, side by side
// opening the top bar at ≤ 640 px (PM 2026-10-12, TASK-C-020 Q1).
// The two rooms (REQ-017, TASK-C-046): two framed tabs under the readiness, then only the current room's pages in the
// page list. แชต is not a room: a quiet pill beside the tools, at every width.
import type { FrameVM, RequiredItem } from "@/core/theme/contract";
import { contentHref } from "@/core/theme/anchors";
import { findRequired, requiredId, requiredProps } from "@/core/theme/required";
import { allProjects, pageLabel, pageNav, productMark, roomViews, skipToContent } from "@/core/words";
import type { ReactNode } from "react";
import { NavStrip } from "./client/NavStrip";
import { Readiness } from "./primitives/Seal";

export function Shell({ frame, required, tools, children }: { frame: FrameVM; required: RequiredItem[]; tools?: ReactNode; children: ReactNode }) {
  const readinessItem = findRequired(required, requiredId.readiness); // by id, never by text (contract v1.3)
  const others = required.filter((r) => r !== readinessItem);
  // the chat is the one page in no room, so "no room page is current" = the chat is
  const chatCurrent = !frame.rooms.some((r) => r.pages.some((p) => p.current));
  return (
    <div className="lg-shell">
      {/* First focusable element: jump past the page list to the core's <main id="content"> (SPEC-B-001 § Skip link). */}
      <a className="lg-skip" href={contentHref} data-print="screen-only">
        {skipToContent}
      </a>
      <header className="lg-spine">
        <div className="lg-way-home">
          <a className="lg-wordmark" href={frame.homeHref}>{productMark}</a>
          <a className="lg-home-link" href={frame.homeHref} data-print="screen-only">{allProjects}</a>
        </div>
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
          <div className="lg-shell-tools" data-print="screen-only">
            <a className="lg-chat-button" href={frame.chatHref} aria-current={chatCurrent ? "page" : undefined}>{pageLabel.chat}</a>
            {tools}
          </div>
        </div>
        <nav className="lg-rooms" aria-label={pageNav} data-print="screen-only">
          {frame.rooms.map((r) => (
            <a key={r.id} className="lg-room" href={r.href} aria-current={r.current ? "true" : undefined}>
              <span className="lg-room-label">{r.label}</span>
              {r.id === "back" && <span className="lg-room-count">{roomViews(r.pages.length)}</span>}
            </a>
          ))}
        </nav>
        <NavStrip nav={frame.rooms.filter((r) => r.current).flatMap((r) => r.pages)} />
      </header>
      {/* The core passes <main id="content"> as children (SPEC-B-001 § Skip link) — a div here, never a second main. */}
      <div className="lg-stage">{children}</div>
    </div>
  );
}
