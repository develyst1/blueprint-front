// The default shell: skip link first, the project head with its readiness, the page names. Library-free.
import type { ReactNode } from "react";
import type { FrameVM, RequiredItem } from "../contract";
import { contentHref } from "../anchors";
import { requiredId } from "../required";
import { pageNav, skipToContent } from "@/core/words";
import { Mark } from "./Mark";
import s from "./default.module.css";

// `tools` (v1.11): the core's controls (ส่งออก PDF) — placed at the header's end, never built here.
// `data-print="screen-only"` marks what a printed / exported page leaves out (REQ-008 print hooks).
export function Shell({ frame, required, tools, children }: { frame: FrameVM; required: RequiredItem[]; tools?: ReactNode; children: ReactNode }) {
  return (
    <>
      <a className={s.skip} href={contentHref} data-print="screen-only">{skipToContent}</a>
      <header className={s.header}>
        <h1>{frame.project.name}</h1>
        <span className={s.muted}>{frame.project.createdLabel}</span>
        <span className={frame.readiness.stuckCount > 0 ? `${s.readiness} ${s.readinessStuck}` : s.readiness}>
          <Mark required={required} id={requiredId.readiness}>{frame.readiness.label}</Mark>
        </span>
        {tools && <span className={s.tools} data-print="screen-only">{tools}</span>}
      </header>
      <nav className={s.nav} aria-label={pageNav} data-print="screen-only">
        {frame.nav.map((n) => (
          <a key={n.page} href={n.href} aria-current={n.current ? "page" : undefined}>{n.label}</a>
        ))}
      </nav>
      {children}
    </>
  );
}
