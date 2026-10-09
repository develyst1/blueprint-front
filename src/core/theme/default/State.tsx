"use client";

// The default theme's page states (AC-14…16). A client component of its own because the retry button calls
// state.retry — a server action handed down by the core (SPEC-B-001 § "Server/client split").
// With a frame (an empty project) the project's head and readiness stay visible (v1.2: `required` = the frame's items).
import { useTransition } from "react";
import type { FrameVM, PageState, RequiredItem } from "../contract";
import { requiredId } from "../required";
import { apiDown, backHome, emptyProject, notFound, retry } from "@/core/words";
import { Mark } from "./Mark";
import s from "./default.module.css";

export function State({ frame, state, required }: { frame: FrameVM | null; state: PageState; required: RequiredItem[] }) {
  const [pending, start] = useTransition();
  return (
    <>
      {frame && (
        <header className={s.header}>
          <h1>{frame.project.name}</h1>
          <span className={frame.readiness.stuckCount > 0 ? `${s.readiness} ${s.readinessStuck}` : s.readiness}>
            <Mark required={required} id={requiredId.readiness}>{frame.readiness.label}</Mark>
          </span>
        </header>
      )}
      {state.kind === "unreachable" ? (
        <div className={s.state} role="alert">
          <p>{apiDown}</p>
          <button type="button" disabled={pending} onClick={() => start(() => state.retry())}>{retry}</button>
        </div>
      ) : state.kind === "empty" ? (
        <div className={s.state}>
          <p>{emptyProject}</p>
        </div>
      ) : (
        <div className={s.state}>
          <p>{notFound}</p>
          <a href={state.homeHref}>{backHome}</a>
        </div>
      )}
    </>
  );
}
