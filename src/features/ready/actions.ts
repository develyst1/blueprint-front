"use server";

// Screen ④'s server actions (SPEC-C-002 § ReadyActions). The page gets them bound to its project
// (`askAction.bind(null, projectId)` in ReadyScreen). Each ends with refresh(), so the page re-reads the API; none
// returns data to render — only whether it worked and, if not, the SPEC's code. Never throws to the page.
// Calls go through the core's typed client (`gen:api`, TASK-B-011).
import { refresh } from "next/cache";
import { api } from "@/core/api/client";
import type { ActionResult } from "./contract";
import { actionCode as codeOf, call, type ApiQuiz, type CallResult } from "./load";

function done(r: CallResult<unknown>): ActionResult {
  refresh();
  return r.ok ? { ok: true } : { ok: false, code: codeOf(r) };
}

/** The latest quiz's id, or the failure that stops the action (no quiz → blocked). */
async function latestId(projectId: string): Promise<{ ok: true; id: string } | { ok: false; result: ActionResult }> {
  const q = await call<ApiQuiz>(api.GET("/v1/projects/{projectId}/quizzes/latest", { params: { path: { projectId } } }));
  if (q.ok) return { ok: true, id: q.data.id };
  return { ok: false, result: q.status === 404 ? { ok: false, code: "blocked" } : { ok: false, code: codeOf(q) } };
}

/** A new quiz — it becomes the latest (POST …/quizzes). */
export async function startQuizAction(projectId: string): Promise<ActionResult> {
  return done(await call(api.POST("/v1/projects/{projectId}/quizzes", { params: { path: { projectId } } })));
}

/** One question to the latest quiz. A bot that could not answer is still a 200 (`failed` item). */
export async function askAction(projectId: string, question: string): Promise<ActionResult> {
  const text = question.trim();
  if (!text) return { ok: false, code: "invalid" };
  const latest = await latestId(projectId);
  if (!latest.ok) return latest.result;
  return done(await call(api.POST("/v1/projects/{projectId}/quizzes/{quizId}/questions", {
    params: { path: { projectId, quizId: latest.id } },
    body: { question: text },
  })));
}

/** ถูก / ผิด (final). A wrong mark may carry the user's note; the back end turns it into an open question. */
export async function markAction(projectId: string, itemId: string, mark: "right" | "wrong", note?: string): Promise<ActionResult> {
  const latest = await latestId(projectId);
  if (!latest.ok) return latest.result;
  const n = mark === "wrong" ? note?.trim() : undefined;
  return done(await call(api.POST("/v1/projects/{projectId}/quizzes/{quizId}/items/{itemId}/mark", {
    params: { path: { projectId, quizId: latest.id, itemId } },
    body: n ? { mark, note: n } : { mark },
  })));
}

/** Who confirms a version (TASK-C-011 Q2, SA-C 2026-10-09: "operator" — accepted, `Interpreted`, reversible). No login in
 *  v1, one user; the same value the back end's own SIT test sends (blueprint-back test/sit/rules.sit.test.ts:93). Never
 *  shown as a word. */
const CONFIRMED_BY = "operator";

/** ยืนยัน 100% — POST …/versions. A 409 comes back as `blocked`, or `already_confirmed` for an unchanged confirmed spec
 *  (TASK-A-050) — the refreshed page then shows the `confirmed` state (D-030). */
export async function confirmAction(projectId: string): Promise<ActionResult> {
  return done(await call(api.POST("/v1/projects/{projectId}/versions", {
    params: { path: { projectId } },
    body: { confirmedBy: CONFIRMED_BY },
  })));
}
