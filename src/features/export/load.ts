// The print view's loader (SPEC-A-007 § E1, TASK-A-045). Server-side only: it reads the API through the core's
// loaders and client. One cover, then every page in PAGES order — workOrder / flowchart once per work, sequence once per
// step of every work, history once per part that has entries — each a view model the core's default page draws.
import { api } from "@/core/api/client";
import { apiLoad } from "@/core/api/load";
import { formatThaiDate } from "@/core/format/date";
import { frame as buildFrame, PAGES, works } from "@/core/model/build/common";
import type { ProjectData } from "@/core/model/build/types";
import { loadPage, loadProjectData, type Query } from "@/core/model/load";
import type { PageId, PageVMs } from "@/core/theme/contract";

export type Cover = {
  name: string;
  /** the newest confirmed version, or null = not confirmed yet */
  version: number | null;
  /** today, the core's Thai date (D-006) */
  exportDate: string;
  readiness: string;
  /** every stuck item's wording, none hidden (R3) */
  stuck: string[];
};

export type Section = { [P in PageId]: { page: P; key: string; subtitle: string | null; vm: PageVMs[P] } }[PageId];

export type PrintLoaded =
  | { kind: "ok"; cover: Cover; sections: Section[] }
  | { kind: "empty"; cover: Cover }
  | { kind: "notFound" }
  | { kind: "unreachable" };

/** The cover from what the core already builds: the frame's readiness label, the stuck page's wordings. Pure. */
export function buildCover(input: { data: ProjectData; version: number | null; stuck: string[]; now: Date }): Cover {
  const frame = buildFrame(input.data, "overview");
  return {
    name: input.data.project.name,
    version: input.version,
    exportDate: formatThaiDate(input.now.toISOString()),
    readiness: frame.readiness.label,
    stuck: input.stuck,
  };
}

/** Which page loads to make, in PAGES order (pure — tested). */
export function plan(data: ProjectData): { page: PageId; query: Query; subtitle: string | null }[] {
  const ws = works(data);
  const out: { page: PageId; query: Query; subtitle: string | null }[] = [];
  for (const page of PAGES) {
    if (page === "workOrder" || page === "flowchart") {
      for (const w of ws) out.push({ page, query: { work: w.key }, subtitle: ws.length > 1 ? w.title : null });
    } else if (page === "sequence") {
      for (const w of ws) for (const st of w.steps) out.push({ page, query: { step: st.key }, subtitle: `${st.number} ${st.title}` });
    } else if (page === "history") {
      // one per part; parts with no entries are dropped after loading
      for (const p of data.parts) out.push({ page, query: { part: p.key }, subtitle: p.title });
    } else {
      out.push({ page, query: {}, subtitle: null });
    }
  }
  return out;
}

export async function loadPrint(projectId: string): Promise<PrintLoaded> {
  const res = await loadProjectData(projectId);
  if (!res.ok) return { kind: res.state };
  const data = res.data;
  const [versions, stuckPage] = await Promise.all([
    apiLoad(api.GET("/v1/projects/{projectId}/versions", { params: { path: { projectId } } })),
    loadPage("stuck", projectId),
  ]);
  const version = versions.ok ? (versions.data.latest?.version ?? null) : null;
  const stuck = stuckPage.ok ? stuckPage.vm.items.map((i) => i.wording) : [];
  const cover = buildCover({ data, version, stuck, now: new Date() });
  if (data.parts.length === 0) return { kind: "empty", cover };

  const sections: Section[] = [];
  for (const step of plan(data)) {
    const r = await loadPage(step.page, projectId, step.query);
    if (!r.ok) {
      if (r.state.kind === "unreachable") return { kind: "unreachable" };
      continue; // a page with nothing to draw (no work, no step) is left out
    }
    if (step.page === "history" && (r.vm as PageVMs["history"]).entries.length === 0) continue;
    const key = `${step.page}:${step.query.work ?? step.query.step ?? step.query.part ?? ""}`;
    sections.push({ page: step.page, key, subtitle: step.subtitle, vm: r.vm } as Section);
  }
  return { kind: "ok", cover, sections };
}
