// Pieces every page builder shares: hrefs, the frame, steps, works, stuck items. Pure — no fetch, no clock.
import type {
  DecisionVM, FrameVM, NavItemVM, PageId, ProjectHeadVM, ReadinessVM, StepVM, StuckItemVM, WorkVM,
} from "@/core/theme/contract";
import { formatThaiDate } from "@/core/format/date";
import { emptyProject, pageLabel, readinessClean, readinessClear, readinessStuck, stuck as stuckWords } from "@/core/words";
import type { ApiLink, ApiStuckItem, ProjectData } from "./types";

export const PAGES: PageId[] = ["overview", "workOrder", "flowchart", "sequence", "screens", "api", "web", "stuck", "history"];
export const HOME_HREF = "/";

// ---------- hrefs: the only place a URL is built ----------
/** A page's URL segment — kebab-case (TASK-B-007 § 1); the route maps it back. One place, so they cannot drift. */
export function pageSlug(page: PageId): string {
  return page === "workOrder" ? "work-order" : page;
}

type Query = { work?: string; step?: string; part?: string };
export function href(projectId: string, page: PageId, query: Query = {}): string {
  const q = new URLSearchParams(Object.entries(query).filter(([, v]) => v) as [string, string][]).toString();
  return `/p/${projectId}/${pageSlug(page)}${q ? `?${q}` : ""}`;
}

/** The chat (Team A, REQ-004) — opened at one question with `?q=` (R7). */
export function chatHref(projectId: string, question?: string): string {
  return `/p/${projectId}/chat${question ? `?${new URLSearchParams({ q: question })}` : ""}`;
}

/** Screen ④ พร้อมสร้างหรือยัง (Team C, REQ-007). */
export const readyHref = (projectId: string) => `/p/${projectId}/ready`;

/** The project's PDF (REQ-008) — Team A's export route; the core hands it to their ExportButton (v1.11). */
export const exportHref = (projectId: string) => `/p/${projectId}/export/pdf`;

/** Where a part is shown best: a step → its sequence, a screen → หน้าจอ, an API → API, anything else → ใยโหนด. */
export function partHref(projectId: string, part: { key: string; kind: string }): string {
  if (part.kind === "step") return href(projectId, "sequence", { step: part.key });
  if (part.kind === "screen") return href(projectId, "screens", { part: part.key });
  if (part.kind === "api") return href(projectId, "api", { part: part.key });
  return href(projectId, "web", { part: part.key });
}

// ---------- lookups ----------
export const byPosition = (a: ApiLink, b: ApiLink) => (a.position ?? Infinity) - (b.position ?? Infinity);
export function index(data: ProjectData) {
  const part = new Map(data.parts.map((p) => [p.key, p]));
  const out = (key: string, kind: string) => data.links.filter((l) => l.fromKey === key && l.kind === kind).sort(byPosition);
  const into = (key: string, kind: string) => data.links.filter((l) => l.toKey === key && l.kind === kind);
  return { part, out, into };
}

/** A project with no live part has nothing to draw (AC-15). */
export const isEmpty = (data: ProjectData) => data.parts.length === 0;

// ---------- frame ----------
export function projectHead(data: ProjectData): ProjectHeadVM {
  const p = data.project;
  return { id: p.id, name: p.name, createdAt: p.createdAt, createdLabel: formatThaiDate(p.createdAt), theme: p.theme };
}

/** The seal, one place (D-031 · REQ-007 "Frame readiness seal"): empty (D-015) → stuck → พร้อมสร้าง only when the latest
 *  version is confirmed and unchanged → otherwise ไม่มีเรื่องติด. Not known to be confirmed counts as not confirmed. */
export function readiness(stuckCount: number, empty = false, confirmed = false): ReadinessVM {
  if (empty) return { stuckCount: 0, label: emptyProject, ready: false };
  if (stuckCount > 0) return { stuckCount, label: readinessStuck(stuckCount), ready: false };
  return confirmed ? { stuckCount: 0, label: readinessClean, ready: true } : { stuckCount: 0, label: readinessClear, ready: false };
}

/** From `GET …/versions`: a confirmed version exists and nothing changed since it. */
export const confirmedOf = (feed: { latest: unknown; changedSinceLatest: boolean }) => feed.latest != null && feed.changedSinceLatest === false;

/** A project as the core's loader returns it: the spec, its stuck list and whether its latest version is confirmed and
 *  unchanged (TASK-B-017). Optional, so data built elsewhere (fixtures, other teams' tests) still fits — and then the
 *  seal never claims พร้อมสร้าง. */
export type ProjectWithSeal = ProjectData & { confirmed?: boolean };

/** A project's page strip: chat first, the 9 spec pages, screen ④ last (SPEC-B-001 v1.9 / v1.10). Samples use it too. */
export function nav(projectId: string, current: NavItemVM["page"]): NavItemVM[] {
  const entry = (p: NavItemVM["page"], to: string): NavItemVM => ({ page: p, label: pageLabel[p], href: to, current: p === current });
  return [entry("chat", chatHref(projectId)), ...PAGES.map((p) => entry(p, href(projectId, p))), entry("ready", readyHref(projectId))];
}

/** `current` = the nav entry to mark: the page itself, or "chat" / "ready" on those routes (their loaders pass it). */
export function frame(data: ProjectWithSeal, page: PageId, current: NavItemVM["page"] = page): FrameVM {
  return {
    project: projectHead(data),
    readiness: readiness(data.stuck.length, isEmpty(data), data.confirmed === true),
    nav: nav(data.project.id, current),
    page,
  };
}

// ---------- stuck items (REVIEW-C-001 S4: a target per kind) ----------
export function stuckItems(data: ProjectData): StuckItemVM[] {
  const { part, out } = index(data);
  const id = data.project.id;
  const linkById = new Map(data.links.map((l) => [l.id, l]));
  const targetKey = (item: ApiStuckItem): string => {
    if (item.kind === "open_question") return out(item.key, "about")[0]?.toKey ?? item.key;
    if (item.kind === "unconfirmed_guess" && item.linkId) return linkById.get(item.linkId)?.fromKey ?? item.key;
    return item.key; // flow_break (a step) · unconfirmed_guess (a part) · screen_without_api · unlinked_part · a kind added later
  };
  const targetHref = (item: ApiStuckItem, key: string): string => {
    const p = part.get(key);
    if (item.kind === "open_question") return chatHref(id, item.key); // answered in the chat (REQ-004 R7, v1.9)
    if (item.kind === "screen_without_api") return href(id, "screens", { part: key });
    if (item.kind === "unlinked_part") return href(id, "web", { part: key });
    return p ? partHref(id, p) : href(id, "web", { part: key });
  };
  return data.stuck.map((item) => {
    const key = targetKey(item);
    const known = item.kind === "flow_break" ? (item.reason ? stuckWords[item.reason] : undefined) : (stuckWords as Record<string, string>)[item.kind];
    const question = item.kind === "open_question" ? part.get(item.key) : undefined;
    const proposed = question?.body.proposedAnswer;
    return {
      kind: item.kind as StuckItemVM["kind"], // a kind the contract does not name yet stays in the list (SPEC-B-001)
      reason: item.reason ?? null,
      key: item.key,
      title: item.title,
      wording: known ?? item.title, // unknown kind: worded by the part's title
      proposedAnswer: typeof proposed === "string" && proposed.trim() ? proposed : null,
      target: { key, title: part.get(key)?.title ?? key, href: targetHref(item, key) },
    };
  });
}

/** Keys of parts that some stuck item points at — a step card shows "stuck" when its key is here. */
export function stuckTargets(data: ProjectData): Set<string> {
  return new Set(stuckItems(data).map((i) => i.target.key));
}

/** The words of every stuck item, by the part it points at (v1.3 steps, v1.7 screens and APIs: a screen reader says why). */
export function stuckWordings(data: ProjectData): Map<string, string[]> {
  const wordings = new Map<string, string[]>();
  for (const i of stuckItems(data)) (wordings.get(i.target.key) ?? wordings.set(i.target.key, []).get(i.target.key)!).push(i.wording);
  return wordings;
}

/** A part on the web page — every cross-reference to another part links there (v1.4, v1.7). */
export const webHref = (projectId: string, key: string) => href(projectId, "web", { part: key });

// ---------- works and steps ----------
export function works(data: ProjectData): WorkVM[] {
  const { part, out } = index(data);
  const wordings = stuckWordings(data);
  const id = data.project.id;
  return data.parts
    .filter((p) => p.kind === "work")
    .map((w) => ({
      key: w.key,
      title: w.title,
      steps: out(w.key, "has_step").map((l, i): StepVM => {
        const s = part.get(l.toKey)!;
        return {
          key: s.key,
          number: String(i + 1).padStart(2, "0"),
          title: s.title,
          ends: s.body.ends === true,
          stuck: wordings.has(s.key),
          stuckWordings: wordings.get(s.key) ?? [],
          href: href(id, "sequence", { step: s.key }),
        };
      }),
    }));
}

export function workLinks(data: ProjectData, page: PageId) {
  return works(data).map((w) => ({ key: w.key, title: w.title, href: href(data.project.id, page, { work: w.key }) }));
}

/** The work a page shows: the one asked for, else the first. */
export function pickWork(data: ProjectData, workKey?: string): WorkVM | undefined {
  const all = works(data);
  return all.find((w) => w.key === workKey) ?? all[0];
}

export function decisions(data: ProjectData): DecisionVM[] {
  const { part, out } = index(data);
  const strings = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);
  return data.parts
    .filter((p) => p.kind === "decision")
    .map((d) => ({
      key: d.key,
      title: d.title,
      rule: typeof d.body.rule === "string" ? d.body.rule : d.title,
      cases: strings(d.body.cases),
      open: typeof d.body.open === "string" && d.body.open.trim() ? d.body.open : null,
      covers: out(d.key, "covers").map((l) => ({ key: l.toKey, title: part.get(l.toKey)?.title ?? l.toKey, href: webHref(data.project.id, l.toKey) })),
    }));
}

