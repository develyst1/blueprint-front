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
import type { ChatChangeVM, ChatContradictionVM, ChatMessageVM, ChatModelVM, ChatQuestionVM, ChatSourceVM, ChatVM } from "./contract";
import { acceptPack, botFailed, cawAsks, contradiction, fieldDropped, modelTimeout, refusedItem, refusedMore, refusedReason, rejectReason, roundRejected, savedHeader, tierLabel, urlKept } from "./words";

// ---------- API shapes not in the generated schema yet (blueprint-back src/http/routes/*.ts, read 2026-10-09) ----------
export type ApiMessage = {
  id: string; role: "user" | "bot" | "caw"; content: string; model: string; creativity: number;
  roundStatus: string | null; changeSetId: string | null; createdAt: string;
  /** REQ-110 (TASK-109): why a bot row failed or was rejected; null on every other row (and on rows from before it) */
  roundReason?: string | null; roundNote?: string | null;
  /** REQ-110 round 2 (TASK-123): every item the round refused, or null (and on rows from before it) */
  roundRefused?: ApiRefused[] | null;
  /** REQ-110 round 2 (TASK-123): how many of the model's proposed items were applied — the "n" of "saved n, not saved m" */
  roundSaved?: number | null;
  /** REQ-110 round 3 (TASK-126): what the server repaired or left out of an item before saving it — only `field_dropped` is shown */
  roundAdjusted?: ApiAdjusted[] | null;
};
/** One element of `roundAdjusted` (SPEC-105 E8/E9): `what` is `ref_renamed` · `body_defaulted` · `wrapped_in_list` · `op_renamed` · `field_dropped` · `url_kept`, or the
 *  trailing `{ item: "more", count }`. `roundRaw` (the unreadable reply, for the team) is never read by the page at all. */
export type ApiAdjusted = {
  item: string; what?: string; field?: string | null; title?: string | null; key?: string | null; ref?: string | null;
  from?: unknown; to?: unknown; count?: number;
};
/** One element of `roundRefused` (SPEC-105 E6); the last may be `{ item: "more", count }` past 50. Server-built text plus the model's own title. */
export type ApiRefused = {
  item: string; op?: string | null; kind?: string | null; ref?: string | null; key?: string | null; title?: string | null;
  reason?: string | null; detail?: string | null; count?: number;
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

/** The REQ-110 sentence for a rejected round: `roundReason` (+ `roundNote` for an unknown kind) → the PM's words. A reason
 *  this build has no word for, or an unknown kind with no name, has no sentence (null) — the row stays as it was before. */
export function rejectedText(reason: string | null | undefined, note: string | null | undefined): string | null {
  if (reason === "unknown_kind") return note ? roundRejected(rejectReason.unknown_kind(note)) : null;
  if (reason === "needs_user_words" || reason === "invalid_change" || reason === "protocol") return roundRejected(rejectReason[reason]);
  return null;
}

/** The refused items as page lines: "{name} — {reason}" (the title, else the key, the ref or the item path), then "and n more".
 *  The model's own text is not among them (SPEC-105 E5c). A reason this build has no word for leaves the name alone. */
export function refusedLines(list: ApiRefused[]): string[] {
  const lines: string[] = [];
  for (const r of list) {
    if (r.item === "more") { if (r.count) lines.push(refusedMore(r.count)); continue; }
    const name = r.title || r.key || r.ref || r.item;
    const why = r.reason === "unknown_kind" ? (r.kind ? refusedReason.unknown_kind(r.kind) : null)
      : r.reason === "needs_user_words" || r.reason === "invalid_change" || r.reason === "depends_on_refused" ? refusedReason[r.reason] : null;
    lines.push(why ? refusedItem(name, why) : name);
  }
  return lines;
}
/** How many items were refused (the "more" element counts for its `count`). */
export const refusedCount = (list: ApiRefused[]): number => list.reduce((n, r) => n + (r.item === "more" ? r.count ?? 0 : 1), 0);

/** One line per `field_dropped` adjustment (REQ-110 round 3, Q5): the item's name (title → key → ref → item path, as the refused list does)
 *  and the field that was left out. One line per `url_kept` (REQ-114 round 2, TASK-137): the address (`title`) and the key Blueprint stored it
 *  under (key → ref). Every other `what` is invisible to the user; an entry with nothing to name has nothing to say. */
export function adjustedLines(list: ApiAdjusted[]): string[] {
  const lines: string[] = [];
  for (const a of list) {
    if (a.what === "field_dropped" && a.field) lines.push(fieldDropped(a.title || a.key || a.ref || a.item, a.field));
    else if (a.what === "url_kept" && a.title && (a.key || a.ref)) lines.push(urlKept(a.title, (a.key || a.ref)!));
  }
  return lines;
}

/** What a row says on the page, with the round-3 lines under it. */
function textOf(m: ApiMessage, next: ApiMessage | undefined): string {
  const base = baseTextOf(m, next);
  const extra = m.role === "bot" && Array.isArray(m.roundAdjusted) ? adjustedLines(m.roundAdjusted) : [];
  return extra.length ? [base, ...extra].filter((l) => l !== "").join("\n") : base;
}

/** The row's own words. Rows with no content of their own: a turn that only accepted a pack (the user pressed
 *  ตามนั้น), a bot that could not answer, and (REQ-110) a round whose changes were rejected or a model that timed out —
 *  each gets its words. A park-only turn and any other empty row are left out. */
function baseTextOf(m: ApiMessage, next: ApiMessage | undefined): string {
  if (m.role === "caw") return cawAsks(m.content);
  // a round that refused anything (REQ-110 round 2): the model's own text is not shown — it may call a refused item saved
  const refused = m.role === "bot" && Array.isArray(m.roundRefused) && m.roundRefused.length > 0 ? m.roundRefused : null;
  if (refused) {
    const lines = refusedLines(refused);
    // nothing saved → the accepted sentence first; something saved → "saved n, not saved m" with n = `roundSaved` (null → the list alone, no guess)
    const head = m.roundStatus === "changes_rejected" ? rejectedText(m.roundReason, m.roundNote)
      : m.roundStatus === "applied" && typeof m.roundSaved === "number" ? savedHeader(m.roundSaved, refusedCount(refused)) : null;
    return [head, ...lines].filter((l): l is string => !!l).join("\n");
  }
  // a rejected round: the stored words, never the bot row's own content (it must not read as if something was saved)
  if (m.role === "bot" && m.roundStatus === "changes_rejected") { const t = rejectedText(m.roundReason, m.roundNote); if (t) return t; }
  if (m.content.trim()) return m.content;
  if (m.role === "user") return parkOnlyBot(next) ? "" : acceptPack;
  if (m.roundStatus === "bot_could_not_answer") return m.roundReason === "timeout" ? modelTimeout : botFailed.message;
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
    changeSetId: m.changeSetId, // set by the back end on bot rows only (a round's set); null elsewhere
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

/** The stuck contradictions in the chat's words: `สองส่วนนี้ขัดกัน: {ส่วนแรก} กับ {ส่วนที่สอง}` from the two parts' titles;
 *  a side that is not a part reads as the item's own title and fewer than two sides is the item's title (the note) —
 *  the core's rule (`core/model/build/common.ts`, SPEC-B-001 v1.13), never a raw key (TASK-A-060 F2). Order = the API's. */
export function toContradictions(data: ProjectData): ChatContradictionVM[] {
  const title = new Map(data.parts.map((p) => [p.key, p.title]));
  return data.stuck.filter((s) => s.kind === "contradiction").map((s) => {
    const [a, b] = s.between ?? [];
    return { key: s.key, text: a !== undefined && b !== undefined ? contradiction(title.get(a) ?? s.title, title.get(b) ?? s.title) : s.title };
  });
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
 *  The three tiers are worded (`tierLabel`, D-035); a `provider/model` id keeps the gateway's own name (a product name,
 *  no word is written for it). The current model stays in the list. */
export function toModel(current: string, m: ApiModels | null): ChatModelVM | null {
  if (!m) return null;
  const tierWord = (t: string) => (Object.hasOwn(tierLabel, t) ? tierLabel[t as keyof typeof tierLabel] : t);
  const options = [
    ...m.tiers.map((t) => ({ value: `tier:${t}`, label: tierWord(t) })),
    ...Object.entries(m.models).flatMap(([provider, names]) => names.map((n) => ({ value: `${provider}/${n}`, label: `${provider}/${n}` }))),
  ];
  if (!options.some((o) => o.value === current)) options.unshift({ value: current, label: current.startsWith("tier:") ? tierWord(current.slice(5)) : current });
  return { current, options };
}

export function buildChatVM(input: {
  data: ProjectData; messages: ApiMessage[]; focus: string | null; change: ChatChangeVM | null;
  sources: ApiSource[]; models: ApiModels | null;
}): ChatVM {
  const { data } = input;
  const newestBot = [...input.messages].reverse().find((m) => m.role === "bot");
  const failed = newestBot?.roundStatus === "bot_could_not_answer";
  return {
    frame: chatFrame(data),
    // The failed alert already says "บอทตอบไม่ได้ตอนนี้": the newest failed bot row is not shown a second time (older ones stay) —
    // except a timeout (REQ-110): its row carries the timeout sentence the alert does not, so it stays; the alert's retry and
    // change-model controls are the ones the sentence points at.
    messages: toMessages(input.messages).filter((m) => !(failed && newestBot!.roundReason !== "timeout" && m.id === newestBot!.id)),
    pack: toPack(data, input.focus),
    contradictions: toContradictions(data),
    focus: input.focus,
    lastChange: input.change,
    sources: toSources(input.sources),
    model: toModel(data.project.model, input.models),
    creativity: data.project.creativity,
    failed,
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
