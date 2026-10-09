// Server-side glue for /p/<id>/ready (SPEC-C-002), the same pattern as the chat's ChatScreen: loader → the project's
// theme → Root → shell (the frame's required items) → <main id="content"> → the theme's ready page, or DefaultReady.
// Not found and API down take the core's own paths (404 page · the default theme's unreachable state).
import type { FC } from "react";
import { notFound } from "next/navigation";
import { retryAction as coreRetry } from "@/app/actions";
import { shellRequired } from "@/core/model/build/required";
import { StateView } from "@/core/render/ProjectPage";
import { contentId } from "@/core/theme/anchors";
import type { Theme } from "@/core/theme/contract";
import { defaultTheme } from "@/core/theme/default";
import { getTheme } from "@/core/theme/registry";
import { askAction, confirmAction, markAction, startQuizAction } from "./actions";
import type { ReadyActions, ReadyPageProps } from "./contract";
import { DefaultReady } from "./DefaultReady";
import { loadReady, readyRequired } from "./load";
import s from "./ready.module.css";

// `Theme.ready` is in the contract (v1.10): a theme that has one draws the page, every other theme gets DefaultReady.
const readyOf = (theme: Theme): FC<ReadyPageProps> => theme.ready ?? DefaultReady;

export async function ReadyScreen({ projectId }: { projectId: string }) {
  const res = await loadReady(projectId);
  if (!res.ok) {
    if (res.state === "notFound") notFound();
    return <StateView theme={defaultTheme} frame={null} state={{ kind: "unreachable", retry: coreRetry }} />;
  }
  const { vm } = res;
  const theme = getTheme(vm.frame.project.theme);
  const { Root } = theme;
  const Shell = theme.shell ?? defaultTheme.shell!;
  const Ready = readyOf(theme);
  const actions: ReadyActions = {
    startQuiz: startQuizAction.bind(null, projectId),
    ask: askAction.bind(null, projectId),
    mark: markAction.bind(null, projectId),
    confirm: confirmAction.bind(null, projectId),
  };
  return (
    <Root>
      <Shell frame={vm.frame} required={shellRequired(vm.frame)}>
        <main id={contentId} tabIndex={-1} className={theme === defaultTheme ? s.bare : undefined}>
          <Ready vm={vm} actions={actions} required={readyRequired(vm)} />
        </main>
      </Shell>
    </Root>
  );
}
