// One builder per page: the API's JSON in, the contract's view model out. Pure — no fetch, no clock; positions come
// from the Layouts passed in (TASK-B-006 swaps the sample ones for real ones without touching this file).
import type {
  ApiVM, ApisVM, FlowchartVM, HistoryEntryVM, HistoryVM, OverviewVM, PageId, ParticipantVM, PartDetailVM, PartKind,
  ProjectCardVM, ScreenVM, ScreensVM, SequenceVM, StuckVM, WebVM, WorkOrderVM,
} from "@/core/theme/contract";
import { formatThaiDate } from "@/core/format/date";
import { historyCause, historyWhat, linkKind, stamp } from "@/core/words";
import {
  decisions, frame, href, index, isEmpty, pickWork, readiness, stuckItems, stuckTargets, stuckWordings, webHref, workLinks, works,
} from "./common";
import type {
  ApiFlowchart, ApiHistoryEntry, ApiProject, ApiSequence, ApiSwimlane, Built, Layouts, ProjectData,
} from "./types";

const empty = (page: PageId) => ({ ok: false as const, state: { kind: "empty" as const, page } });
const asParticipant = (p: { key: string; kind: string; title: string }): ParticipantVM =>
  ({ key: p.key, kind: p.kind as ParticipantVM["kind"], title: p.title });

// ---------- ภาพรวม ----------
export function buildOverview(data: ProjectData): Built<OverviewVM> {
  if (isEmpty(data)) return empty("overview");
  return { ok: true, vm: { frame: frame(data, "overview"), works: works(data), decisions: decisions(data) } };
}

// ---------- ลำดับงาน (swimlane) ----------
export function buildWorkOrder(data: ProjectData, swim: ApiSwimlane, layouts: Layouts, workKey?: string): Built<WorkOrderVM> {
  const work = pickWork(data, workKey);
  if (isEmpty(data) || !work) return empty("workOrder");
  const { part, out } = index(data);
  const end = (interaction: string, side: "from" | "to") => out(interaction, side)[0]?.toKey ?? null;
  const stepByKey = new Map(work.steps.map((s) => [s.key, s]));
  return {
    ok: true,
    vm: {
      frame: frame(data, "workOrder"),
      works: workLinks(data, "workOrder"),
      work,
      layout: {
        lanes: layouts.swimLanes(swim.lanes.map(asParticipant)),
        rows: swim.rows.filter((r) => stepByKey.has(r.step.key)).map((r) => ({
          step: stepByKey.get(r.step.key)!,
          lanes: r.lanes,
          handoffs: out(r.step.key, "has_interaction").map((l, i) => {
            const int = part.get(l.toKey);
            return { key: l.toKey, order: i + 1, from: end(l.toKey, "from"), to: end(l.toKey, "to"), text: String(int?.body.text ?? int?.title ?? "") };
          }),
        })),
      },
    },
  };
}

// ---------- ผังการทำงาน ----------
export function buildFlowchart(data: ProjectData, flow: ApiFlowchart, layouts: Layouts, workKey?: string): Built<FlowchartVM> {
  const work = pickWork(data, workKey);
  if (isEmpty(data) || !work) return empty("flowchart");
  return {
    ok: true,
    vm: {
      frame: frame(data, "flowchart"),
      works: workLinks(data, "flowchart"),
      work,
      layouts: { LR: layouts.flow(flow, "LR"), TB: layouts.flow(flow, "TB") },
    },
  };
}

// ---------- ลำดับการโต้ตอบ ----------
/** The steps the page offers are the steps of the work that holds `stepKey` (else the first work). */
export function buildSequence(data: ProjectData, seq: ApiSequence, layouts: Layouts, stepKey?: string): Built<SequenceVM> {
  const all = works(data);
  const work = all.find((w) => w.steps.some((s) => s.key === stepKey)) ?? all[0];
  const step = work?.steps.find((s) => s.key === stepKey) ?? work?.steps[0];
  if (isEmpty(data) || !work || !step) return empty("sequence");
  return {
    ok: true,
    vm: { frame: frame(data, "sequence"), steps: work.steps, step, layout: layouts.sequence(seq.participants.map(asParticipant), seq.messages) },
  };
}

/** The step a sequence page shows when none is asked for — the loader needs it before it can fetch the diagram. */
export function defaultStepKey(data: ProjectData, stepKey?: string): string | undefined {
  const all = works(data);
  if (stepKey && all.some((w) => w.steps.some((s) => s.key === stepKey))) return stepKey;
  return all[0]?.steps[0]?.key;
}

// ---------- หน้าจอ ----------
type Obj = Record<string, unknown>;
const list = (v: unknown): Obj[] => (Array.isArray(v) ? v.filter((x): x is Obj => !!x && typeof x === "object") : []);
const str = (v: unknown): string | null => (typeof v === "string" ? v : null);

export function buildScreens(data: ProjectData): Built<ScreensVM> {
  if (isEmpty(data)) return empty("screens");
  const { part, out } = index(data);
  const stuck = stuckTargets(data);
  const wordings = stuckWordings(data);
  const screens = data.parts.filter((p) => p.kind === "screen").map((s): ScreenVM => ({
    key: s.key,
    title: s.title,
    stuck: stuck.has(s.key),
    stuckWordings: wordings.get(s.key) ?? [],
    fields: list(s.body.fields).map((f) => ({ name: String(f.name), label: str(f.label), type: str(f.type) })),
    actions: list(s.body.actions).map((a) => ({ name: String(a.name), label: str(a.label) })),
    states: list(s.body.states).map((st) => ({ name: String(st.name), note: str(st.note) })),
    shows: out(s.key, "shows").map((l) => ({ key: l.toKey, title: part.get(l.toKey)?.title ?? l.toKey, href: webHref(data.project.id, l.toKey) })),
  }));
  return { ok: true, vm: { frame: frame(data, "screens"), screens } };
}

// ---------- API ----------
export function buildApis(data: ProjectData): Built<ApisVM> {
  if (isEmpty(data)) return empty("api");
  const { part, out } = index(data);
  const stuck = stuckTargets(data);
  const wordings = stuckWordings(data);
  const named = (kind: string, key: string) =>
    out(key, kind).map((l) => ({ key: l.toKey, title: part.get(l.toKey)?.title ?? l.toKey, href: webHref(data.project.id, l.toKey) }));
  const apis = data.parts.filter((p) => p.kind === "api").map((a): ApiVM => ({
    key: a.key,
    title: a.title,
    stuck: stuck.has(a.key),
    stuckWordings: wordings.get(a.key) ?? [],
    method: String(a.body.method ?? ""),
    path: String(a.body.path ?? ""),
    request: a.body.request ?? null,
    responses: list(a.body.responses).map((r) => ({ status: Number(r.status), body: r.body ?? null, note: str(r.note) })),
    reads: named("reads", a.key),
    writes: named("writes", a.key),
  }));
  return { ok: true, vm: { frame: frame(data, "api"), apis } };
}

// ---------- ใยโหนด ----------
/** `selectedHistory` = GET …/parts/{key}/history for the selected part (its first entry says where it came from). */
export function buildWeb(data: ProjectData, layouts: Layouts, selectedKey?: string, selectedHistory?: ApiHistoryEntry[]): Built<WebVM> {
  if (isEmpty(data)) return empty("web");
  const { part } = index(data);
  const stuckKeys = new Set(stuckItems(data).flatMap((i) => [i.key, i.target.key]));
  const nodes = data.parts.map((p) => ({ key: p.key, kind: p.kind, title: p.title, stuck: stuckKeys.has(p.key) }));
  const sel = selectedKey ? part.get(selectedKey) : undefined;
  let selected: PartDetailVM | null = null;
  if (sel) {
    const first = [...(selectedHistory ?? [])].sort((a, b) => a.at.localeCompare(b.at))[0];
    selected = {
      key: sel.key,
      kind: sel.kind as PartKind,
      title: sel.title,
      stamp: sel.origin.stamp,
      stampLabel: stamp[sel.origin.stamp] ?? "",
      date: sel.origin.date,
      dateLabel: formatThaiDate(sel.origin.date),
      cameFrom: historyCause[first?.cause.kind ?? "operator"],
      links: data.links
        .filter((l) => l.fromKey === sel.key || l.toKey === sel.key)
        .map((l) => {
          const outgoing = l.fromKey === sel.key;
          const other = outgoing ? l.toKey : l.fromKey;
          const direction = outgoing ? ("out" as const) : ("in" as const);
          return {
            kind: l.kind, direction, label: linkKind[l.kind]?.[direction] ?? "", key: other,
            title: part.get(other)?.title ?? other, href: href(data.project.id, "web", { part: other }),
          };
        }),
    };
  }
  const layout = layouts.web(nodes, data.links);
  const withHref = { ...layout, nodes: layout.nodes.map((n) => ({ ...n, href: href(data.project.id, "web", { part: n.key }) })) };
  return { ok: true, vm: { frame: frame(data, "web"), layout: withHref, selected } };
}

// ---------- ติดอยู่ตรงไหน ----------
export function buildStuck(data: ProjectData): Built<StuckVM> {
  if (isEmpty(data)) return empty("stuck");
  return { ok: true, vm: { frame: frame(data, "stuck"), items: stuckItems(data) } };
}

// ---------- ประวัติ ----------
const field = (v: unknown, k: string): string | null => (v && typeof v === "object" ? str((v as Obj)[k]) : null);

// v1.8: a summary never carries an id. A part entry = its title; a link entry = "<from title> <linkKind.out> <to title>"
// from the link in `after` (or `before` once removed); anything the core cannot word → "".
function summaryOf(e: ApiHistoryEntry, titleOf: (key: string) => string | undefined): string {
  if (!e.op.startsWith("link_")) return field(e.after, "title") ?? field(e.before, "title") ?? "";
  const l = e.after ?? e.before;
  const out = linkKind[field(l, "kind") ?? ""]?.out;
  const from = titleOf(field(l, "fromKey") ?? "");
  const to = titleOf(field(l, "toKey") ?? "");
  return out && from && to ? `${from} ${out} ${to}` : "";
}

export function buildHistory(data: ProjectData, partKey?: string, entries: ApiHistoryEntry[] = []): Built<HistoryVM> {
  if (isEmpty(data)) return empty("history");
  const { part } = index(data);
  const sel = partKey ? part.get(partKey) : undefined;
  const titleOf = (key: string) => part.get(key)?.title;
  const rows: HistoryEntryVM[] = sel
    ? [...entries]
        .sort((a, b) => a.at.localeCompare(b.at)) // oldest first (R6)
        .map((e) => ({ at: e.at, atLabel: formatThaiDate(e.at), cause: historyCause[e.cause.kind], what: e.op, whatLabel: historyWhat[e.op] ?? "", summary: summaryOf(e, titleOf) }))
    : [];
  return {
    ok: true,
    vm: {
      frame: frame(data, "history"),
      parts: data.parts.map((p) => ({ key: p.key, kind: p.kind as PartKind, title: p.title, href: href(data.project.id, "history", { part: p.key }) })),
      part: sel ? { key: sel.key, title: sel.title } : null,
      entries: rows,
    },
  };
}

// ---------- home ----------
/** A `GET /v1/projects` item — `partCount` 0 = an empty project, never ready (D-015, D-025): no second read needed. */
export function buildCard(project: ApiProject & { stuckCount: number; partCount: number }): ProjectCardVM {
  return {
    project: { id: project.id, name: project.name, createdAt: project.createdAt, createdLabel: formatThaiDate(project.createdAt), theme: project.theme },
    readiness: readiness(project.stuckCount, project.partCount === 0),
    href: href(project.id, "overview"),
  };
}
