// The default shell: skip link first, the project head with its readiness, the แชต button and the core's tools, then the
// two rooms (REQ-017, comp A) with the current room's pages under them. Library-free; one centred column at every width.
import type { ReactNode } from "react";
import type { FrameVM, RequiredItem } from "../contract";
import { contentHref } from "../anchors";
import { requiredId } from "../required";
import { allProjects, pageLabel, pageNav, productMark, roomViews, skipToContent } from "@/core/words";
import { Mark } from "./Mark";
import s from "./default.module.css";

/** AC-22 (D-036): the wordmark and โปรเจกต์ทั้งหมด, both real links to the frame's own homeHref — no aria-label, the
 *  visible words are the names (WCAG 2.5.3). */
export function WayHome({ href }: { href: string }) {
  return (
    <span className={s.wayHome} data-print="screen-only">
      <a className={s.wordmark} href={href}>{productMark}</a>
      <a className={s.homeLink} href={href}>{allProjects}</a>
    </span>
  );
}

// `tools` (v1.11): the core's controls (ส่งออก PDF) — placed at the header's end, never built here.
// `data-print="screen-only"` marks what a printed / exported page leaves out (REQ-008 print hooks).
export function Shell({ frame, required, tools, children }: { frame: FrameVM; required: RequiredItem[]; tools?: ReactNode; children: ReactNode }) {
  return (
    <>
      <a className={s.skip} href={contentHref} data-print="screen-only">{skipToContent}</a>
      <header className={s.header}>
        <div className={s.bar}>
          <WayHome href={frame.homeHref} />
          <h1>{frame.project.name}</h1>
          <span className={s.muted}>{frame.project.createdLabel}</span>
          <span className={frame.readiness.stuckCount > 0 ? `${s.readiness} ${s.readinessStuck}` : s.readiness}>
            <Mark required={required} id={requiredId.readiness}>{frame.readiness.label}</Mark>
          </span>
          <span className={s.tools} data-print="screen-only">
            {/* the chat is not a room: a header button (REQ-017, comp A) — current when no room page is */}
            <a className={s.chatButton} href={frame.chatHref} aria-current={frame.rooms.some((r) => r.pages.some((p) => p.current)) ? undefined : "page"}>{pageLabel.chat}</a>
            {tools}
          </span>
        </div>
      </header>
      {/* one landmark: the two rooms, then the current room's pages (REQ-017) */}
      <nav className={s.nav} aria-label={pageNav} data-print="screen-only">
        <div className={s.rooms}>
          {frame.rooms.map((r) => (
            <a key={r.id} href={r.href} className={s.room} aria-current={r.current ? "true" : undefined}>
              {r.label}
              {r.id === "back" && <span className={s.roomCount}>{roomViews(r.pages.length)}</span>}
            </a>
          ))}
        </div>
        <div className={s.subnav}>
          {frame.rooms.filter((r) => r.current).flatMap((r) => r.pages).map((n) => (
            <a key={n.page} href={n.href} aria-current={n.current ? "page" : undefined}>{n.label}</a>
          ))}
        </div>
      </nav>
      {children}
    </>
  );
}
