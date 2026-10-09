"use server";

// Server actions of the core (TASK-B-007). Themes never call the API; these are handed to them as props.
import { refresh } from "next/cache";
import { api } from "@/core/api/client";
import { apiLoad } from "@/core/api/load";

/** "ลองใหม่": re-renders the current route on the server, so its loaders ask the API again (AC-14). */
export async function retryAction(): Promise<void> {
  refresh();
}

export type CreateResult = { ok: true; id: string } | { ok: false; state: "invalid" | "unreachable" | "notFound" };

/** The new-project dialog: POST /v1/projects { name, theme }, then the home re-renders with the new card (AC-5). */
export async function createProjectAction(name: string, theme: string): Promise<CreateResult> {
  const trimmed = name.trim();
  if (!trimmed) return { ok: false, state: "invalid" };
  const res = await apiLoad(api.POST("/v1/projects", { body: { name: trimmed, theme } }));
  if (!res.ok) return res;
  refresh();
  return { ok: true, id: res.data.id };
}
