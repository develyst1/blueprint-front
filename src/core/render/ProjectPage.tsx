// Server-side glue for one page of one project (TASK-B-007): loader → the project's theme → Root → shell (with the
// frame's required items) → <main id="content"> → the theme's page or the default one (with the page's required
// items). A loader state goes to the theme's `state` (or the default) — never to an empty picture.
import { notFound } from "next/navigation";
import { retryAction } from "@/app/actions";
import { contentId } from "@/core/theme/anchors";
import type { FrameVM, PageId, PageVMs, Theme } from "@/core/theme/contract";
import { defaultTheme } from "@/core/theme/default";
import { getTheme } from "@/core/theme/registry";
import { exportHref, frame as buildFrame } from "@/core/model/build/common";
import { ExportButton } from "@/features/export/ExportButton"; // Team A's (REQ-008) — themes never import it (v1.11)
import { pageRequired, shellRequired } from "@/core/model/build/required";
import { loadPage, loadProjectData, type Query } from "@/core/model/load";

export function StateView({ theme, frame, state }: { theme: Theme; frame: FrameVM | null; state: Parameters<NonNullable<Theme["state"]>>[0]["state"] }) {
  const { Root } = theme;
  const State = theme.state ?? defaultTheme.state!;
  return (
    <Root>
      <main id={contentId} tabIndex={-1}>
        <State frame={frame} state={state} required={frame ? shellRequired(frame) : []} />
      </main>
    </Root>
  );
}

export async function ProjectPage({ projectId, page, query }: { projectId: string; page: PageId; query: Query }) {
  const res = await loadPage(page, projectId, query);

  if (!res.ok) {
    if (res.state.kind === "notFound") notFound(); // HTTP 404 → src/app/not-found.tsx
    if (res.state.kind === "unreachable") {
      return <StateView theme={defaultTheme} frame={null} state={{ kind: "unreachable", retry: retryAction }} />;
    }
    // empty: the project exists — show its head in its own theme (v1.2: required = the frame's items)
    const data = await loadProjectData(projectId);
    if (!data.ok) {
      if (data.state === "notFound") notFound();
      return <StateView theme={defaultTheme} frame={null} state={{ kind: "unreachable", retry: retryAction }} />;
    }
    const theme = getTheme(data.data.project.theme);
    return <StateView theme={theme} frame={buildFrame(data.data, page)} state={{ kind: "empty", page }} />;
  }

  const vm = res.vm as PageVMs[PageId];
  const theme = getTheme(vm.frame.project.theme);
  const { Root } = theme;
  const Shell = theme.shell ?? defaultTheme.shell!;
  const Page = (theme.pages?.[page] ?? defaultTheme.pages![page]!) as (p: { vm: PageVMs[PageId]; required: ReturnType<typeof pageRequired> }) => React.ReactNode;
  return (
    <Root>
      <Shell frame={vm.frame} required={shellRequired(vm.frame)} tools={<ExportButton href={exportHref(vm.frame.project.id)} />}>
        <main id={contentId} tabIndex={-1}>
          <Page vm={vm} required={pageRequired(page, vm)} />
        </main>
      </Shell>
    </Root>
  );
}
