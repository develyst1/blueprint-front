"use client";

// clean-blue page states (AC-14…16) with Ant's Result / Empty. With a frame (an empty project) the whole shell stays,
// so the project's name, readiness and pages are still there (v1.2).
import { Button, Empty, Result } from "antd";
import { useTransition } from "react";
import type { FrameVM, PageState, RequiredItem } from "@/core/theme/contract";
import { apiDown, backHome, emptyProject, notFound, retry } from "@/core/words";
import { Shell } from "./Shell";
import s from "./pages/pages.module.css";

function Body({ state }: { state: PageState }) {
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
    return (
      <div className={s.stateBox}>
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={<span className={s.stateText}>{emptyProject}</span>} />
      </div>
    );
  }
  return (
    <div className={s.stateBox}>
      <Result status="404" title={notFound} extra={<Button type="primary" size="large" href={state.homeHref}>{backHome}</Button>} />
    </div>
  );
}

export function State({ frame, state, required }: { frame: FrameVM | null; state: PageState; required: RequiredItem[] }) {
  return frame ? <Shell frame={frame} required={required}><div><Body state={state} /></div></Shell> : <Body state={state} />;
}
