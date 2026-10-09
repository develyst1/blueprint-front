"use server";

// The chat page's server actions (SPEC-A-006 § ChatActions). The page gets them bound to its project
// (`sendAction.bind(null, projectId)` in ChatScreen). Each ends with refresh(), so the page re-reads the API; none
// returns data to render — only whether it worked and, if not, the SPEC's code.
import { refresh } from "next/cache";
import type { ActionCode, ActionResult } from "./contract";
import type { ProjectData } from "@/core/model/build/types";
import { raw, type RawResult } from "./load";

const json = (body: unknown): RequestInit => ({ method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

function codeOf(r: Extract<RawResult<unknown>, { ok: false }>): ActionCode {
  const code = (r.body as { error?: { code?: string } } | null)?.error?.code;
  if (r.status === 0 || r.status >= 500) return "unreachable";
  if (r.status === 413) return "too_large";
  if (r.status === 415) return "unsupported_file";
  if (r.status === 409 && code === "already_added") return "already_added";
  return "invalid";
}

function done(r: RawResult<unknown>): ActionResult {
  refresh();
  return r.ok ? { ok: true } : { ok: false, code: codeOf(r) };
}

/** One chat turn with the user's words (POST …/rounds { message }). A bot that could not answer is still a 200 —
 *  the page reads it from the newest bot row (`failed`). */
export async function sendAction(projectId: string, text: string): Promise<ActionResult> {
  const message = text.trim();
  if (!message) return { ok: false, code: "invalid" };
  return done(await raw(`/v1/projects/${projectId}/rounds`, json({ message })));
}

/** "ตามนั้น": every key in one round (POST …/rounds { accept }) → one change set (AC-2). Only questions that have a
 *  proposed answer can be accepted (TASK-A-034): the keys are checked against the project first, and a key without
 *  one → `invalid` with no round sent. */
export async function acceptAction(projectId: string, keys: string[]): Promise<ActionResult> {
  if (keys.length === 0) return { ok: false, code: "invalid" };
  const project = await raw<{ parts: ProjectData["parts"] }>(`/v1/projects/${projectId}`);
  if (!project.ok) return { ok: false, code: codeOf(project) };
  const acceptable = new Set(project.data.parts
    .filter((p) => p.kind === "question" && p.body.status === "open" && typeof p.body.proposedAnswer === "string" && p.body.proposedAnswer.trim())
    .map((p) => p.key));
  if (!keys.every((k) => acceptable.has(k))) return { ok: false, code: "invalid" };
  return done(await raw(`/v1/projects/${projectId}/rounds`, json({ accept: keys })));
}

/** ตอบเอง…: one open question answered in the user's own words (POST …/rounds { answers }) — REQ-003 Addendum A. */
export async function answerAction(projectId: string, key: string, text: string): Promise<ActionResult> {
  const answer = text.trim();
  if (!answer) return { ok: false, code: "invalid" };
  return done(await raw(`/v1/projects/${projectId}/rounds`, json({ answers: [{ key, text: answer }] })));
}

/** ไม่ต้องใช้ข้อนี้: park one open question, with the reason if one was given (POST …/rounds { park }). The back end
 *  makes no model call for it. */
export async function parkAction(projectId: string, key: string, reason?: string): Promise<ActionResult> {
  const why = reason?.trim();
  return done(await raw(`/v1/projects/${projectId}/rounds`, json({ park: [{ key, ...(why ? { reason: why } : {}) }] })));
}

/** "ย้อนกลับ". 409 undo_conflict → the titles of the parts changed since (AC-4). */
export async function undoAction(projectId: string, changeSetId: string): Promise<ActionResult> {
  const r = await raw(`/v1/projects/${projectId}/change-sets/${encodeURIComponent(changeSetId)}/undo`, { method: "POST" });
  refresh();
  if (r.ok) return { ok: true };
  const err = (r.body as { error?: { code?: string; details?: { parts?: { key: string; title: string }[] } } } | null)?.error;
  if (r.status === 409 && err?.code === "undo_conflict") return { ok: false, code: "undo_refused", parts: (err.details?.parts ?? []).map((p) => p.title) };
  return { ok: false, code: codeOf(r) };
}

/** A file + who it came from (`origin`: one of the two stamps the page offers), as blueprint-back's multipart body. */
export async function uploadAction(projectId: string, form: FormData): Promise<ActionResult> {
  const file = form.get("file");
  const stamp = String(form.get("origin") ?? "");
  if (!(file instanceof File) || !["operator", "customer-asked"].includes(stamp)) return { ok: false, code: "invalid" };
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(new Date());
  const body = new FormData();
  body.set("file", file, file.name);
  body.set("origin", JSON.stringify({ stamp, date: today }));
  return done(await raw(`/v1/projects/${projectId}/sources`, { method: "POST", body }));
}

export async function setModelAction(projectId: string, model: string): Promise<ActionResult> {
  return done(await raw(`/v1/projects/${projectId}`, { ...json({ model }), method: "PATCH" }));
}

export async function setCreativityAction(projectId: string, value: number): Promise<ActionResult> {
  if (!Number.isFinite(value) || value < 0 || value > 2) return { ok: false, code: "invalid" };
  return done(await raw(`/v1/projects/${projectId}`, { ...json({ creativity: value }), method: "PATCH" }));
}

/** "ลองใหม่": ask the bot again for the turn it could not answer (POST …/rounds { retry: true }, D-023). The user's
 *  decisions in that turn were already kept; no new message is sent. 409 nothing_to_retry → `invalid`. */
export async function retryAction(projectId: string): Promise<ActionResult> {
  return done(await raw(`/v1/projects/${projectId}/rounds`, json({ retry: true })));
}
