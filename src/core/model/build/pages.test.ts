// Builders against recorded API responses (tests/fixtures/api — scripts/record-api-fixtures.ts). No server needed.
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { findRequired, requiredId } from "@/core/theme/required";
import { stuck as words } from "@/core/words";
import type { GateCode } from "@/features/ready/contract";
import { readyRequiredId } from "@/features/ready/required";
import {
  buildApis, buildCard, buildFlowchart, buildHistory, buildOverview, buildScreens, buildSequence, buildStuck, buildWeb,
  buildWorkOrder,
} from "./pages";
import { sampleHistory } from "@/core/model/samples";
import { confirmedOf, exportHref, frame, readiness } from "./common";
import { pageRequired, shellRequired } from "./required";
import { sampleLayouts as L } from "./sample-layouts";
import type { ApiFlowchart, ApiHistoryEntry, ApiSequence, ApiSwimlane, Built, ProjectData } from "./types";

const fixture = <T>(name: string): T =>
  JSON.parse(readFileSync(path.join(process.cwd(), "tests/fixtures/api", `${name}.json`), "utf8")) as T;
const data = (p: string): ProjectData => {
  const spec = fixture<Omit<ProjectData, "stuck">>(`${p}-project`);
  return { ...spec, stuck: fixture<{ items: ProjectData["stuck"] }>(`${p}-stuck`).items };
};
const vm = <T>(b: Built<T>): T => {
  if (!b.ok) throw new Error(`expected a view model, got state ${JSON.stringify(b.state)}`);
  return b.vm;
};

const worked = data("worked");
const every = data("every-stuck");
const empty = data("empty");

describe("worked example (จองห้องประชุม)", () => {
  test("overview: steps 01…06 in has_step order, only STEP-004 stuck; date label is the core's", () => {
    const v = vm(buildOverview(worked));
    const steps = v.works[0]!.steps;
    expect(steps.map((s) => s.number)).toEqual(["01", "02", "03", "04", "05", "06"]);
    expect(steps.map((s) => s.title)).toEqual(["ค้นหาห้องว่าง", "เลือกห้องและเวลา", "ส่งคำขอจอง", "ผู้ดูแลพิจารณา", "ได้รับการยืนยัน", "แจ้งว่าถูกปฏิเสธ"]);
    expect(steps.filter((s) => s.stuck).map((s) => s.key)).toEqual(["STEP-004"]);
    expect(steps.filter((s) => s.ends).map((s) => s.key)).toEqual(["STEP-005", "STEP-006"]);
    expect(v.frame.readiness).toEqual({ stuckCount: 1, label: "ยังติดอยู่ 1 จุด", ready: false });
    expect(v.frame.project.createdLabel).toMatch(/^\d{1,2} ต\.ค\. 2569$/);
    expect(v.decisions[0]!.open).toBe("ห้องพอดี 10 คน");
    expect(v.frame.nav.find((n) => n.current)?.href).toBe(`/p/${worked.project.id}/overview`);
  });

  test("flowchart: 6 nodes, 6 arrows, 4 condition labels", () => {
    const v = vm(buildFlowchart(worked, fixture<ApiFlowchart>("worked-flowchart-WRK-001"), L));
    for (const lay of [v.layouts.LR, v.layouts.TB]) {
      expect(lay.nodes).toHaveLength(6);
      expect(lay.edges).toHaveLength(6);
      expect(lay.edges.filter((e) => e.label).map((e) => e.label)).toEqual(["ห้องใหญ่ ต้องอนุมัติ", "ห้องเล็ก ไม่ต้องอนุมัติ", "อนุมัติ", "ปฏิเสธ"]);
    }
  });

  test("swimlane: 6 rows × 9 lanes; STEP-003 hands off 4 times, in order", () => {
    const v = vm(buildWorkOrder(worked, fixture<ApiSwimlane>("worked-swimlane-WRK-001"), L));
    expect(v.layout.rows).toHaveLength(6);
    expect(v.layout.lanes).toHaveLength(9);
    const row3 = v.layout.rows.find((r) => r.step.key === "STEP-003")!;
    expect(row3.handoffs.map((h) => [h.order, h.key, h.from, h.to])).toEqual([
      [1, "INT-006", "ROLE-001", "SCR-002"],
      [2, "INT-007", "SCR-002", "API-002"],
      [3, "INT-008", "API-002", "SYS-001"],
      [4, "INT-009", "API-002", "SCR-002"],
    ]);
  });

  test("sequence of STEP-003: 4 messages in order", () => {
    const v = vm(buildSequence(worked, fixture<ApiSequence>("worked-sequence-STEP-003"), L, "STEP-003"));
    expect(v.step.key).toBe("STEP-003");
    expect(v.layout.messages.map((m) => [m.order, m.text])).toEqual([
      [1, "กดยืนยันการจอง"], [2, "ส่ง Booking"], [3, "ตรวจเวลาว่างและบันทึก"], [4, "201 · status pending | confirmed"],
    ]);
  });

  test("stuck: one open question Q-001, pointing at STEP-004, with its proposed answer", () => {
    const v = vm(buildStuck(worked));
    expect(v.items).toHaveLength(1);
    const q = v.items[0]!;
    expect([q.kind, q.key, q.wording, q.target.key]).toEqual(["open_question", "Q-001", words.open_question, "STEP-004"]);
    expect(q.target.href).toBe(`/p/${worked.project.id}/chat?q=Q-001`); // v1.9: an open question is answered in the chat (REQ-004 R7)
    expect(q.proposedAnswer).toBe("ยกเลิกอัตโนมัติและแจ้งพนักงาน");
  });

  test("screens and APIs come from the parts", () => {
    expect(vm(buildScreens(worked)).screens.map((s) => s.title)).toEqual(["หน้าค้นหาห้อง", "หน้ายืนยันการจอง", "หน้าอนุมัติคำขอ"]);
    const apis = vm(buildApis(worked)).apis;
    expect(apis.map((a) => `${a.method} ${a.path}`)).toEqual(["GET /rooms", "POST /bookings", "POST /bookings/{id}/approve"]);
    expect(apis[0]!.reads.map((r) => r.title)).toEqual(["Room"]);
  });

  test("web: every part is a node; a selected part shows its links and where it came from", () => {
    const v = vm(buildWeb(worked, L, "DEC-001", fixture<ApiHistoryEntry[]>("worked-history-DEC-001")));
    expect(v.layout.nodes).toHaveLength(worked.parts.length);
    expect(v.layout.edges).toHaveLength(worked.links.length);
    expect(v.selected?.links.map((l) => l.key).sort()).toEqual(["STEP-003", "STEP-004"]);
    expect(v.selected?.cameFrom).toBe("โดยคุณ");
  });

  test("v1.4 hrefs: every web node and every selected-part link points at that part on the web page", () => {
    const id = worked.project.id;
    const v = vm(buildWeb(worked, L, "STEP-004"));
    for (const n of v.layout.nodes) expect(n.href).toBe(`/p/${id}/web?part=${n.key}`);
    expect(v.selected!.links.length).toBeGreaterThan(0);
    for (const l of v.selected!.links) expect(l.href).toBe(`/p/${id}/web?part=${l.key}`);
  });

  test("v1.5 stampLabel + dateLabel: the selected part says who stamped it and when, in words", () => {
    const s = vm(buildWeb(worked, L, "DEC-001")).selected!;
    expect(s.stampLabel).toBe("ยืนยันโดยเจ้าของโปรเจกต์");
    expect(s.dateLabel).toBe("8 ต.ค. 2569");
  });

  test("v1.6 link labels: STEP-004's links read per direction; an unknown kind gives an empty label", () => {
    const labels = vm(buildWeb(worked, L, "STEP-004")).selected!.links.map((l) => `${l.label} ${l.key}`).sort();
    expect(labels).toEqual([
      "ถูกกำหนดโดย DEC-001", "มาจาก STEP-003", "มีการโต้ตอบ INT-010", "มีการโต้ตอบ INT-011", "มีการโต้ตอบ INT-012",
      "มีคำถาม Q-001", "ไปต่อที่ STEP-005", "ไปต่อที่ STEP-006", "เป็นขั้นตอนของ WRK-001",
    ].sort());
    const odd = { ...worked, links: [...worked.links, { ...worked.links[0]!, id: "x", kind: "brand_new_kind", fromKey: "STEP-004", toKey: "STEP-005" }] } as ProjectData;
    const l = vm(buildWeb(odd, L, "STEP-004")).selected!.links.find((x) => x.kind === "brand_new_kind")!;
    expect(l.label).toBe("");
  });

  test("required: the shell carries readiness; a page never repeats it", () => {
    const v = vm(buildOverview(worked));
    expect(shellRequired(v.frame)).toEqual([{ id: "readiness", text: "ยังติดอยู่ 1 จุด" }]);
    const req = pageRequired("overview", v);
    expect(req.map((r) => r.id)).toEqual(["STEP-001", "STEP-002", "STEP-003", "STEP-004", "STEP-005", "STEP-006"].map((k) => `step:${k}`));
    expect(req.some((r) => r.id === "readiness")).toBe(false);
  });

  test("v1.3 stuckWordings: STEP-004 says why it is stuck, every other step says nothing", () => {
    for (const s of vm(buildOverview(worked)).works[0]!.steps) {
      expect(s.stuckWordings).toEqual(s.key === "STEP-004" ? ["ยังมีคำถามที่ยังไม่ได้ตอบ"] : []);
    }
  });

  test("v1.3 required ids: every id on every page is the requiredId helper's for that piece", () => {
    const L2 = L;
    const pages = {
      overview: vm(buildOverview(worked)),
      workOrder: vm(buildWorkOrder(worked, fixture<ApiSwimlane>("worked-swimlane-WRK-001"), L2)),
      flowchart: vm(buildFlowchart(worked, fixture<ApiFlowchart>("worked-flowchart-WRK-001"), L2)),
      sequence: vm(buildSequence(worked, fixture<ApiSequence>("worked-sequence-STEP-003"), L2, "STEP-003")),
      screens: vm(buildScreens(worked)),
      api: vm(buildApis(worked)),
      stuck: vm(buildStuck(worked)),
      history: vm(buildHistory(worked, "DEC-001", fixture<ApiHistoryEntry[]>("worked-history-DEC-001"))),
    };
    const expected = {
      overview: pages.overview.works[0]!.steps.map((s) => requiredId.step(s.key)),
      workOrder: [...pages.workOrder.work.steps.map((s) => requiredId.step(s.key)), ...pages.workOrder.layout.lanes.map((l) => requiredId.lane(l.key))],
      flowchart: [...pages.flowchart.work.steps.map((s) => requiredId.step(s.key)), ...pages.flowchart.layouts.LR.edges.filter((e) => e.label).map((e) => requiredId.branch(e.from, e.to))],
      sequence: pages.sequence.layout.messages.map((m) => requiredId.message(m.key)),
      screens: pages.screens.screens.map((s) => requiredId.screen(s.key)),
      api: pages.api.apis.map((a) => requiredId.api(a.key)),
      stuck: pages.stuck.items.map((i) => requiredId.stuck(i)),
      history: [requiredId.part("DEC-001")],
    };
    for (const [page, v] of Object.entries(pages)) {
      expect(pageRequired(page as keyof typeof pages, v as never).map((r) => r.id)).toEqual(expected[page as keyof typeof expected]);
    }
    expect(shellRequired(pages.overview.frame).map((r) => r.id)).toEqual([requiredId.readiness]);
    const req = pageRequired("stuck", pages.stuck);
    expect(findRequired(req, requiredId.stuck(pages.stuck.items[0]!))?.text).toBe("ยังมีคำถามที่ยังไม่ได้ตอบ");
    expect(findRequired(req, "nope")).toBeUndefined();
  });

  test("home card: readiness and href from the list", () => {
    const list = fixture<(ProjectData["project"] & { stuckCount: number })[]>("projects");
    const card = buildCard({ ...list.find((p) => p.id === worked.project.id)!, partCount: worked.parts.length });
    expect([card.readiness.label, card.href, card.project.theme]).toEqual(["ยังติดอยู่ 1 จุด", `/p/${worked.project.id}/overview`, "clean-blue"]);
  });

  test("D-025 + D-031: the home card's readiness comes from the list alone — empty, or nothing stuck (home never knows it is confirmed)", () => {
    const item = { ...worked.project, stuckCount: 0 };
    expect(buildCard({ ...item, partCount: 0 }).readiness).toEqual({ stuckCount: 0, label: "ยังไม่มีข้อมูลในโปรเจกต์นี้", ready: false });
    expect(buildCard({ ...item, partCount: 12 }).readiness).toEqual({ stuckCount: 0, label: "ไม่มีเรื่องติด", ready: false });
  });
});

describe("every stuck kind (invented project)", () => {
  const v = vm(buildStuck(every));
  const by = (kind: string, reason: string | null = null) => v.items.filter((i) => i.kind === kind && i.reason === reason);

  test("count = the API's count", () => {
    expect(v.items).toHaveLength(every.stuck.length);
    expect(v.frame.readiness.stuckCount).toBe(every.stuck.length);
    expect(v.items.length).toBeGreaterThanOrEqual(10);
  });

  test("every kind and every flow-break reason, each with its exact words", () => {
    for (const k of ["open_question", "unlinked_part", "unconfirmed_guess", "screen_without_api"] as const) {
      expect(by(k).length).toBeGreaterThan(0);
      for (const i of by(k)) expect(i.wording).toBe(words[k]);
    }
    for (const r of ["unreachable", "dead_end", "unlabelled_branch", "no_interactions", "incomplete_interaction"] as const) {
      expect(by("flow_break", r)).toHaveLength(1);
      expect(by("flow_break", r)[0]!.wording).toBe(words[r]);
    }
  });

  test("v1.3 stuckWordings: a flow-break step carries its reason's words", () => {
    const steps = vm(buildOverview(every)).works[0]!.steps;
    const s2 = steps.find((s) => s.key === "STEP-002")!; // dead end + no interactions + the open question about it
    expect(s2.stuckWordings).toEqual(expect.arrayContaining([words.dead_end, words.no_interactions, words.open_question]));
    expect(steps.find((s) => s.key === "STEP-004")!.stuckWordings).toEqual([words.unreachable]);
    for (const s of steps) expect(s.stuck).toBe(s.stuckWordings.length > 0);
  });

  test("a target per kind (REVIEW-C-001 S4)", () => {
    const id = every.project.id;
    expect(by("open_question")[0]!.target.key).toBe("STEP-002"); // its `about` link
    for (const i of v.items.filter((x) => x.kind === "flow_break")) {
      expect(i.target.key).toBe(i.key);
      expect(i.target.href).toBe(`/p/${id}/sequence?step=${i.key}`);
    }
    const sw = by("screen_without_api")[0]!;
    expect([sw.target.key, sw.target.href]).toEqual(["SCR-001", `/p/${id}/screens?part=SCR-001`]);
    const ul = by("unlinked_part")[0]!;
    expect(ul.target.href).toBe(`/p/${id}/web?part=${ul.key}`);
    const guesses = by("unconfirmed_guess");
    const linkGuess = every.stuck.find((i) => i.kind === "unconfirmed_guess" && i.linkId)!;
    const linkFrom = every.links.find((l) => l.id === linkGuess.linkId)!.fromKey;
    expect(guesses.map((g) => g.target.key)).toContain(linkFrom); // a guessed link → its `from` part
    expect(guesses.map((g) => g.target.key)).toContain("ROLE-002"); // a guessed part → itself
  });

  test("a stuck kind the contract does not know yet stays in the list, worded by its title", () => {
    const later = { ...every, stuck: [...every.stuck, { kind: "contradiction", key: "Q-001", title: "สองเรื่องขัดกัน" } as ProjectData["stuck"][number]] };
    const items = vm(buildStuck(later)).items;
    expect(items).toHaveLength(every.stuck.length + 1);
    expect(items.at(-1)!.wording).toBe("สองเรื่องขัดกัน");
  });

  test("history of a part changed twice: both changes, oldest first, with when and why", () => {
    const key = every.stuck.find((i) => i.kind === "unlinked_part")!.key;
    const h = vm(buildHistory(every, key, fixture<ApiHistoryEntry[]>(`every-stuck-history-${key}`)));
    const updates = h.entries.filter((e) => e.what === "update");
    expect(updates).toHaveLength(2);
    expect(updates.map((e) => e.summary)).toEqual(["ข้อมูลที่ไม่มีใครใช้ (แก้ครั้งที่ 1)", "ข้อมูลที่ไม่มีใครใช้ (แก้ครั้งที่ 2)"]);
    expect(h.entries.map((e) => e.at)).toEqual([...h.entries.map((e) => e.at)].sort());
    for (const e of h.entries) {
      expect(e.cause).toBe("โดยคุณ");
      expect(e.atLabel).toMatch(/^\d{1,2} ต\.ค\. 2569$/);
    }
    expect(h.entries.map((e) => e.whatLabel)).toEqual(["เพิ่ม", "แก้", "แก้"]);
  });

  test("v1.7 stuckWordings on screens: the screen_without_api screen says why; an unknown op has no word", () => {
    const item = every.stuck.find((i) => i.kind === "screen_without_api")!;
    const s = vm(buildScreens(every)).screens.find((x) => x.key === item.key)!;
    expect(s.stuckWordings).toContain(words.screen_without_api); // SCR-001 is also an unconfirmed guess
    const odd = vm(buildHistory(every, item.key, [{ ...fixture<ApiHistoryEntry[]>("every-stuck-history-DATA-002")[0]!, op: "brand_new_op" } as unknown as ApiHistoryEntry]));
    expect(odd.entries[0]!.whatLabel).toBe("");
  });
});

describe("v1.7 hrefs: every cross-reference to another part opens it on the web page", () => {
  test("decision covers, screen shows, API reads/writes", () => {
    const id = worked.project.id;
    const refs = [
      ...vm(buildOverview(worked)).decisions.flatMap((d) => d.covers),
      ...vm(buildScreens(worked)).screens.flatMap((s) => s.shows),
      ...vm(buildApis(worked)).apis.flatMap((a) => [...a.reads, ...a.writes]),
    ];
    expect(refs.length).toBeGreaterThan(3);
    for (const r of refs) expect(r.href).toBe(`/p/${id}/web?part=${r.key}`);
  });
});

describe("v1.9 + v1.10: chat first and ready-to-build last in every frame's nav", () => {
  const id = worked.project.id;
  const frames = [
    vm(buildOverview(worked)).frame,
    vm(buildStuck(worked)).frame,
    vm(buildHistory(worked)).frame,
    vm(buildWeb(worked, L)).frame,
  ];

  test("nav = แชต · the 9 pages · พร้อมสร้างหรือยัง, with core-built hrefs", () => {
    for (const f of frames) {
      expect(f.nav).toHaveLength(11);
      expect(f.nav[0]).toMatchObject({ page: "chat", label: "แชต", href: `/p/${id}/chat` });
      expect(f.nav.at(-1)).toMatchObject({ page: "ready", label: "พร้อมสร้างหรือยัง", href: `/p/${id}/ready` });
      expect(f.nav.slice(1, -1).map((n) => n.page)).toEqual(["overview", "workOrder", "flowchart", "sequence", "screens", "api", "web", "stuck", "history"]);
    }
  });

  test("on a page, only that page is current; the chat / ready routes mark their own entry", () => {
    expect(frames[0]!.nav.filter((n) => n.current).map((n) => n.page)).toEqual(["overview"]);
    for (const which of ["chat", "ready"] as const) {
      const f = frame(worked, "overview", which);
      expect(f.nav.filter((n) => n.current).map((n) => n.page)).toEqual([which]);
    }
  });

  test("stuck targets: open_question → the chat at that question; other kinds keep theirs", () => {
    const items = vm(buildStuck(every)).items;
    for (const q of items.filter((i) => i.kind === "open_question")) expect(q.target.href).toBe(`/p/${every.project.id}/chat?q=${q.key}`);
    for (const i of items.filter((x) => x.kind !== "open_question")) expect(i.target.href).not.toContain("/chat");
  });
});

describe("TASK-B-015: the ready page's required ids come from Team C's own module", () => {
  test("requiredId.readyReason / readyScore = readyRequiredId.reason / score, for every GateCode", () => {
    const codes: GateCode[] = ["stuck", "no_quiz", "too_few", "not_100", "stale"];
    for (const code of codes) expect(requiredId.readyReason(code)).toBe(readyRequiredId.reason(code));
    expect(requiredId.readyScore).toBe(readyRequiredId.score);
  });
});

describe("v1.11: the PDF export URL is built by the core", () => {
  test("exportHref = /p/<id>/export/pdf — the route Team A's ExportButton fetches", () => {
    expect(exportHref(worked.project.id)).toBe(`/p/${worked.project.id}/export/pdf`);
  });
});

describe("v1.8 history: a summary never carries an id", () => {
  const ID = /[0-9a-f]{8}-|link:|part:/;
  const history = data("history"); // the worked example with Q-001 changed twice (TASK-B-009 seed mode `history`)
  const titleOf = (d: ProjectData, key: string) => d.parts.find((p) => p.key === key)!.title;
  const all = [
    vm(buildHistory(worked, "DEC-001", fixture<ApiHistoryEntry[]>("worked-history-DEC-001"))),
    vm(buildHistory(history, "Q-001", fixture<ApiHistoryEntry[]>("history-history-Q-001"))),
    vm(buildHistory(every, "DATA-002", fixture<ApiHistoryEntry[]>("every-stuck-history-DATA-002"))),
    sampleHistory,
  ];

  test("no summary on any history looks like an id", () => {
    for (const h of all) for (const e of h.entries) expect(e.summary).not.toMatch(ID);
  });

  test("link entries read as sentences: <from title> <linkKind.out> <to title>", () => {
    const dec = all[0]!.entries.filter((e) => e.what === "link_add").map((e) => e.summary);
    expect(dec).toEqual([
      `${titleOf(worked, "DEC-001")} ใช้กับ ${titleOf(worked, "STEP-003")}`,
      `${titleOf(worked, "DEC-001")} ใช้กับ ${titleOf(worked, "STEP-004")}`,
    ]);
    const q = all[1]!;
    expect(q.entries.map((e) => e.what)).toEqual(["add", "link_add", "update", "update"]);
    expect(q.entries[1]!.summary).toBe(`${titleOf(history, "Q-001")} ถามเรื่อง ${titleOf(history, "STEP-004")}`);
    expect(q.entries.filter((e) => e.what !== "link_add").map((e) => e.summary)).toEqual(Array(3).fill(titleOf(history, "Q-001")));
  });

  test("what the core cannot word is empty, never the raw entity", () => {
    const [add, link] = fixture<ApiHistoryEntry[]>("worked-history-DEC-001").filter((e) => e.op !== "update");
    const odd = (after: object) => ({ ...link!, after: { ...(link!.after as object), ...after } }) as ApiHistoryEntry;
    const rows = vm(buildHistory(worked, "DEC-001", [
      odd({ kind: "brand_new_kind" }),
      odd({ toKey: "NO-SUCH-PART" }),
      { ...add!, after: { key: "DEC-001" }, before: null } as ApiHistoryEntry,
    ])).entries;
    expect(rows.map((e) => e.summary)).toEqual(["", "", ""]);
  });

  test("parts[].kind is the part's kind", () => {
    for (const h of [all[0]!, sampleHistory]) {
      expect(h.parts.length).toBeGreaterThan(0);
      for (const p of h.parts) expect(p.kind).toBeTruthy();
    }
    expect(all[0]!.parts.find((p) => p.key === "DEC-001")!.kind).toBe("decision");
    expect(sampleHistory.parts.find((p) => p.key === "Q-001")!.kind).toBe("question");
  });
});

describe("empty project", () => {
  test("D-015: an empty project is never ready — its frame (and its home card) say ยังไม่มีข้อมูลในโปรเจกต์นี้", () => {
    const empty0 = { stuckCount: 0, label: "ยังไม่มีข้อมูลในโปรเจกต์นี้", ready: false };
    expect(frame(empty, "overview").readiness).toEqual(empty0);
    expect(readiness(0, true)).toEqual(empty0);
    // a project with stuck items still says so
    expect(vm(buildOverview(worked)).frame.readiness).toEqual({ stuckCount: 1, label: "ยังติดอยู่ 1 จุด", ready: false });
    expect(vm(buildOverview(every)).frame.readiness.label).toBe(`ยังติดอยู่ ${every.stuck.length} จุด`);
  });

  test("D-031: พร้อมสร้าง only for a confirmed, unchanged version — the four rows of REQ-007's seal", () => {
    const clear = { ...worked, stuck: [] }; // the worked example with its question answered: parts, nothing stuck
    expect(frame(empty, "overview").readiness).toEqual({ stuckCount: 0, label: "ยังไม่มีข้อมูลในโปรเจกต์นี้", ready: false });
    expect(frame(worked, "overview").readiness).toEqual({ stuckCount: 1, label: "ยังติดอยู่ 1 จุด", ready: false });
    expect(frame({ ...worked, confirmed: true }, "overview").readiness.label).toBe("ยังติดอยู่ 1 จุด"); // stuck wins
    expect(frame({ ...clear, confirmed: true }, "overview").readiness).toEqual({ stuckCount: 0, label: "พร้อมสร้าง", ready: true });
    expect(frame({ ...clear, confirmed: false }, "overview").readiness).toEqual({ stuckCount: 0, label: "ไม่มีเรื่องติด", ready: false }); // no version, or changed since
    expect(frame(clear, "overview").readiness).toEqual({ stuckCount: 0, label: "ไม่มีเรื่องติด", ready: false }); // unknown → never พร้อมสร้าง
    expect(confirmedOf({ latest: { version: 2, confirmedAt: "2026-10-09T05:00:00Z" }, changedSinceLatest: false })).toBe(true);
    expect(confirmedOf({ latest: { version: 2, confirmedAt: "2026-10-09T05:00:00Z" }, changedSinceLatest: true })).toBe(false);
    expect(confirmedOf({ latest: null, changedSinceLatest: false })).toBe(false);
  });

  test("every page says empty instead of drawing", () => {
    expect(buildOverview(empty)).toEqual({ ok: false, state: { kind: "empty", page: "overview" } });
    expect(buildStuck(empty).ok).toBe(false);
    expect(buildScreens(empty).ok).toBe(false);
    expect(buildApis(empty).ok).toBe(false);
    expect(buildWeb(empty, L).ok).toBe(false);
    expect(buildHistory(empty).ok).toBe(false);
  });
});
