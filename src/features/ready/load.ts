// Screen ④'s loader (SPEC-C-002, TASK-C-011): the API → ReadyVM. Server-side only. The mapping is pure
// (`buildReadyVM`, tested with fixture responses); the fetching is at the bottom.
//
// The project and its stuck list come through the core (`loadProjectData`); the latest quiz and the versions through
// the core's typed client (`gen:api`, TASK-B-011 — the quiz paths and `GET …/versions` are in schema.d.ts now).
import { api } from "@/core/api/client";
import type { components } from "@/core/api/schema";
import { formatThaiDate } from "@/core/format/date";
import { chatHref, frame, href, webHref, works } from "@/core/model/build/common";
import type { ProjectData } from "@/core/model/build/types";
import { loadProjectData } from "@/core/model/load";
import type { FrameVM, RequiredItem } from "@/core/theme/contract";
import { raw } from "@/features/chat/load";
import type { ActionCode, GateCode, ReadyLabelVM, ReadyQuizVM, ReadyVM } from "./contract";
import { readyRequiredId } from "./required";
import { build, reasons, score, scoreEarly, versionTag, warningBoth, warningQuiz, warningStuck } from "./words";

// ---------- the API's shapes, from the generated schema ----------
export type ApiQuizItem = components["schemas"]["QuizItem"];
export type ApiQuiz = components["schemas"]["Quiz"];
/** One entry of `GET …/labels` (REQ-103, SPEC-104): newest first. `label` is null on an old confirmed version. Written here
 *  until `gen:api` has seen the new back end (then the generated type can replace it). */
export type ApiLabel = { version: number; label: string | null; labelledAt: string; by: string };

/** At most 10 answered items per quiz (SPEC-A-004 rule 3). */
export const MAX_ANSWERED = 10;
/** A score needs at least 5 marks (SPEC-A-004 rule 7); below it the API's score is null. */
export const MIN_MARKED = 5;
export const QUIZ_ANCHOR = "#quiz";

export type CallResult<T> = { ok: true; status: number; data: T } | { ok: false; status: number; body: unknown };

/** One typed-client call (`api.GET` / `api.POST`) → data or the status + error body. Never throws: a network failure
 *  is status 0 (the API is not there). */
export async function call<T>(p: Promise<{ data?: T; error?: unknown; response: Response }>): Promise<CallResult<T>> {
  try {
    const { data, error, response } = await p;
    return response.ok ? { ok: true, status: response.status, data: data as T } : { ok: false, status: response.status, body: error ?? null };
  } catch {
    return { ok: false, status: 0, body: null };
  }
}

/** blueprint-back's 409 codes (SPEC-A-004 § API) → the page's codes; the network → unreachable. Here, not in actions.ts:
 *  a "use server" file may export only async functions, and this mapping is tested. */
export function actionCode(r: Extract<CallResult<unknown>, { ok: false }>): ActionCode {
  const code = (r.body as { error?: { code?: string } } | null)?.error?.code;
  if (r.status === 0 || r.status >= 500) return "unreachable";
  if (r.status === 409) {
    if (code === "quiz_stale") return "stale";
    if (code === "quiz_full") return "full";
    if (code === "quiz_closed") return "closed";
    if (code === "already_marked") return "already_marked";
    if (code === "quiz_missing") return "blocked";
  }
  if (r.status === 400 && code === "name_required") return "name_required";
  return "invalid";
}

// ---------- pure mapping ----------
/** The core's frame with this page's own nav entry current (SPEC-B-001 v1.10; SA-B's ask, TASK-B-011 Q2). */
export function readyFrame(data: ProjectData): FrameVM {
  return frame(data, "overview", "ready");
}

export function toQuiz(data: ProjectData, q: ApiQuiz | null): ReadyQuizVM | null {
  if (!q) return null;
  const title = new Map(data.parts.map((p) => [p.key, p.title]));
  const id = data.project.id;
  return {
    id: q.id,
    stale: q.stale,
    full: q.items.filter((i) => i.status === "answered").length >= MAX_ANSWERED,
    items: [...q.items].sort((a, b) => a.position - b.position).map((i) => ({
      id: i.id,
      position: i.position,
      question: i.question,
      status: i.status,
      answer: i.answer,
      notInSpec: i.notInSpec,
      parts: i.parts.map((key) => ({ key, title: title.get(key) ?? key, href: webHref(id, key) })),
      mark: i.mark,
      note: i.note,
    })),
    right: q.right,
    marked: q.marked,
    score: q.score,
  };
}

/** What is still open, in SPEC-C-002's order — notes now, not a gate (REQ-103: a label is never blocked). */
export function gateReasons(stuckCount: number, quiz: ReadyQuizVM | null, stuckHref: string): ReadyVM["gate"]["reasons"] {
  const out: { code: GateCode; text: string; href: string }[] = [];
  if (stuckCount > 0) out.push({ code: "stuck", text: reasons.stuck(stuckCount), href: stuckHref });
  if (!quiz) out.push({ code: "no_quiz", text: reasons.noQuiz, href: QUIZ_ANCHOR });
  else {
    if (quiz.marked < MIN_MARKED) out.push({ code: "too_few", text: reasons.tooFew, href: QUIZ_ANCHOR });
    else if (quiz.right < quiz.marked) out.push({ code: "not_100", text: reasons.notFull, href: QUIZ_ANCHOR });
    if (quiz.stale) out.push({ code: "stale", text: reasons.stale, href: QUIZ_ANCHOR });
  }
  return out;
}

/** The notes (TASK-C-016): a project with no parts has one, `empty`, which leads to the chat (D-032); otherwise the
 *  reasons above. */
export function gate(data: ProjectData, quiz: ReadyQuizVM | null): ReadyVM["gate"] {
  const id = data.project.id;
  if (data.parts.length === 0) return { reasons: [{ code: "empty", text: reasons.empty, href: chatHref(id) }] };
  return { reasons: gateReasons(data.stuck.length, quiz, href(id, "stuck")) };
}

/** The warning before a label (REQ-103 § Wording): stuck items and/or an incomplete quiz — "complete" is what the old gate
 *  asked: at least 5 marks, all right, not stale. Never blocks; null = nothing to warn about. */
export function labelWarning(stuckCount: number, quiz: ReadyQuizVM | null): string | null {
  const quizOpen = !quiz || quiz.marked < MIN_MARKED || quiz.right < quiz.marked || quiz.stale;
  if (stuckCount > 0 && quizOpen) return warningBoth(stuckCount);
  if (stuckCount > 0) return warningStuck(stuckCount);
  return quizOpen ? warningQuiz : null;
}

export function toLabels(labels: ApiLabel[]): ReadyLabelVM[] {
  return labels.map((l) => ({ version: l.version, text: l.label ?? versionTag(l.version), dateLabel: formatThaiDate(l.labelledAt), by: l.by }));
}

export function buildReadyVM(input: { data: ProjectData; quiz: ApiQuiz | null; labels: ApiLabel[] }): ReadyVM {
  const { data } = input;
  const id = data.project.id;
  const count = (kind: string) => data.parts.filter((p) => p.kind === kind).length;
  const stuckHref = href(id, "stuck");
  const quiz = toQuiz(data, input.quiz);
  return {
    frame: readyFrame(data),
    steps: works(data)[0]?.steps ?? [],
    counts: { screens: count("screen"), apis: count("api"), people: count("role") },
    stuck: { count: data.stuck.length, href: stuckHref },
    quiz,
    gate: gate(data, quiz),
    labels: toLabels(input.labels),
    warning: labelWarning(data.stuck.length, quiz),
    build: buildLink(id, input.labels[0]?.version ?? null),
  };
}

/** CAW's base (D-050). Bun loads `.env`, where an unset value arrives as "", so `||`, never `??` (SYSTEM-FACTS). Read when
 *  the page is built, not when the module loads, so a test can set it. */
const cawUrl = () => process.env.CAW_URL || "http://127.0.0.1:3500";

/** Build (REQ-103 AC-3, SPEC-104 Q2 — the PM's default): always on. With a label, CAW's start page for this project and the
 *  newest label's version, as before; with none, `/start?project=<id>` with no version. */
function buildLink(id: string, version: number | null): ReadyVM["build"] {
  const project = `project=${encodeURIComponent(id)}`;
  return { enabled: true, label: build, reason: "", href: `${cawUrl()}/start?${project}${version === null ? "" : `&version=${version}`}` };
}

/** The ids live in the pure ./required (TASK-C-014); re-exported here because DefaultReady still imports them from load. */
export { readyRequiredId };

/** What the page must show: each gate reason's text and the score line (readiness is the shell's). */
export function readyRequired(vm: ReadyVM): RequiredItem[] {
  const items: RequiredItem[] = vm.gate.reasons.map((r) => ({ id: readyRequiredId.reason(r.code), text: r.text }));
  if (vm.warning) items.push({ id: readyRequiredId.warning, text: vm.warning });
  if (vm.quiz) {
    const line = vm.quiz.score !== null ? score(vm.quiz.score, vm.quiz.marked) : scoreEarly(vm.quiz.marked);
    items.push({ id: readyRequiredId.score, text: line });
  }
  return items;
}

// ---------- fetching ----------
export type ReadyLoaded = { ok: true; vm: ReadyVM } | { ok: false; state: "unreachable" | "notFound" };

export async function loadReady(projectId: string): Promise<ReadyLoaded> {
  const res = await loadProjectData(projectId);
  if (!res.ok) return res;
  const path = { params: { path: { projectId } } };
  const [quiz, labels] = await Promise.all([
    call<ApiQuiz>(api.GET("/v1/projects/{projectId}/quizzes/latest", path)),
    raw<{ labels: ApiLabel[] }>(`/v1/projects/${encodeURIComponent(projectId)}/labels`), // not in the generated client until gen:api
  ]);
  // 404 on the latest quiz = no quiz yet (the project exists — loadProjectData said so)
  if (!quiz.ok && quiz.status !== 404) return { ok: false, state: "unreachable" };
  // the project exists, so a failing labels read is the back end being unreachable or out of step — never "not found"
  if (!labels.ok || !Array.isArray(labels.data?.labels)) return { ok: false, state: "unreachable" };
  return { ok: true, vm: buildReadyVM({ data: res.data, quiz: quiz.ok ? quiz.data : null, labels: labels.data.labels }) };
}
