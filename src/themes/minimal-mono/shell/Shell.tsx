import "@mantine/core/styles/UnstyledButton.css";
import "@mantine/core/styles/NavLink.css";
import "@mantine/core/styles/AppShell.css";
import "@mantine/core/styles/Group.css";
import "@mantine/core/styles/Text.css";
import { AppShell, AppShellHeader, AppShellMain, AppShellNavbar, Group, NavLink, Text } from "@mantine/core";
import type { ReactNode } from "react";
import type { FrameVM, RequiredItem } from "@/core/theme/contract";
import { contentHref } from "@/core/theme/anchors";
import { requiredId } from "@/core/theme/required";
import { pageNav, skipToContent } from "@/core/words";
import { ReadinessStrip } from "../parts/ReadinessStrip";
import { RequiredList, RequiredPicker } from "../parts/Required";
import { StripScroll } from "./StripScroll";
import s from "./shell.module.css";

// The page frame (direction § 2). AppShell in static mode: in its default mode it writes --app-shell-* on :root,
// which would leak outside the theme root (direction § 8). Every href comes from the core; we build none.
// `tools` (v1.11): the core's controls (ส่งออก PDF) — placed at the header's end, after the readiness strip; never built here.
export function Shell({ frame, required = [], tools, children }: { frame: FrameVM; required?: RequiredItem[]; tools?: ReactNode; children: ReactNode }) {
  // v1.1: the frame's own required items (the readiness label) are marked on the strip that shows them.
  const picker = new RequiredPicker(required);
  const stripAttrs = picker.takeId(requiredId.readiness);
  const rest = picker.rest();
  // The strip leads to ติดอยู่ตรงไหน (the core's own nav href) — except on that page, where it would lead nowhere.
  const stuckNav = frame.nav.find((item) => item.page === "stuck" && !item.current);
  const strip = <ReadinessStrip readiness={frame.readiness} requiredAttrs={stripAttrs} />;
  return (
    <AppShell
      mode="static"
      header={{ height: 64 }}
      navbar={{ width: 220, breakpoint: "sm", collapsed: { mobile: true } }}
      padding={0}
      className={s.shell}
    >
      {/* first focusable item: straight to the page content, which the core renders as <main id="content"> */}
      <a href={contentHref} className={s.skip}>
        {skipToContent}
      </a>
      <AppShellHeader className={s.header}>
        {/* one row from 48em up; below it the row wraps, so the project name keeps its width (A-048 R1) */}
        <div className={s.headerRow}>
          <Group gap="lg" wrap="nowrap" miw={0} className={s.headerStart}>
            <Text component="span" fw={800} fz="md" className={s.wordmark}>
              Blueprint
            </Text>
            <Text component="h1" fw={700} fz="lg" truncate="end" className={s.project}>
              {frame.project.name}
            </Text>
          </Group>
          {stuckNav ? (
            <a href={stuckNav.href} className={s.stripHome}>
              {strip}
            </a>
          ) : (
            strip
          )}
          {tools && (
            <div className={s.tools} data-print="screen-only">
              {tools}
            </div>
          )}
        </div>
      </AppShellHeader>

      {/* Mantine's AppShellNavbar is itself a <nav>: it carries the name, and the list inside is a plain div — a
          named nav inside an unnamed one was two landmarks for one list (TASK-A-042) */}
      <AppShellNavbar className={s.navbar} p="md" aria-label={pageNav}>
        <div className={s.navList}>
          {frame.nav.map((item) => (
            <NavLink
              key={item.page}
              component="a"
              href={item.href}
              label={item.label}
              active={item.current}
              aria-current={item.current ? "page" : undefined}
              variant="filled"
              color="ink"
              className={s.navLink}
            />
          ))}
        </div>
      </AppShellNavbar>

      {/* a div, not <main>: the core's own <main id="content"> arrives as children — one <main> per page */}
      <AppShellMain component="div" className={s.main}>
        {/* Below 768 px the navbar is removed (not just moved off-screen, so it leaves the tab order) and the same
            page names become one row of real links that scrolls, with the browser's own scrollbar kept visible
            as the cue that the row is wider than the screen. */}
        <StripScroll className={s.strip} edge={48}>
          <nav className={s.stripRow} aria-label={pageNav}>
            {frame.nav.map((item) => (
              <a key={item.page} href={item.href} aria-current={item.current ? "page" : undefined} className={s.stripLink}>
                {item.label}
              </a>
            ))}
          </nav>
        </StripScroll>
        <div className={s.content}>
          <RequiredList items={rest} />
          {children}
        </div>
      </AppShellMain>
    </AppShell>
  );
}
