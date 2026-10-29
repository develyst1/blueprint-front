// Pieces every page builder shares: hrefs, the frame, steps, works, stuck items. Pure — no fetch, no clock.
import type {
  BackCountsVM, BriefRoleVM, DecisionVM, FrameVM, NavItemVM, PageId, ProjectHeadVM, ReadinessVM, RoomId, RoomVM, StepVM, StuckItemVM,
  WorkVM,
} from "@/core/theme/contract";
import { formatThaiDate } from "@/core/format/date";
import { contradiction, emptyProject, pageLabel, readinessClean, readinessClear, readinessStuck, roomLabel, stuck as stuckWords } from "@/core/words";
import type { ApiLink, ApiStuckItem, ProjectData } from "./types";

export const PAGES: PageId[] = ["overview", "workOrder", "flowchart", "sequence", "screens", "api", "web", "stuck", "history"];
/** REQ-103: a page with its own URL that the PDF does not print (its editor is not part of the spec sheet). */
export const ROUTED_PAGES: PageId[] = [...PAGES, "requirements"];
/** REQ-017 (SPEC-C-006 § 3, D-107): the two rooms and their pages in sub-nav order — the one place. A room lands on its first
 *  page. The chat is not a room (a header button); a route outside every room (the chat) counts as `front`. */
export const ROOMS: { id: RoomId; pages: NavItemVM["page"][] }[] = [
  { id: "front", pages: ["overview", "flowchart", "stuck", "requirements", "ready"] },
  { id: "back", pages: ["workOrder", "sequence", "screens", "api", "web", "history"] },
];
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
 *  seal never claims พร้อมสร้าง. `latestVersion` (REQ-017): the newest confirmed version's number, for the brief. */
export type ProjectWithSeal = ProjectData & { confirmed?: boolean; latestVersion?: number | null };

/** REQ-017: the two rooms (they replace the 11-page strip, R-3). The current room holds `current`; a route in no room
 *  (the chat) keeps `front`. Samples use it too. */
export function rooms(projectId: string, current: NavItemVM["page"]): RoomVM[] {
  const entry = (p: NavItemVM["page"]): NavItemVM => ({
    page: p, label: pageLabel[p], href: p === "ready" ? readyHref(projectId) : href(projectId, p as PageId), current: p === current,
  });
  const home = ROOMS.find((r) => r.pages.includes(current))?.id ?? "front";
  return ROOMS.map((r) => {
    const pages = r.pages.map(entry);
    return { id: r.id, label: roomLabel[r.id], href: pages[0]!.href, current: r.id === home, pages };
  });
}

/** `current` = the room page to mark: the page itself, or "chat" / "ready" on those routes (their loaders pass it). */
export function frame(data: ProjectWithSeal, page: PageId, current: NavItemVM["page"] = page): FrameVM {
  return {
    project: projectHead(data),
    readiness: readiness(data.stuck.length, isEmpty(data), data.confirmed === true),
    page,
    homeHref: HOME_HREF, // the project list — a theme never builds a URL (v1.12, AC-22)
    rooms: rooms(data.project.id, current),
    chatHref: chatHref(data.project.id),
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
    if (item.kind === "contradiction") return (item.between ?? []).find((k) => part.has(k)) ?? item.key; // the first side that is a part
    return item.key; // flow_break (a step) · unconfirmed_guess (a part) · screen_without_api · unlinked_part · a kind added later
  };
  // A contradiction is worded by its two sides' titles; a side that is not a part reads as the item's own title (never a
  // raw key, F-042); fewer than two sides cannot be worded as two → the note itself (v1.13).
  const contradictionWords = (item: ApiStuckItem): string | undefined => {
    const [a, b] = item.between ?? [];
    return a !== undefined && b !== undefined ? contradiction(part.get(a)?.title ?? item.title, part.get(b)?.title ?? item.title) : undefined;
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
    const known = item.kind === "flow_break" ? (item.reason ? stuckWords[item.reason] : undefined)
      : item.kind === "contradiction" ? contradictionWords(item)
      : (stuckWords as Record<string, string>)[item.kind];
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

// ---------- the brief (REQ-017, SPEC-C-006 § 3) ----------
const text = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v.trim() : null);

/** Each work with what we understood it is for (`work.body.goal`, written by the spec agent — null in an older spec). */
export function briefWorks(data: ProjectData): (WorkVM & { goal: string | null })[] {
  const goals = new Map(data.parts.filter((p) => p.kind === "work").map((p) => [p.key, text(p.body.goal)]));
  return works(data).map((w) => ({ ...w, goal: goals.get(w.key) ?? null }));
}

/** Who is involved: every role part, with its duty in this work (`role.body.duty`; null → the theme shows the title alone). */
export function briefRoles(data: ProjectData): BriefRoleVM[] {
  return data.parts.filter((p) => p.kind === "role").map((p) => ({ key: p.key, title: p.title, duty: text(p.body.duty) }));
}

/** The back room's counts for the brief's side rail. */
export function backCounts(data: ProjectData): BackCountsVM {
  const n = (kind: string) => data.parts.filter((p) => p.kind === kind).length;
  return { screens: n("screen"), apis: n("api"), systems: n("system"), data: n("data"), interactions: n("interaction") };
}
