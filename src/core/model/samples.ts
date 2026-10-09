// Typed samples of every view model — the worked example "จองห้องประชุม", values copied from the API snapshot in
// mockups/data.js (captured 2026-10-09 from an in-memory blueprint-back). Themes render these until the loaders
// (TASK-B-005) exist. Nothing here fetches; nothing here is imported from mockups/.
import type {
  ApiVM, ApisVM, DecisionVM, FlowchartVM, FrameVM, HistoryVM, OverviewVM, PageId, ParticipantVM,
  PartDetailVM, PartKind, PreviewVM, ProjectCardVM, ProjectHeadVM, ReadinessVM, RequiredItem, ScreenVM,
  ScreensVM, SeqLayout, SequenceVM, StepVM, StuckVM, SwimLayout, WebLayout, WebVM, WorkOrderVM, WorkVM,
} from "@/core/theme/contract";
import { formatThaiDate } from "@/core/format/date";
import { nav, pageSlug } from "@/core/model/build/common";
import { requiredId } from "@/core/theme/required";
import { realLayouts } from "@/core/layout";
import type { ApiFlowchart, ApiLink, ApiPart } from "@/core/model/build/types";
import { historyCause, historyWhat, linkKind, readinessStuck, stamp, stuck as stuckWords } from "@/core/words";

// ---------- the worked example, as the API returned it ----------
const PROJECT_ID = "d01a63a7-c48d-4eea-9a85-4fca1b8501e3";

const CREATED_AT = "2026-10-08T17:42:17.814Z";
const project: ProjectHeadVM = {
  id: PROJECT_ID,
  name: "จองห้องประชุม",
  createdAt: CREATED_AT,
  createdLabel: formatThaiDate(CREATED_AT), // "9 ต.ค. 2569"
  theme: "default", // the snapshot predates Project.theme (TASK-A-010); an unknown or missing id falls back to the default theme
};

const ORIGIN = { stamp: "operator", date: "2026-10-08" } as const;
const WORK = { key: "WRK-001", title: "จองห้องประชุม" };

// [key, title, ends] in has_step order
const STEPS: [string, string, boolean][] = [
  ["STEP-001", "ค้นหาห้องว่าง", false],
  ["STEP-002", "เลือกห้องและเวลา", false],
  ["STEP-003", "ส่งคำขอจอง", false],
  ["STEP-004", "ผู้ดูแลพิจารณา", false],
  ["STEP-005", "ได้รับการยืนยัน", true],
  ["STEP-006", "แจ้งว่าถูกปฏิเสธ", true],
];

// next links: [from, to, label]
const NEXT: [string, string, string | null][] = [
  ["STEP-001", "STEP-002", null],
  ["STEP-002", "STEP-003", null],
  ["STEP-003", "STEP-004", "ห้องใหญ่ ต้องอนุมัติ"],
  ["STEP-003", "STEP-005", "ห้องเล็ก ไม่ต้องอนุมัติ"],
  ["STEP-004", "STEP-005", "อนุมัติ"],
  ["STEP-004", "STEP-006", "ปฏิเสธ"],
];

// swimlane lanes, in the API's order
const PARTICIPANTS: ParticipantVM[] = [
  { key: "ROLE-001", kind: "role", title: "พนักงาน" },
  { key: "SCR-001", kind: "screen", title: "หน้าค้นหาห้อง" },
  { key: "API-001", kind: "api", title: "ค้นหาห้องว่าง" },
  { key: "SYS-001", kind: "system", title: "ระบบปฏิทิน" },
  { key: "SCR-002", kind: "screen", title: "หน้ายืนยันการจอง" },
  { key: "API-002", kind: "api", title: "สร้างการจอง" },
  { key: "ROLE-002", kind: "role", title: "ผู้ดูแลห้อง" },
  { key: "SCR-003", kind: "screen", title: "หน้าอนุมัติคำขอ" },
  { key: "API-003", kind: "api", title: "อนุมัติการจอง" },
];

// interactions: [key, step, order, from, to, text]
const INTERACTIONS: [string, string, number, string, string, string][] = [
  ["INT-001", "STEP-001", 1, "ROLE-001", "SCR-001", "เลือกวันที่"],
  ["INT-002", "STEP-001", 2, "SCR-001", "API-001", "ขอรายการห้องว่าง"],
  ["INT-003", "STEP-001", 3, "API-001", "SYS-001", "อ่านห้องว่างจากปฏิทิน"],
  ["INT-004", "STEP-002", 1, "ROLE-001", "SCR-001", "เลือกห้องและช่วงเวลา"],
  ["INT-005", "STEP-002", 2, "SCR-001", "SCR-002", "เปิดหน้ายืนยันพร้อมห้องที่เลือก"],
  ["INT-006", "STEP-003", 1, "ROLE-001", "SCR-002", "กดยืนยันการจอง"],
  ["INT-007", "STEP-003", 2, "SCR-002", "API-002", "ส่ง Booking"],
  ["INT-008", "STEP-003", 3, "API-002", "SYS-001", "ตรวจเวลาว่างและบันทึก"],
  ["INT-009", "STEP-003", 4, "API-002", "SCR-002", "201 · status pending | confirmed"],
  ["INT-010", "STEP-004", 1, "ROLE-002", "SCR-003", "เปิดคำขอแล้วกดอนุมัติหรือปฏิเสธ"],
  ["INT-011", "STEP-004", 2, "SCR-003", "API-003", "ส่งผลการพิจารณา"],
  ["INT-012", "STEP-004", 3, "API-003", "SYS-001", "อัปเดตสถานะการจอง"],
  ["INT-013", "STEP-005", 1, "SCR-002", "ROLE-001", "แสดงว่าการจองสำเร็จ"],
  ["INT-014", "STEP-006", 1, "SCR-002", "ROLE-001", "แสดงว่าถูกปฏิเสธ พร้อมเหตุผล"],
];

// swimlane rows: which lanes take part in each step, in the API's order
const STEP_LANES: Record<string, string[]> = {
  "STEP-001": ["ROLE-001", "SCR-001", "API-001", "SYS-001"],
  "STEP-002": ["ROLE-001", "SCR-001", "SCR-002"],
  "STEP-003": ["ROLE-001", "SCR-002", "API-002", "SYS-001"],
  "STEP-004": ["ROLE-002", "SCR-003", "API-003", "SYS-001"],
  "STEP-005": ["SCR-002", "ROLE-001"],
  "STEP-006": ["SCR-002", "ROLE-001"],
};

const DATA = [
  { key: "DATA-001", title: "Room" },
  { key: "DATA-002", title: "Booking" },
];
const API_PARTS = [
  { key: "API-001", title: "ค้นหาห้องว่าง", method: "GET", path: "/rooms", reads: ["DATA-001"], writes: [] as string[] },
  { key: "API-002", title: "สร้างการจอง", method: "POST", path: "/bookings", reads: [] as string[], writes: ["DATA-002"] },
  { key: "API-003", title: "อนุมัติการจอง", method: "POST", path: "/bookings/{id}/approve", reads: [] as string[], writes: ["DATA-002"] },
];
const SCREEN_PARTS = [
  { key: "SCR-001", title: "หน้าค้นหาห้อง", shows: ["DATA-001"] },
  { key: "SCR-002", title: "หน้ายืนยันการจอง", shows: ["DATA-002"] },
  { key: "SCR-003", title: "หน้าอนุมัติคำขอ", shows: ["DATA-002"] },
];
const DECISION = {
  key: "DEC-001",
  title: "ห้องที่จุเกิน 10 คนต้องให้ผู้ดูแลอนุมัติ",
  rule: "ห้องที่จุเกิน 10 คนต้องให้ผู้ดูแลอนุมัติ",
  cases: ["ห้องใหญ่ → ผู้ดูแลอนุมัติ", "ห้องเล็ก → ยืนยันทันที"],
  open: "ห้องพอดี 10 คน",
  covers: ["STEP-003", "STEP-004"],
};
const QUESTION = {
  key: "Q-001",
  title: "ผู้ดูแลไม่ตอบใน 24 ชม. ทำอย่างไร",
  proposedAnswer: "ยกเลิกอัตโนมัติและแจ้งพนักงาน",
  about: "STEP-004",
};

// every part, for the node web and history
const PARTS: { key: string; kind: PartKind; title: string }[] = [
  { key: WORK.key, kind: "work", title: WORK.title },
  ...STEPS.map(([key, title]) => ({ key, kind: "step" as const, title })),
  ...INTERACTIONS.map(([key, , , , , text]) => ({ key, kind: "interaction" as const, title: text })),
  ...PARTICIPANTS.map((p) => ({ key: p.key, kind: p.kind as PartKind, title: p.title })),
  ...DATA.map((d) => ({ key: d.key, kind: "data" as const, title: d.title })),
  { key: DECISION.key, kind: "decision", title: DECISION.title },
  { key: QUESTION.key, kind: "question", title: QUESTION.title },
];
const titleOf = (key: string) => PARTS.find((p) => p.key === key)?.title ?? key;

// every link, by kind (66 — the API's ids are UUIDs; samples use readable ids)
const LINKS: { kind: string; from: string; to: string }[] = [
  ...STEPS.map(([key]) => ({ kind: "has_step", from: WORK.key, to: key })),
  ...NEXT.map(([from, to]) => ({ kind: "next", from, to })),
  ...INTERACTIONS.flatMap(([key, step, , from, to]) => [
    { kind: "has_interaction", from: step, to: key },
    { kind: "from", from: key, to: from },
    { kind: "to", from: key, to },
  ]),
  { kind: "carries", from: "INT-003", to: "DATA-001" },
  { kind: "carries", from: "INT-007", to: "DATA-002" },
  { kind: "carries", from: "INT-012", to: "DATA-002" },
  ...API_PARTS.flatMap((a) => [...a.reads.map((d) => ({ kind: "reads", from: a.key, to: d })), ...a.writes.map((d) => ({ kind: "writes", from: a.key, to: d }))]),
  ...SCREEN_PARTS.flatMap((s) => s.shows.map((d) => ({ kind: "shows", from: s.key, to: d }))),
  ...DECISION.covers.map((s) => ({ kind: "covers", from: DECISION.key, to: s })),
  { kind: "about", from: QUESTION.key, to: QUESTION.about },
];

// ---------- hrefs: the core's pattern (a theme never builds a URL) ----------
const href = (page: PageId, query?: string) => `/p/${PROJECT_ID}/${pageSlug(page)}${query ? `?${query}` : ""}`;

// ---------- shared pieces ----------
const STUCK_COUNT = 1; // GET …/stuck → 1 item (Q-001)
const readiness: ReadinessVM = { stuckCount: STUCK_COUNT, label: readinessStuck(STUCK_COUNT), ready: false };

export function sampleFrame(page: PageId): FrameVM {
  return { project, readiness, nav: nav(PROJECT_ID, page), page }; // the core's own strip (TASK-B-011 Q1)
}

const steps: StepVM[] = STEPS.map(([key, title, ends], i) => ({
  key,
  number: String(i + 1).padStart(2, "0"),
  title,
  ends,
  stuck: key === QUESTION.about,
  stuckWordings: key === QUESTION.about ? [stuckWords.open_question] : [], // v1.3
  href: href("sequence", `step=${key}`),
}));
const stepOf = (key: string) => steps.find((s) => s.key === key)!;
const work: WorkVM = { key: WORK.key, title: WORK.title, steps };
const workLinks = (page: PageId) => [{ key: WORK.key, title: WORK.title, href: href(page, `work=${WORK.key}`) }];

// Another part, linked to on the web page (v1.7)
const partRef = (k: string) => ({ key: k, title: titleOf(k), href: href("web", `part=${k}`) });

const decision: DecisionVM = {
  key: DECISION.key,
  title: DECISION.title,
  rule: DECISION.rule,
  cases: DECISION.cases,
  open: DECISION.open,
  covers: DECISION.covers.map(partRef),
};

// ---------- positions: the core's real layouts (TASK-B-006), fed the same copied API data ----------
// (Team A TASK-A-019 Q1: the old sample grid drew 03→05 straight through node 04; flow.ts never does.)
const flowDiagram: ApiFlowchart = {
  nodes: STEPS.map(([key, title, ends], i) => ({ key, title, position: i + 1, ends, isBranch: NEXT.filter(([f]) => f === key).length > 1 })),
  arrows: NEXT.map(([from, to, label]) => ({ from, to, label })),
};

const swimLayout: SwimLayout = {
  lanes: realLayouts.swimLanes(PARTICIPANTS),
  rows: steps.map((step) => ({
    step,
    lanes: STEP_LANES[step.key],
    handoffs: INTERACTIONS.filter(([, s]) => s === step.key).map(([key, , order, from, to, text]) => ({ key, order, from, to, text })),
  })),
};

// Sequence of a step (the API's messages for it): participants in the API's order, as GET …/diagrams/sequence returns.
function sampleSeqLayout(stepKey: string): SeqLayout {
  const msgs = INTERACTIONS.filter(([, s]) => s === stepKey);
  const keys = [...new Set(msgs.flatMap(([, , , f, t]) => [f, t]))];
  return realLayouts.sequence(
    keys.map((k) => PARTICIPANTS.find((p) => p.key === k)!),
    msgs.map(([key, , , from, to, text]) => ({ key, from, to, text, reply: null })),
  );
}

// Node web: every part and every link, through the shared web layout.
function sampleWebLayout(): WebLayout {
  const stuck = new Set([QUESTION.key, QUESTION.about]);
  const nodes = PARTS.map((p) => ({ key: p.key, kind: p.kind as ApiPart["kind"], title: p.title, stuck: stuck.has(p.key) }));
  const links = LINKS.map((l): ApiLink => ({
    id: `${l.kind}:${l.from}->${l.to}`, kind: l.kind as ApiLink["kind"], fromKey: l.from, toKey: l.to,
    label: null, position: null, origin: { stamp: ORIGIN.stamp, date: ORIGIN.date },
  }));
  const layout = realLayouts.web(nodes, links);
  return { ...layout, nodes: layout.nodes.map((n) => ({ ...n, href: href("web", `part=${n.key}`) })) };
}

// ---------- one sample per page ----------
export const sampleOverview: OverviewVM = { frame: sampleFrame("overview"), works: [work], decisions: [decision] };

export const sampleWorkOrder: WorkOrderVM = { frame: sampleFrame("workOrder"), works: workLinks("workOrder"), work, layout: swimLayout };

export const sampleFlowchart: FlowchartVM = {
  frame: sampleFrame("flowchart"),
  works: workLinks("flowchart"),
  work,
  layouts: { LR: realLayouts.flow(flowDiagram, "LR"), TB: realLayouts.flow(flowDiagram, "TB") },
};

export const sampleSequence: SequenceVM = { frame: sampleFrame("sequence"), steps, step: stepOf("STEP-003"), layout: sampleSeqLayout("STEP-003") };

export const sampleScreens: ScreensVM = {
  frame: sampleFrame("screens"),
  // the worked example's screens have empty fields / actions / states — shown as they are
  screens: SCREEN_PARTS.map((s): ScreenVM => ({
    key: s.key, title: s.title, stuck: false, stuckWordings: [], fields: [], actions: [], states: [], shows: s.shows.map(partRef),
  })),
};

export const sampleApis: ApisVM = {
  frame: sampleFrame("api"),
  apis: API_PARTS.map((a): ApiVM => ({
    key: a.key, title: a.title, stuck: false, stuckWordings: [], method: a.method, path: a.path, request: null, responses: [],
    reads: a.reads.map(partRef),
    writes: a.writes.map(partRef),
  })),
};

const selectedPart: PartDetailVM = {
  key: "STEP-004",
  kind: "step",
  title: titleOf("STEP-004"),
  stamp: ORIGIN.stamp,
  stampLabel: stamp[ORIGIN.stamp] ?? "",
  date: ORIGIN.date,
  dateLabel: formatThaiDate(ORIGIN.date),
  cameFrom: historyCause.operator,
  links: LINKS.filter((l) => l.from === "STEP-004" || l.to === "STEP-004").map((l) => {
    const out = l.from === "STEP-004";
    const other = out ? l.to : l.from;
    const direction = out ? ("out" as const) : ("in" as const);
    return {
      kind: l.kind, direction, label: linkKind[l.kind]?.[direction] ?? "", key: other, title: titleOf(other),
      href: href("web", `part=${other}`),
    };
  }),
};
export const sampleWeb: WebVM = { frame: sampleFrame("web"), layout: sampleWebLayout(), selected: selectedPart };

export const sampleStuck: StuckVM = {
  frame: sampleFrame("stuck"),
  items: [{
    kind: "open_question",
    reason: null,
    key: QUESTION.key,
    title: QUESTION.title,
    wording: stuckWords.open_question,
    proposedAnswer: QUESTION.proposedAnswer,
    target: { key: QUESTION.about, title: titleOf(QUESTION.about), href: stepOf(QUESTION.about).href },
  }],
};

// The example was created by one change set from the operator: the decision's "add" entry and its two "covers" links,
// worded as the core words them (v1.8 — a link reads "<from> <linkKind.out> <to>", never an id).
const created = { at: project.createdAt, atLabel: project.createdLabel, cause: historyCause.operator };
export const sampleHistory: HistoryVM = {
  frame: sampleFrame("history"),
  parts: PARTS.map((p) => ({ key: p.key, kind: p.kind, title: p.title, href: href("history", `part=${p.key}`) })),
  part: { key: DECISION.key, title: DECISION.title },
  entries: [
    { ...created, what: "add", whatLabel: historyWhat.add!, summary: DECISION.title },
    ...["STEP-003", "STEP-004"].map((to) => ({ ...created, what: "link_add", whatLabel: historyWhat.link_add!, summary: `${DECISION.title} ${linkKind.covers!.out} ${titleOf(to)}` })),
  ],
};

// ---------- home + new project ----------
export const sampleCard: ProjectCardVM = { project, readiness, href: href("overview") };
export const samplePreview: PreviewVM = { project, readiness, steps };

// ---------- what must be shown (sample of the required-content rule, R8 — contract v1.1) ----------
// The shell carries the frame's own item (the readiness label); a page lists only what is in its own view model.
// Same ids as the builders' build/required.ts.
export const sampleShellRequired: RequiredItem[] = [{ id: requiredId.readiness, text: readiness.label }];
const stepItems = steps.map((s) => ({ id: requiredId.step(s.key), text: s.title }));
export const sampleRequired: { [P in PageId]: RequiredItem[] } = {
  overview: stepItems,
  workOrder: [...stepItems, ...PARTICIPANTS.map((p) => ({ id: requiredId.lane(p.key), text: p.title }))],
  flowchart: [...stepItems, ...NEXT.filter(([, , l]) => l).map(([f, t, l]) => ({ id: requiredId.branch(f, t), text: l! }))],
  sequence: sampleSequence.layout.messages.map((m) => ({ id: requiredId.message(m.key), text: m.text })),
  screens: SCREEN_PARTS.map((s) => ({ id: requiredId.screen(s.key), text: s.title })),
  api: API_PARTS.map((a) => ({ id: requiredId.api(a.key), text: a.title })),
  web: sampleWeb.layout.nodes.filter((n) => n.stuck).map((n) => ({ id: requiredId.part(n.key), text: n.title })),
  stuck: sampleStuck.items.map((i) => ({ id: requiredId.stuck(i), text: i.wording })),
  history: sampleHistory.part ? [{ id: requiredId.part(sampleHistory.part.key), text: sampleHistory.part.title }] : [],
};
