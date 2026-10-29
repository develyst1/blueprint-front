"use server";

// Screen ④'s server actions (SPEC-C-002 § ReadyActions). The page gets them bound to its project
// (`askAction.bind(null, projectId)` in ReadyScreen). Each ends with refresh(), so the page re-reads the API; none
// returns data to render — only whether it worked and, if not, the SPEC's code. Never throws to the page.
// Calls go through the core's typed client (`gen:api`, TASK-B-011); the label route is new (REQ-103) and goes through
// `raw()` until `gen:api` has seen the new back end.
// Every write carries the typed name (REQ-103, SPEC-104 D4): with none, nothing is sent and the answer is the back end's own
// `name_required` — the refresh then draws the page with the name field open (AC-6).
import { refresh } from "next/cache";
import { api } from "@/core/api/client";
import { byHeader, readBy } from "@/core/api/by";
import { raw } from "@/features/chat/load";
import type { ActionResult } from "./contract";
import { actionCode as codeOf, call, type ApiQuiz, type CallResult } from "./load";

function done(r: CallResult<unknown>): ActionResult {
  refresh();
  return r.ok ? { ok: true } : { ok: false, code: codeOf(r) };
}

/** The quiz actions' common start: the typed name, or the refusal that sends nothing. */
async function who(): Promise<{ ok: true; headers: Record<string, string> } | { ok: false; result: ActionResult }> {
  const by = await readBy();
  if (!by) { refresh(); return { ok: false, result: { ok: false, code: "name_required" } }; }
  return { ok: true, headers: byHeader(by) };
}

/** The latest quiz's id, or the failure that stops the action (no quiz → blocked). */
async function latestId(projectId: string): Promise<{ ok: true; id: string } | { ok: false; result: ActionResult }> {
  const q = await call<ApiQuiz>(api.GET("/v1/projects/{projectId}/quizzes/latest", { params: { path: { projectId } } }));
  if (q.ok) return { ok: true, id: q.data.id };
  return { ok: false, result: q.status === 404 ? { ok: false, code: "blocked" } : { ok: false, code: codeOf(q) } };
}

/** A new quiz — it becomes the latest (POST …/quizzes). */
export async function startQuizAction(projectId: string): Promise<ActionResult> {
  const w = await who();
  if (!w.ok) return w.result;
  return done(await call(api.POST("/v1/projects/{projectId}/quizzes", { params: { path: { projectId } }, headers: w.headers })));
}

/** One question to the latest quiz. A bot that could not answer is still a 200 (`failed` item). */
export async function askAction(projectId: string, question: string): Promise<ActionResult> {
  const text = question.trim();
  if (!text) return { ok: false, code: "invalid" };
  const w = await who();
  if (!w.ok) return w.result;
  const latest = await latestId(projectId);
  if (!latest.ok) return latest.result;
  return done(await call(api.POST("/v1/projects/{projectId}/quizzes/{quizId}/questions", {
    params: { path: { projectId, quizId: latest.id } },
    body: { question: text },
    headers: w.headers,
  })));
}

/** ถูก / ผิด (final). A wrong mark may carry the user's note; the back end turns it into an open question. */
export async function markAction(projectId: string, itemId: string, mark: "right" | "wrong", note?: string): Promise<ActionResult> {
  const w = await who();
  if (!w.ok) return w.result;
  const latest = await latestId(projectId);
  if (!latest.ok) return latest.result;
  const n = mark === "wrong" ? note?.trim() : undefined;
  return done(await call(api.POST("/v1/projects/{projectId}/quizzes/{quizId}/items/{itemId}/mark", {
    params: { path: { projectId, quizId: latest.id, itemId } },
    body: n ? { mark, note: n } : { mark },
    headers: w.headers,
  })));
}

/** ใส่ป้าย version — POST …/versions { label } (REQ-103). Never blocked by the spec's state; an empty text is refused here
 *  without a call (the page shows `emptyLabel` before it gets here). The name travels in `X-Blueprint-By`, not the body. */
export async function labelAction(projectId: string, text: string): Promise<ActionResult> {
  const label = text.trim();
  if (!label) return { ok: false, code: "invalid" };
  const by = await readBy();
  if (!by) { refresh(); return { ok: false, code: "name_required" }; }
  const r = await raw(`/v1/projects/${encodeURIComponent(projectId)}/versions`, {
    method: "POST", headers: { "content-type": "application/json", ...byHeader(by) }, body: JSON.stringify({ label }),
  });
  return done(r.ok ? { ok: true, status: r.status, data: r.data } : { ok: false, status: r.status, body: r.body });
}
