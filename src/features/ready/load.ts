// Screen ④'s loader (SPEC-C-002, TASK-C-011): the API → ReadyVM. Server-side only. The mapping is pure
// (`buildReadyVM`, tested with fixture responses); the fetching is at the bottom.
//
// The project and its stuck list come through the core (`loadProjectData`); the latest quiz and the versions through
// the core's typed client (`gen:api`, TASK-B-011 — the quiz paths and `GET …/versions` are in schema.d.ts now).
import { api } from "@/core/api/client";
import type { components } from "@/core/api/schema";
import { formatThaiDate } from "@/core/format/date";
import { frame, href, webHref, works } from "@/core/model/build/common";
import type { ProjectData } from "@/core/model/build/types";
import { loadProjectData } from "@/core/model/load";
import type { FrameVM, RequiredItem } from "@/core/theme/contract";
import type { GateCode, ReadyQuizVM, ReadyVM } from "./contract";
import { readyRequiredId } from "./required";
import { build, buildNotReady, reasons, score, scoreEarly } from "./words";

// ---------- the API's shapes, from the generated schema ----------
export type ApiQuizItem = components["schemas"]["QuizItem"];
export type ApiQuiz = components["schemas"]["Quiz"];
export type ApiVersions = components["schemas"]["VersionFeed"];

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

/** Why Confirm is off, in SPEC-C-002's order. It mirrors the server gate (SPEC-A-004 rule 8); confirm() stays the
 *  authority. */
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

export function buildReadyVM(input: { data: ProjectData; quiz: ApiQuiz | null; versions: ApiVersions["versions"]; changedSinceLatest?: boolean }): ReadyVM {
  const { data } = input;
  const id = data.project.id;
  const count = (kind: string) => data.parts.filter((p) => p.kind === kind).length;
  const stuckHref = href(id, "stuck");
  const quiz = toQuiz(data, input.quiz);
  const gate = gateReasons(data.stuck.length, quiz, stuckHref);
  const last = input.versions.at(-1);
  return {
    frame: readyFrame(data),
    steps: works(data)[0]?.steps ?? [],
    counts: { screens: count("screen"), apis: count("api"), people: count("role") },
    stuck: { count: data.stuck.length, href: stuckHref },
    quiz,
    gate: { ok: gate.length === 0, reasons: gate },
    // changedSince: Team A's `changedSinceLatest` (SPEC-C-002 Q2 → TASK-A-032). Until the back end sends it, it is
    // absent → false, and the line "spec เปลี่ยนหลังเวอร์ชัน {N}" stays hidden.
    version: last ? { n: last.version, dateLabel: formatThaiDate(last.confirmedAt), changedSince: input.changedSinceLatest === true } : null,
    build: { enabled: false, label: build, reason: buildNotReady },
  };
}

/** The ids live in the pure ./required (TASK-C-014); re-exported here because DefaultReady still imports them from load. */
export { readyRequiredId };

/** What the page must show: each gate reason's text and the score line (readiness is the shell's). */
export function readyRequired(vm: ReadyVM): RequiredItem[] {
  const items: RequiredItem[] = vm.gate.reasons.map((r) => ({ id: readyRequiredId.reason(r.code), text: r.text }));
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
  const [quiz, versions] = await Promise.all([
    call<ApiQuiz>(api.GET("/v1/projects/{projectId}/quizzes/latest", path)),
    call<ApiVersions>(api.GET("/v1/projects/{projectId}/versions", path)),
  ]);
  // 404 on the latest quiz = no quiz yet (the project exists — loadProjectData said so)
  if (!quiz.ok && quiz.status !== 404) return { ok: false, state: "unreachable" };
  if (!versions.ok) return { ok: false, state: versions.status === 404 ? "notFound" : "unreachable" };
  return {
    ok: true,
    vm: buildReadyVM({
      data: res.data,
      quiz: quiz.ok ? quiz.data : null,
      versions: versions.data.versions,
      changedSinceLatest: versions.data.changedSinceLatest,
    }),
  };
}
