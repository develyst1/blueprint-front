// The three page states (AC-14…16), in the exact words of @/core/words, on a plaque.
// Server-safe: the only interactive part (retry) is its own client file. Inside the shell when there is a frame.
import type { FrameVM, PageState, RequiredItem } from "@/core/theme/contract";
import { apiDown, backHome, emptyProject, notFound } from "@/core/words";
import { Alert } from "@heroui/react";
import { RetryButton } from "./client/RetryButton";
import { Shell } from "./Shell";

function Body({ state }: { state: PageState }) {
  if (state.kind === "unreachable") {
    // A system failure, not a stuck point: HeroUI Alert (danger) — never the stuck seal or the stuck tint.
    return (
      <Alert className="lg-state lg-state-down" status="danger" role="alert">
        <Alert.Indicator />
        <Alert.Content>
          <Alert.Title className="lg-state-text">{apiDown}</Alert.Title>
          <RetryButton onRetry={state.retry} />
        </Alert.Content>
      </Alert>
    );
  }
  if (state.kind === "empty") {
    return (
      <div className="lg-state">
        {/* The page's only heading: these states have no page title of their own. */}
        <h1 className="lg-state-text">{emptyProject}</h1>
      </div>
    );
  }
  return (
    <div className="lg-state">
      <h1 className="lg-state-text">{notFound}</h1>
      <a className="lg-state-link" href={state.homeHref}>
        {backHome}
      </a>
    </div>
  );
}

export function State({ frame, state, required }: { frame: FrameVM | null; state: PageState; required: RequiredItem[] }) {
  if (!frame) return <Body state={state} />;
  // `required` = the frame's own items, handed down by the core (contract v1.2 — TASK-C-004 Q1).
  return (
    <Shell frame={frame} required={required}>
      <Body state={state} />
    </Shell>
  );
}
