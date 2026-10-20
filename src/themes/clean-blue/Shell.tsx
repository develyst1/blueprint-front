"use client";

// clean-blue shell: skip link · top bar (project, date, readiness, แชต, the core's tools) · the two rooms over the current
// room's page dock (REQ-017) · the page. No sidebar — mono and gold both have one (direction § 1). The bar, the rooms
// and the page share one centred column (P1).
import { CheckCircleFilled, WarningFilled } from "@ant-design/icons";
import type { ReactNode } from "react";
import type { FrameVM, ReadinessVM, RequiredItem } from "@/core/theme/contract";
import { contentHref } from "@/core/theme/anchors";
import { requiredId } from "@/core/theme/required";
import { allProjects, pageLabel, pageNav, productMark, roomViews, skipToContent } from "@/core/words";
import { PageTile } from "./parts/Tile";
import { Req } from "./parts/Req";
import { useEdges } from "./parts/useEdges";
import s from "./clean-blue.module.css";

/** Stuck → amber with a warning mark · ready → blue with a check · empty (not ready, nothing stuck) → neutral. */
export function Readiness({ readiness, required }: { readiness: ReadinessVM; required: RequiredItem[] }) {
  const tone = readiness.stuckCount > 0 ? s.readinessStuck : readiness.ready ? "" : s.readinessEmpty;
  const Mark = readiness.stuckCount > 0 ? WarningFilled : readiness.ready ? CheckCircleFilled : null;
  return (
    <span className={`${s.readiness} ${tone}`}>
      {Mark && <span className={s.readinessDot} aria-hidden><Mark /></span>}
      <Req required={required} id={requiredId.readiness}>{readiness.label}</Req>
    </span>
  );
}

export function Bar({ frame, required, tools }: { frame: FrameVM; required: RequiredItem[]; tools?: ReactNode }) {
  // the chat is the one page in no room, so "no room page is current" = the chat is
  const chatCurrent = !frame.rooms.some((r) => r.pages.some((p) => p.current));
  return (
    <header className={s.bar}>
      {/* AC-22 (D-036): the wordmark and โปรเจกต์ทั้งหมด, real links to the frame's homeHref — the visible words are the names */}
      <span className={s.wayHome} data-print="screen-only">
        <a className={s.wordmark} href={frame.homeHref}>{productMark}</a>
        <a className={s.homeLink} href={frame.homeHref}>{allProjects}</a>
      </span>
      <div className={s.project}>
        <h1>{frame.project.name}</h1>
        <span className={s.created}>{frame.project.createdLabel}</span>
      </div>
      <div className={s.barEnd}>
        <Readiness readiness={frame.readiness} required={required} />
        {/* the chat is not a room: a header button (REQ-017, comp A) */}
        <a className={s.chatButton} href={frame.chatHref} aria-current={chatCurrent ? "page" : undefined} data-print="screen-only">
          <PageTile page="chat" tone={chatCurrent ? "current" : "plain"} size="sm" />
          {pageLabel.chat}
        </a>
        {tools && <span data-print="screen-only">{tools}</span>}
      </div>
    </header>
  );
}

export function Shell({ frame, required, tools, children }: { frame: FrameVM; required: RequiredItem[]; tools?: ReactNode; children: ReactNode }) {
  const dock = useEdges<HTMLDivElement>(true);
  // the back room reads wide views: its own wider column (TASK-C-047), from the current room — no VM field
  const wide = frame.rooms.find((r) => r.current)?.id === "back";
  return (
    <div className={wide ? `${s.page} ${s.pageWide}` : s.page}>
      <a className={s.skip} href={contentHref} data-print="screen-only">{skipToContent}</a>
      <Bar frame={frame} required={required} tools={tools} />
      {/* one landmark: the two rooms as the main tabs, then the current room's pages as the dock (REQ-017) */}
      <nav className={s.nav} aria-label={pageNav} data-print="screen-only">
        <div className={s.rooms}>
          {frame.rooms.map((r) => (
            <a key={r.id} href={r.href} className={s.room} aria-current={r.current ? "true" : undefined}>
              {r.label}
              {r.id === "back" && <span className={s.roomCount}>{roomViews(r.pages.length)}</span>}
            </a>
          ))}
        </div>
        <div ref={dock} className={`${s.dock} ${s.edges}`}>
          {frame.rooms.filter((r) => r.current).flatMap((r) => r.pages).map((n) => (
            <a key={n.page} href={n.href} className={s.dockItem} aria-current={n.current ? "page" : undefined}>
              <PageTile page={n.page} tone={n.current ? "current" : n.page === "stuck" && frame.readiness.stuckCount > 0 ? "stuck" : "plain"} />
              {n.label}
            </a>
          ))}
        </div>
      </nav>
      <div className={s.main}>{children}</div>
    </div>
  );
}
