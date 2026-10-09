// Server-side glue for /p/<id>/chat (SPEC-A-006), like the core's ProjectPage: loader → the project's theme → Root →
// shell (the frame's required items) → <main id="content"> → the theme's chat page, or DefaultChat. Not found and
// API down take the core's own paths (404 page · the default theme's unreachable state, SA-B on REVIEW-C-002 row 28).
// An empty project is not an empty state here: the chat is where an empty project starts (R1).
import { notFound } from "next/navigation";
import { retryAction as coreRetry } from "@/app/actions";
import { exportHref } from "@/core/model/build/common";
import { shellRequired } from "@/core/model/build/required";
import { StateView } from "@/core/render/ProjectPage";
import { contentId } from "@/core/theme/anchors";
import { defaultTheme } from "@/core/theme/default";
import { getTheme } from "@/core/theme/registry";
import { ExportButton } from "@/features/export/ExportButton";
import {
  acceptAction, answerAction, parkAction, retryAction, sendAction, setCreativityAction, setModelAction, undoAction, uploadAction,
} from "./actions";
import type { ChatActions } from "./contract";
import { DefaultChat } from "./DefaultChat";
import { chatRequired, loadChat } from "./load";
import s from "./chat.module.css";

export async function ChatScreen({ projectId, focus }: { projectId: string; focus: string | null }) {
  const res = await loadChat(projectId, focus);
  if (!res.ok) {
    if (res.state === "notFound") notFound();
    return <StateView theme={defaultTheme} frame={null} state={{ kind: "unreachable", retry: coreRetry }} />;
  }
  const { vm } = res;
  const theme = getTheme(vm.frame.project.theme);
  const { Root } = theme;
  const Shell = theme.shell ?? defaultTheme.shell!;
  const Chat = theme.chat ?? DefaultChat; // Theme.chat (B-011); a theme without one gets the default chat page
  const actions: ChatActions = {
    send: sendAction.bind(null, projectId),
    accept: acceptAction.bind(null, projectId),
    answer: answerAction.bind(null, projectId),
    park: parkAction.bind(null, projectId),
    undo: undoAction.bind(null, projectId),
    upload: uploadAction.bind(null, projectId),
    setModel: setModelAction.bind(null, projectId),
    setCreativity: setCreativityAction.bind(null, projectId),
    retry: retryAction.bind(null, projectId),
  };
  return (
    <Root>
      <Shell frame={vm.frame} required={shellRequired(vm.frame)} tools={<ExportButton href={exportHref(vm.frame.project.id)} />}>
        <main id={contentId} tabIndex={-1}>
          {/* the core's default frame pads nothing (measured: chat box at x 0 on a phone); a theme's own shell does */}
          <div className={theme.id === defaultTheme.id || !theme.shell ? s.bare : undefined}>
            <Chat vm={vm} actions={actions} required={chatRequired(vm)} />
          </div>
        </main>
      </Shell>
    </Root>
  );
}
