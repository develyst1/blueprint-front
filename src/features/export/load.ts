// The print view's loader (SPEC-A-007 § E1, TASK-A-045). Server-side only: it reads the API through the core's
// loaders and client. One cover, then every page in PAGES order — workOrder / flowchart once per work, sequence once per
// step of every work, history once per part that has entries — each a view model the core's default page draws.
import { api } from "@/core/api/client";
import { apiLoad } from "@/core/api/load";
import { formatThaiDate } from "@/core/format/date";
import { frame as buildFrame, PAGES, works } from "@/core/model/build/common";
import type { ProjectData } from "@/core/model/build/types";
import { loadPage, loadProjectData, type Query } from "@/core/model/load";
import { partKind } from "@/core/words";
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

// ---------- a big diagram stays readable (D-040, TASK-A-064) ----------
// "Labels at least 8 pt. A diagram that would shrink below that prints on its own landscape A4 page; if still too small
// there, its parts are also listed as a plain table." Decided from numbers the core already hands us — the layout's
// width/height (px) and the smallest label font the core draws — so a page without JavaScript prints the same.
export const MIN_LABEL_PT = 8;
/** the smallest label font in the core's diagrams (`core/theme/default/pages.tsx`: fontSize 14/15, WEB_PX 14) — a test reads the file */
export const LABEL_PX = 14;
/** The content box of each sheet in mm: A4 minus the 14 mm side and 16/18 mm top/bottom margins; the height keeps ~23 mm
 *  for the page's heading and legend (portrait: the print CSS's `max-height: 240mm` of 263; landscape: 153 of 176). */
export const PAGE_MM = { portrait: { w: 182, h: 240 }, landscape: { w: 269, h: 153 } } as const;
const PX_PER_MM = 96 / 25.4;

export type Orient = "portrait" | "landscape";
export type DiagramPlan = { orient: Orient; table: boolean; ptPortrait: number; ptLandscape: number };

/** The smallest label's size on paper, in pt, when an svg of w × h px is shrunk (never enlarged) into the sheet's box. 1 px = 0.75 pt. */
export function printedLabelPt(w: number, h: number, orient: Orient): number {
  const box = PAGE_MM[orient];
  const scale = Math.min(1, (box.w * PX_PER_MM) / w, (box.h * PX_PER_MM) / h);
  return LABEL_PX * scale * 0.75;
}

export function planDiagram(w: number, h: number): DiagramPlan {
  const ptPortrait = printedLabelPt(w, h, "portrait");
  const ptLandscape = printedLabelPt(w, h, "landscape");
  const ok = (pt: number) => pt >= MIN_LABEL_PT - 1e-9;
  if (ok(ptPortrait)) return { orient: "portrait", table: false, ptPortrait, ptLandscape };
  // Landscape only where it makes the labels bigger. A wide, flat diagram gains (269 mm of width); a tall one does not —
  // landscape's box is only 153 mm high, so the web's 1925 × 1808 px prints at 3.4 pt there against 3.8 pt in portrait
  // (measured, TASK-A-064). Where neither reaches 8 pt, the better orientation is kept and the parts table follows.
  if (ptLandscape > ptPortrait) return { orient: "landscape", table: !ok(ptLandscape), ptPortrait, ptLandscape };
  return { orient: "portrait", table: true, ptPortrait, ptLandscape };
}

/** The drawn size of a section's diagram (the layout the core's page draws), or null for a page with no diagram. */
export function diagramSize(sec: Section): { w: number; h: number } | null {
  if (sec.page === "flowchart") return { w: sec.vm.layouts.LR.width, h: sec.vm.layouts.LR.height };
  if (sec.page === "sequence") return { w: sec.vm.layout.width, h: sec.vm.layout.height };
  if (sec.page === "web") return { w: sec.vm.layout.width, h: sec.vm.layout.height };
  return null;
}

export type PartsRow = { kind: string; title: string; links: string[] };

/** The parts of a section's diagram as plain rows — what the table under a too-small diagram lists (D-040). Kind word from the
 *  core's legend; "links" = the titles at the far end of the diagram's arrows from this part, each once, in drawing order.
 *  No keys on paper. Null for a page with no diagram. */
export function partsTable(sec: Section): PartsRow[] | null {
  let parts: { key: string; kind: string; title: string }[];
  let arrows: { from: string | null; to: string | null }[];
  if (sec.page === "web") {
    parts = sec.vm.layout.nodes.map((n) => ({ key: n.key, kind: partKind[n.kind], title: n.title }));
    arrows = sec.vm.layout.edges;
  } else if (sec.page === "flowchart") {
    parts = sec.vm.work.steps.map((st) => ({ key: st.key, kind: partKind.step, title: st.title }));
    arrows = sec.vm.layouts.LR.edges;
  } else if (sec.page === "sequence") {
    parts = sec.vm.layout.participants.map((p) => ({ key: p.key, kind: partKind[p.kind], title: p.title }));
    arrows = sec.vm.layout.messages;
  } else return null;
  const title = new Map(parts.map((p) => [p.key, p.title]));
  return parts.map((p) => {
    const links: string[] = [];
    for (const a of arrows) {
      const to = a.from === p.key && a.to !== null ? title.get(a.to) : undefined;
      if (to !== undefined && !links.includes(to)) links.push(to);
    }
    return { kind: p.kind, title: p.title, links };
  });
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
