"use client";

// clean-blue page states (AC-14…16) with Ant's Result; the empty project is one message and a way in. With a frame (an empty project) the whole shell stays,
// so the project's name, readiness and pages are still there (v1.2).
import { Button, Result } from "antd";
import { useTransition, type ReactNode } from "react";
import type { FrameVM, PageState, RequiredItem } from "@/core/theme/contract";
import { apiDown, backHome, emptyProject, notFound, retry, startInChat } from "@/core/words";
import { Shell } from "./Shell";
import s from "./pages/pages.module.css";

function Body({ state, frame }: { state: PageState; frame: FrameVM | null }) {
  const [pending, start] = useTransition();
  if (state.kind === "unreachable") {
    return (
      <div className={s.stateBox} role="alert">
        <Result status="warning" title={apiDown}
          extra={<Button type="primary" size="large" loading={pending} onClick={() => start(() => state.retry())}>{retry}</Button>} />
      </div>
    );
  }
  if (state.kind === "empty") {
    // one message and where to start (D-032, REVIEW-A-004 row 9) — the chat's href is the frame's own, never typed
    const chat = frame?.chatHref;
    return (
      <div className={`${s.stateBox} ${s.emptyState}`}>
        <p className={s.stateText}>{emptyProject}</p>
        {chat && <Button type="primary" size="large" href={chat}>{startInChat}</Button>}
      </div>
    );
  }
  return (
    <div className={s.stateBox}>
      <Result status="404" title={notFound} extra={<Button type="primary" size="large" href={state.homeHref}>{backHome}</Button>} />
    </div>
  );
}

// `tools` (v1.13): the core's controls on an empty project (ส่งออก PDF, D-038) — the shell's bar places them, as on every page
export function State({ frame, state, required, tools }: { frame: FrameVM | null; state: PageState; required: RequiredItem[]; tools?: ReactNode }) {
  return frame ? <Shell frame={frame} required={required} tools={tools}><div><Body state={state} frame={frame} /></div></Shell> : <Body state={state} frame={null} />;
}
