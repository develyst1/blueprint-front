"use server";

// Server actions of the core (TASK-B-007). Themes never call the API; these are handed to them as props.
import { refresh } from "next/cache";
import { api } from "@/core/api/client";
import { byHeader, readBy } from "@/core/api/by";
import { apiLoad } from "@/core/api/load";
import { requirementChange } from "@/core/requirements/change";
import { raw, type RawResult } from "@/features/chat/load";

/** "ลองใหม่": re-renders the current route on the server, so its loaders ask the API again (AC-14). */
export async function retryAction(): Promise<void> {
  refresh();
}

export type CreateResult = { ok: true; id: string } | { ok: false; state: "invalid" | "unreachable" | "notFound" | "name_required" };

/** The new-project dialog: POST /v1/projects { name, theme }, then the home re-renders with the new card (AC-5).
 *  Every write needs the typed name first (REQ-103 AC-6): with none, nothing is sent and the page re-renders asking for it. */
export async function createProjectAction(name: string, theme: string): Promise<CreateResult> {
  const trimmed = name.trim();
  if (!trimmed) return { ok: false, state: "invalid" };
  const by = await readBy();
  if (!by) { refresh(); return { ok: false, state: "name_required" }; }
  const res = await apiLoad(api.POST("/v1/projects", { body: { name: trimmed, theme }, headers: byHeader(by) }));
  if (!res.ok) return res;
  refresh();
  return { ok: true, id: res.data.id };
}

// ---------- requirements (REQ-103) ----------
export type RequirementResult = { ok: true } | { ok: false; code: "invalid" | "unreachable" | "name_required" };

function requirementCode(r: Extract<RawResult<unknown>, { ok: false }>): "invalid" | "unreachable" | "name_required" {
  const code = (r.body as { error?: { code?: string } } | null)?.error?.code;
  if (r.status === 0 || r.status >= 500) return "unreachable";
  if (r.status === 400 && code === "name_required") return "name_required";
  return "invalid";
}

async function writeRequirement(projectId: string, body: unknown): Promise<RequirementResult> {
  const by = await readBy();
  if (!by) { refresh(); return { ok: false, code: "name_required" }; }
  const r = await raw(`/v1/projects/${encodeURIComponent(projectId)}/change-sets`, {
    method: "POST", headers: { "content-type": "application/json", ...byHeader(by) }, body: JSON.stringify(body),
  });
  refresh();
  return r.ok ? { ok: true } : { ok: false, code: requirementCode(r) };
}

export async function addRequirementAction(projectId: string, title: string, text: string): Promise<RequirementResult> {
  const t = title.trim(); const x = text.trim();
  if (!t || !x) return { ok: false, code: "invalid" };
  return writeRequirement(projectId, requirementChange({ op: "add", title: t, text: x }));
}

export async function updateRequirementAction(projectId: string, key: string, title: string, text: string): Promise<RequirementResult> {
  const t = title.trim(); const x = text.trim();
  if (!t || !x) return { ok: false, code: "invalid" };
  return writeRequirement(projectId, requirementChange({ op: "update", key, title: t, text: x }));
}

export async function removeRequirementAction(projectId: string, key: string): Promise<RequirementResult> {
  return writeRequirement(projectId, requirementChange({ op: "remove", key }));
}
