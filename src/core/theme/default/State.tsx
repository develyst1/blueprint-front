"use client";

// The default theme's page states (AC-14…16). A client component of its own because the retry button calls
// state.retry — a server action handed down by the core (SPEC-B-001 § "Server/client split").
// With a frame (an empty project) the whole Shell stays — the name, readiness, แชต, the tools and the two rooms
// (REQ-017 AC-2, DEF-1, TASK-C-048) — and the empty body is one sentence and where to start: the chat.
import { useTransition, type ReactNode } from "react";
import type { FrameVM, PageState, RequiredItem } from "../contract";
import { apiDown, backHome, emptyProject, notFound, retry, startInChat } from "@/core/words";
import { Shell } from "./Shell";
import s from "./default.module.css";

function Body({ state, frame }: { state: PageState; frame: FrameVM | null }) {
  const [pending, start] = useTransition();
  if (state.kind === "unreachable") {
    return (
      <div className={s.state} role="alert">
        <p>{apiDown}</p>
        <button type="button" disabled={pending} onClick={() => start(() => state.retry())}>{retry}</button>
      </div>
    );
  }
  if (state.kind === "empty") {
    // the chat's href is the frame's own, never typed (D-032)
    return (
      <div className={s.state}>
        <p>{emptyProject}</p>
        {frame && <a href={frame.chatHref}>{startInChat}</a>}
      </div>
    );
  }
  return (
    <div className={s.state}>
      <p>{notFound}</p>
      <a href={state.homeHref}>{backHome}</a>
    </div>
  );
}

// `tools` (v1.13): the core's controls on an empty project (ส่งออก PDF, D-038) — the Shell's header places them, as on every page
export function State({ frame, state, required, tools }: { frame: FrameVM | null; state: PageState; required: RequiredItem[]; tools?: ReactNode }) {
  return frame ? (
    <Shell frame={frame} required={required} tools={tools}><Body state={state} frame={frame} /></Shell>
  ) : (
    <Body state={state} frame={null} />
  );
}
