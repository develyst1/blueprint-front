"use client";

// clean-blue shell: skip link · top bar (project, date, readiness, the core's tools) · the page dock · the page.
// No sidebar — mono and gold both have one (direction § 1).
import { CheckCircleFilled, WarningFilled } from "@ant-design/icons";
import type { ReactNode } from "react";
import type { FrameVM, ReadinessVM, RequiredItem } from "@/core/theme/contract";
import { contentHref } from "@/core/theme/anchors";
import { requiredId } from "@/core/theme/required";
import { pageNav, skipToContent } from "@/core/words";
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
  return (
    <header className={s.bar}>
      <div className={s.project}>
        <h1>{frame.project.name}</h1>
        <span className={s.created}>{frame.project.createdLabel}</span>
      </div>
      <div className={s.barEnd}>
        <Readiness readiness={frame.readiness} required={required} />
        {tools && <span data-print="screen-only">{tools}</span>}
      </div>
    </header>
  );
}

export function Shell({ frame, required, tools, children }: { frame: FrameVM; required: RequiredItem[]; tools?: ReactNode; children: ReactNode }) {
  const dock = useEdges<HTMLElement>(true);
  return (
    <div className={s.page}>
      <a className={s.skip} href={contentHref} data-print="screen-only">{skipToContent}</a>
      <Bar frame={frame} required={required} tools={tools} />
      <nav ref={dock} className={`${s.dock} ${s.edges}`} aria-label={pageNav} data-print="screen-only">
        {frame.nav.map((n) => (
          <a key={n.page} href={n.href} className={s.dockItem} aria-current={n.current ? "page" : undefined}>
            <PageTile page={n.page} tone={n.current ? "current" : n.page === "stuck" && frame.readiness.stuckCount > 0 ? "stuck" : "plain"} />
            {n.label}
          </a>
        ))}
      </nav>
      <div className={s.main}>{children}</div>
    </div>
  );
}
