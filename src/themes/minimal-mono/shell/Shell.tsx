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
import { allProjects, pageLabel, pageNav, productMark, roomViews, skipToContent } from "@/core/words";
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
  // The strip leads to ติดอยู่ตรงไหน (the core's own href) — except on that page, where it would lead nowhere.
  const pages = frame.rooms.flatMap((r) => r.pages);
  const stuckNav = pages.find((item) => item.page === "stuck" && !item.current);
  const strip = <ReadinessStrip readiness={frame.readiness} requiredAttrs={stripAttrs} />;
  // REQ-017: the two rooms, then only the current room's pages; the chat is the one page in no room
  const roomPages = frame.rooms.filter((r) => r.current).flatMap((r) => r.pages);
  const chatCurrent = !pages.some((p) => p.current);
  const rooms = (
    <div className={s.rooms}>
      {frame.rooms.map((r) => (
        <a key={r.id} href={r.href} className={s.room} aria-current={r.current ? "true" : undefined}>
          {r.label}
          {r.id === "back" && <span className={s.roomCount}>{roomViews(r.pages.length)}</span>}
        </a>
      ))}
    </div>
  );
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
            {/* the wordmark is a way home (AC-22): the frame's homeHref; its accessible name is its visible word (WCAG 2.5.3) */}
            <Text component="a" href={frame.homeHref} fw={800} fz="md" className={s.wordmark}>
              {productMark}
            </Text>
            <Text component="h1" fw={700} fz="lg" truncate="end" className={s.project}>
              {frame.project.name}
            </Text>
          </Group>
          {/* the way home in words (AC-22, D-036) — quiet: ink text, underline on hover; a screen-only control */}
          <a href={frame.homeHref} className={s.allProjects} data-print="screen-only">
            {allProjects}
          </a>
          {stuckNav ? (
            <a href={stuckNav.href} className={s.stripHome}>
              {strip}
            </a>
          ) : (
            strip
          )}
          {/* the chat is not a room: a header button (REQ-017, comp A) */}
          <a href={frame.chatHref} className={s.chatButton} aria-current={chatCurrent ? "page" : undefined} data-print="screen-only">
            {pageLabel.chat}
          </a>
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
        {rooms}
        <div className={s.navList}>
          {roomPages.map((item) => (
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
            rooms sit side by side over the room's page names as one row of real links that scrolls, with the
            browser's own scrollbar kept visible as the cue that the row is wider than the screen. */}
        <nav className={s.phoneNav} aria-label={pageNav}>
          {rooms}
          <StripScroll className={s.strip} edge={48}>
            <div className={s.stripRow}>
              {roomPages.map((item) => (
                <a key={item.page} href={item.href} aria-current={item.current ? "page" : undefined} className={s.stripLink}>
                  {item.label}
                </a>
              ))}
            </div>
          </StripScroll>
        </nav>
        <div className={s.content}>
          <RequiredList items={rest} />
          {children}
        </div>
      </AppShellMain>
    </AppShell>
  );
}
