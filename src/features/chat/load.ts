// The chat page's loader (SPEC-A-006, TASK-A-031): the API → ChatVM. Server-side only — it uses the core's API
// client. The mapping is pure (`buildChatVM`, tested with fixture responses); the fetching is below it.
//
// The rounds / messages / models / change-set-read paths are not in the generated schema yet (`gen:api` is SA-B's,
// SPEC-A-006 ask 5), so those few calls go through `raw()` on the same base URL, with the response types written here
// from blueprint-back's route definitions. Once the schema has them, they move to `api` and these types go.
import { api, apiBaseUrl } from "@/core/api/client";
import { apiLoad } from "@/core/api/load";
import { formatThaiDate } from "@/core/format/date";
import { frame as buildFrame, href } from "@/core/model/build/common";
import type { ProjectData } from "@/core/model/build/types";
import { loadProjectData } from "@/core/model/load";
import type { FrameVM, RequiredItem } from "@/core/theme/contract";
import { requiredId } from "@/core/theme/required";
import type { ChatChangeVM, ChatMessageVM, ChatModelVM, ChatQuestionVM, ChatSourceVM, ChatVM } from "./contract";
import { acceptPack, botFailed, cawAsks } from "./words";

// ---------- API shapes not in the generated schema yet (blueprint-back src/http/routes/*.ts, read 2026-10-09) ----------
export type ApiMessage = {
  id: string; role: "user" | "bot" | "caw"; content: string; model: string; creativity: number;
  roundStatus: string | null; changeSetId: string | null; createdAt: string;
};
export type ApiModels = { models: Record<string, string[]>; tiers: string[] };
/** TASK-A-030's route (SPEC-A-006 § C1). */
export type ApiChangeSet = {
  id: string; at: string; cause: { kind: string; ref: string | null };
  counts: { added: number; updated: number; removed: number }; entities: string[]; undoable: boolean;
};
type ApiSource = { id: string; name: string; status: string; reason?: string; note?: string };

export const MESSAGES = 50;
export const PACK = 5;

export type RawResult<T> = { ok: true; status: number; data: T } | { ok: false; status: number; body: unknown };

/** One call to blueprint-back for a path the generated client does not know yet. Never throws. */
export async function raw<T>(path: string, init?: RequestInit): Promise<RawResult<T>> {
  try {
    const res = await fetch(`${apiBaseUrl}${path}`, { cache: "no-store", ...init });
    const text = await res.text();
    let body: unknown = null;
    try { body = text ? JSON.parse(text) : null; } catch { body = text; }
    return res.ok ? { ok: true, status: res.status, data: body as T } : { ok: false, status: res.status, body };
  } catch {
    return { ok: false, status: 0, body: null }; // network: the API is not there
  }
}

// ---------- pure mapping ----------
const keyOrder = (a: string, b: string) => a.localeCompare(b, "en", { numeric: true });

/** The core's frame with the chat's own nav entry (แชต) current (TASK-A-039, SA-B Q2). */
export function chatFrame(data: ProjectData): FrameVM {
  return buildFrame(data, "overview", "chat");
}

/** What the chat page must show: each pack question's text (moved here from ChatScreen, TASK-A-039 / SA-B Q4). */
export function chatRequired(vm: ChatVM): RequiredItem[] {
  return vm.pack.map((q) => ({ id: requiredId.part(q.key), text: q.text }));
}

/** A park-only round (TASK-A-033) writes an empty user row and an empty `applied` bot row: nothing to word. */
const parkOnlyBot = (m: ApiMessage | undefined) => !!m && m.role === "bot" && !m.content.trim() && m.roundStatus === "applied";

/** What a row says on the page. Two rows have no content of their own: a turn that only accepted a pack (the user
 *  pressed ตามนั้น) and a bot that could not answer — each gets its REQ-004 words. A park-only turn and any other
 *  empty row are left out. */
function textOf(m: ApiMessage, next: ApiMessage | undefined): string {
  if (m.role === "caw") return cawAsks(m.content);
  if (m.content.trim()) return m.content;
  if (m.role === "user") return parkOnlyBot(next) ? "" : acceptPack;
  if (m.roundStatus === "bot_could_not_answer") return botFailed.message;
  return "";
}

export function toMessages(rows: ApiMessage[]): ChatMessageVM[] {
  const shown = rows.slice(-MESSAGES);
  return shown.map((m, i) => ({ m, text: textOf(m, shown[i + 1]) })).filter(({ text }) => text !== "").map(({ m, text }) => ({
    id: m.id,
    role: m.role,
    text,
    at: m.createdAt,
    atLabel: formatThaiDate(m.createdAt),
    roundStatus: m.roundStatus,
  }));
}

/** A proposed answer worth showing, or null (missing or blank). */
const proposedOf = (body: Record<string, unknown>): string | null =>
  typeof body.proposedAnswer === "string" && body.proposedAnswer.trim() !== "" ? body.proposedAnswer : null;

/** Every open question — with or without a proposed answer (REQ-003 Addendum A) — oldest first (key order: a part
 *  carries no time), at most PACK. A `focus` question outside the first PACK takes the last place, so ?q= always
 *  opens on it. */
export function toPack(data: ProjectData, focus: string | null): ChatQuestionVM[] {
  const title = new Map(data.parts.map((p) => [p.key, p.title]));
  const open = data.parts
    .filter((p) => p.kind === "question" && p.body.status === "open")
    .sort((a, b) => keyOrder(a.key, b.key));
  let picked = open.slice(0, PACK);
  const f = focus ? open.find((p) => p.key === focus) : undefined;
  if (f && !picked.includes(f)) picked = [...picked.slice(0, PACK - 1), f].sort((a, b) => keyOrder(a.key, b.key));
  return picked.map((p) => ({
    key: p.key,
    text: String(p.body.text ?? p.title),
    proposedAnswer: proposedOf(p.body),
    suggested: proposedOf(p.body) !== null && p.body.proposedAnswerStamp === "team-proposed",
    cases: Array.isArray(p.body.cases) ? p.body.cases.map(String) : [],
    about: data.links.filter((l) => l.kind === "about" && l.fromKey === p.key).map((l) => ({ key: l.toKey, title: title.get(l.toKey) ?? l.toKey })),
  }));
}

/** The newest change set a chat message caused: the newest bot row that names one. */
export function lastChangeSetId(rows: ApiMessage[]): string | null {
  for (let i = rows.length - 1; i >= 0; i--) if (rows[i]!.role === "bot" && rows[i]!.changeSetId) return rows[i]!.changeSetId;
  return null;
}

export function toChange(cs: ApiChangeSet): ChatChangeVM {
  return { changeSetId: cs.id, added: cs.counts.added, updated: cs.counts.updated, removed: cs.counts.removed, undoable: cs.undoable };
}

export function toSources(rows: ApiSource[]): ChatSourceVM[] {
  return rows
    .filter((s): s is ApiSource & { status: "read" | "failed" } => s.status === "read" || s.status === "failed")
    .map((s) => ({ id: s.id, name: s.name, state: s.status, reason: s.reason ?? null, note: s.note ?? null }));
}

/** The gateway's list as choices: the three tiers first, then every "<provider>/<model>" (the PATCH's two forms).
 *  Labels are the gateway's own names — no word is written for them. The current model stays in the list. */
export function toModel(current: string, m: ApiModels | null): ChatModelVM | null {
  if (!m) return null;
  const options = [
    ...m.tiers.map((t) => ({ value: `tier:${t}`, label: t })),
    ...Object.entries(m.models).flatMap(([provider, names]) => names.map((n) => ({ value: `${provider}/${n}`, label: `${provider}/${n}` }))),
  ];
  if (!options.some((o) => o.value === current)) options.unshift({ value: current, label: current.startsWith("tier:") ? current.slice(5) : current });
  return { current, options };
}

export function buildChatVM(input: {
  data: ProjectData; messages: ApiMessage[]; focus: string | null; change: ChatChangeVM | null;
  sources: ApiSource[]; models: ApiModels | null;
}): ChatVM {
  const { data } = input;
  const newestBot = [...input.messages].reverse().find((m) => m.role === "bot");
  return {
    frame: chatFrame(data),
    messages: toMessages(input.messages),
    pack: toPack(data, input.focus),
    focus: input.focus,
    lastChange: input.change,
    sources: toSources(input.sources),
    model: toModel(data.project.model, input.models),
    creativity: data.project.creativity,
    failed: newestBot?.roundStatus === "bot_could_not_answer",
    specHref: href(data.project.id, "overview"),
  };
}

// ---------- fetching ----------
export type ChatLoaded = { ok: true; vm: ChatVM } | { ok: false; state: "unreachable" | "notFound" };

/** The change card: TASK-A-030's route is the only source of its counts and of undoable. A failing read → no card
 *  (never a partial count). */
export async function lastChange(projectId: string, rows: ApiMessage[]): Promise<ChatChangeVM | null> {
  const id = lastChangeSetId(rows);
  if (!id) return null;
  const cs = await raw<ApiChangeSet>(`/v1/projects/${projectId}/change-sets/${encodeURIComponent(id)}`);
  return cs.ok ? toChange(cs.data) : null;
}

export async function loadChat(projectId: string, focus: string | null): Promise<ChatLoaded> {
  const res = await loadProjectData(projectId);
  if (!res.ok) return res;
  const data = res.data;
  const [msgs, srcs, models] = await Promise.all([
    raw<ApiMessage[]>(`/v1/projects/${projectId}/messages?limit=${MESSAGES}`),
    apiLoad(api.GET("/v1/projects/{projectId}/sources", { params: { path: { projectId } } })),
    raw<ApiModels>("/v1/models"),
  ]);
  if (!msgs.ok) return { ok: false, state: msgs.status === 404 ? "notFound" : "unreachable" };
  if (!srcs.ok) return srcs;
  const change = await lastChange(projectId, msgs.data);
  return {
    ok: true,
    vm: buildChatVM({ data, messages: msgs.data, focus, change, sources: srcs.data as ApiSource[], models: models.ok ? models.data : null }),
  };
}
