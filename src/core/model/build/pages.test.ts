// Builders against recorded API responses (tests/fixtures/api — scripts/record-api-fixtures.ts). No server needed.
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { findRequired, requiredId } from "@/core/theme/required";
import { allProjects, historyWhat, linkedWith, productMark, stuck as words, stuckNodeName, webAll, zoomIn, zoomOut } from "@/core/words";
import type { GateCode } from "@/features/ready/contract";
import { readyRequiredId } from "@/features/ready/required";
import {
  auditSummary, buildApis, buildCard, buildFlowchart, buildHistory, buildOverview, buildRequirements, buildScreens, buildSequence, buildStuck,
  buildWeb, buildWorkOrder,
} from "./pages";
import { sampleFrame, sampleHistory, sampleWeb } from "@/core/model/samples";
import { confirmedOf, exportHref, frame, readiness, stuckTargets } from "./common";
import { pageRequired, shellRequired } from "./required";
import { sampleLayouts as L } from "./sample-layouts";
import type { ApiFlowchart, ApiHistoryEntry, ApiProjectHistoryEntry, ApiSequence, ApiSwimlane, Built, ProjectData } from "./types";

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
    expect(v.frame.rooms.flatMap((r) => r.pages).find((n) => n.current)?.href).toBe(`/p/${worked.project.id}/overview`);
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
    // REQ-017: the roles join the steps (no goal in this old spec, so no goal item)
    expect(req.map((r) => r.id)).toEqual(["role:ROLE-001", "role:ROLE-002", ...["STEP-001", "STEP-002", "STEP-003", "STEP-004", "STEP-005", "STEP-006"].map((k) => `step:${k}`)]);
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
      overview: [...pages.overview.roles.map((r) => requiredId.role(r.key)), ...pages.overview.works[0]!.steps.map((s) => requiredId.step(s.key))],
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
    // `contradiction` was the example until v1.13 named it; any kind the back end adds later behaves the same way
    const later = { ...every, stuck: [...every.stuck, { kind: "brand_new_kind", key: "Q-001", title: "เรื่องใหม่ที่ยังไม่มีคำ" } as unknown as ProjectData["stuck"][number]] };
    const items = vm(buildStuck(later)).items;
    expect(items).toHaveLength(every.stuck.length + 1);
    expect(items.at(-1)!.wording).toBe("เรื่องใหม่ที่ยังไม่มีคำ");
  });

  describe("v1.13: a contradiction is worded by its two sides (TEST-A-005 DEF-2, REQ-004 l.61)", () => {
    const title = (d: ProjectData, key: string) => d.parts.find((p) => p.key === key)!.title;
    const withContradiction = (between: string[]) => ({
      ...worked,
      stuck: [{ kind: "contradiction", key: "CON-001", title: "ห้องใหญ่ไม่ต้องอนุมัติ ตามเอกสาร", between } as unknown as ProjectData["stuck"][number]],
    });

    test("two part sides → \"สองส่วนนี้ขัดกัน: <first> กับ <second>\"; the target is the first side", () => {
      const item = vm(buildStuck(withContradiction(["DEC-001", "STEP-001"]))).items[0]!;
      expect(item.kind).toBe("contradiction");
      expect(item.wording).toBe(`สองส่วนนี้ขัดกัน: ${title(worked, "DEC-001")} กับ ${title(worked, "STEP-001")}`);
      expect(item.target.key).toBe("DEC-001");
    });

    test("a side that is not a part uses the item's own title — never a raw key (F-042)", () => {
      const item = vm(buildStuck(withContradiction(["NO-SUCH-PART", "STEP-001"]))).items[0]!;
      expect(item.wording).toBe(`สองส่วนนี้ขัดกัน: ห้องใหญ่ไม่ต้องอนุมัติ ตามเอกสาร กับ ${title(worked, "STEP-001")}`);
      expect(item.wording).not.toContain("NO-SUCH-PART");
      expect(item.target.key).toBe("STEP-001"); // the first side that IS a part
    });

    test("fewer than two sides → the note itself (two sides cannot be worded from one); more than two → the first two", () => {
      expect(vm(buildStuck(withContradiction([]))).items[0]!.wording).toBe("ห้องใหญ่ไม่ต้องอนุมัติ ตามเอกสาร");
      expect(vm(buildStuck(withContradiction(["DEC-001"]))).items[0]!.wording).toBe("ห้องใหญ่ไม่ต้องอนุมัติ ตามเอกสาร");
      const three = vm(buildStuck(withContradiction(["DEC-001", "STEP-001", "STEP-002"]))).items[0]!;
      expect(three.wording).toBe(`สองส่วนนี้ขัดกัน: ${title(worked, "DEC-001")} กับ ${title(worked, "STEP-001")}`);
    });
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

  test("rooms hold the 9 pages + requirement (REQ-103) + พร้อมสร้างหรือยัง with core-built hrefs; แชต is the frame's chatHref, in no room (R-3)", () => {
    for (const f of frames) {
      const pages = f.rooms.flatMap((r) => r.pages);
      expect(pages).toHaveLength(11);
      expect(pages.find((n) => n.page === "ready")).toMatchObject({ label: "พร้อมสร้างหรือยัง", href: `/p/${id}/ready` });
      expect(pages.map((n) => n.page).sort()).toEqual(["api", "flowchart", "history", "overview", "ready", "requirements", "screens", "sequence", "stuck", "web", "workOrder"]);
      expect(f.chatHref).toBe(`/p/${id}/chat`);
      expect("nav" in f).toBe(false);
    }
  });

  test("on a page, only that page is current; ready marks its own entry, the chat none", () => {
    const current = (f: { rooms: { pages: { page: string; current: boolean }[] }[] }) => f.rooms.flatMap((r) => r.pages).filter((n) => n.current).map((n) => n.page);
    expect(current(frames[0]!)).toEqual(["overview"]);
    expect(current(frame(worked, "overview", "ready"))).toEqual(["ready"]);
    expect(current(frame(worked, "overview", "chat"))).toEqual([]);
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

describe("v1.14: the web carries the href of itself with nothing chosen, built by the core (REQ-009)", () => {
  test("allHref = /p/<id>/web — with or without a chosen part; the sample has it too", () => {
    const id = worked.project.id;
    expect(vm(buildWeb(worked, L)).allHref).toBe(`/p/${id}/web`);
    expect(vm(buildWeb(worked, L, "DEC-001", fixture<ApiHistoryEntry[]>("worked-history-DEC-001"))).allHref).toBe(`/p/${id}/web`);
    expect(sampleWeb.allHref).toMatch(/^\/p\/[0-9a-f-]{36}\/web$/);
  });

  test("the four words are REQ-009's, verbatim", () => {
    expect([webAll, zoomIn, zoomOut, linkedWith]).toEqual(["ดูทั้งหมด", "ซูมเข้า", "ซูมออก", "เชื่อมกับ"]);
  });
});

describe("v1.12: every frame carries the project list's href, built by the core (AC-22, D-036)", () => {
  test("homeHref is \"/\" on real frames of every seed, on the chat / ready frames, and on the sample", () => {
    for (const d of [worked, every, empty]) {
      expect(frame(d, "overview").homeHref).toBe("/");
      expect(frame(d, "overview", "chat").homeHref).toBe("/");
      expect(frame(d, "overview", "ready").homeHref).toBe("/");
    }
    expect(vm(buildStuck(worked)).frame.homeHref).toBe("/");
    expect(sampleFrame("overview").homeHref).toBe("/");
    expect(sampleFrame("history").homeHref).toBe("/");
  });

  test("the two words are REQ-002's, verbatim", () => {
    expect(allProjects).toBe("โปรเจกต์ทั้งหมด");
    expect(productMark).toBe("Blueprint");
  });

  test("a stuck node's accessible name is \"{title} · ยังติดอยู่\" (REQ-002 l.92, TASK-B-026)", () => {
    expect(stuckNodeName("ขั้นแรก")).toBe("ขั้นแรก · ยังติดอยู่");
    expect(stuckNodeName("Room")).toBe("Room · ยังติดอยู่");
    expect(stuckNodeName("")).toBe(" · ยังติดอยู่"); // the core never invents a title; an empty one stays empty
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

describe("v1.15: the web marks exactly the stuck list's parts, and carries a tall layout for a phone (REQ-009, TASK-B-033)", () => {
  test("worked: the nodes marked stuck are stuckTargets(data) — as many as the header counts (the web used to mark the question too)", () => {
    const v = vm(buildWeb(worked, L));
    const marked = v.layout.nodes.filter((n) => n.stuck).map((n) => n.key).sort();
    expect(marked).toEqual([...stuckTargets(worked)].sort());
    expect(marked).toHaveLength(1);
    expect(marked).toHaveLength(v.frame.readiness.stuckCount);
  });

  test("every-stuck-kind: the marked nodes are stuckTargets(data), on the tall layout too", () => {
    const v = vm(buildWeb(every, L));
    const want = [...stuckTargets(every)].sort();
    expect(v.layout.nodes.filter((n) => n.stuck).map((n) => n.key).sort()).toEqual(want);
    expect(v.tall.nodes.filter((n) => n.stuck).map((n) => n.key).sort()).toEqual(want);
  });

  test("tall has the same parts, links and hrefs as layout (a part's href is the core's), and the sample has it too", () => {
    const v = vm(buildWeb(worked, L));
    expect(v.tall.nodes.map((n) => [n.key, n.href]).sort()).toEqual(v.layout.nodes.map((n) => [n.key, n.href]).sort());
    expect(v.tall.edges.map((e) => e.id).sort()).toEqual(v.layout.edges.map((e) => e.id).sort());
    expect(v.tall.nodes.every((n) => n.href === `/p/${worked.project.id}/web?part=${n.key}`)).toBe(true);
    expect(sampleWeb.tall.nodes.length).toBe(sampleWeb.layout.nodes.length);
  });
});

// ---------- REQ-017 (SPEC-C-006, TASK-C-045): two rooms in the frame, the brief on the overview ----------
describe("REQ-017: the frame's two rooms", () => {
  const id = worked.project.id;

  test("2 rooms in order, each with its pages in sub-nav order and core-built hrefs; the chat link beside them", () => {
    const f = vm(buildOverview(worked)).frame;
    expect(f.rooms.map((r) => [r.id, r.label])).toEqual([["front", "สิ่งที่เราเข้าใจ"], ["back", "เบื้องหลังเทคนิค"]]);
    expect(f.rooms[0]!.pages.map((p) => p.page)).toEqual(["overview", "flowchart", "stuck", "requirements", "ready"]);
    expect(f.rooms[1]!.pages.map((p) => p.page)).toEqual(["workOrder", "sequence", "screens", "api", "web", "history"]);
    expect(f.rooms[0]!.href).toBe(`/p/${id}/overview`);
    expect(f.rooms[1]!.href).toBe(`/p/${id}/work-order`);
    expect(f.rooms[0]!.pages.at(-1)).toMatchObject({ page: "ready", href: `/p/${id}/ready`, label: "พร้อมสร้างหรือยัง" });
    expect(f.chatHref).toBe(`/p/${id}/chat`);
  });

  test("the current room holds the current page — the 9 pages, chat and ready; one current page inside it", () => {
    const front = ["overview", "flowchart", "stuck", "requirements"] as const;
    const back = ["workOrder", "sequence", "screens", "api", "web", "history"] as const;
    for (const p of [...front, ...back]) {
      const f = frame(worked, p);
      expect(f.rooms.filter((r) => r.current).map((r) => r.id)).toEqual([(front as readonly string[]).includes(p) ? "front" : "back"]);
      expect(f.rooms.flatMap((r) => r.pages).filter((x) => x.current).map((x) => x.page)).toEqual([p]);
    }
    for (const which of ["chat", "ready"] as const) {
      const f = frame(worked, "overview", which);
      expect(f.rooms.filter((r) => r.current).map((r) => r.id)).toEqual(["front"]);
    }
    expect(frame(worked, "overview", "ready").rooms[0]!.pages.filter((x) => x.current).map((x) => x.page)).toEqual(["ready"]);
    expect(frame(worked, "overview", "chat").rooms.flatMap((r) => r.pages).filter((x) => x.current)).toEqual([]);
  });

});

describe("REQ-017: the brief (overview VM)", () => {
  test("the worked example (an old spec, no goal / duty): goal null, roles by title, 6 steps with 2 endings, the counts", () => {
    const v = vm(buildOverview(worked));
    expect(v.works.map((w) => w.goal)).toEqual([null]);
    expect(v.roles).toEqual([{ key: "ROLE-001", title: "พนักงาน", duty: null }, { key: "ROLE-002", title: "ผู้ดูแลห้อง", duty: null }]);
    expect(v.works[0]!.steps).toHaveLength(6);
    expect(v.works[0]!.steps.filter((s) => s.ends)).toHaveLength(2);
    expect(v.back).toEqual({ screens: 3, apis: 3, systems: 1, data: 2, interactions: 14 });
    expect(v.questions.map((q) => [q.kind, q.key])).toEqual([["open_question", "Q-001"]]);
    expect(v.version).toBeNull();
  });

  test("a spec with goal + duty → both present; a blank one counts as none", () => {
    const withBodies: ProjectData = {
      ...worked,
      parts: worked.parts.map((p) =>
        p.kind === "work" ? { ...p, body: { ...p.body, goal: "พนักงานจองห้องประชุมได้เอง" } }
        : p.key === "ROLE-001" ? { ...p, body: { ...p.body, duty: "หาห้อง จอง และรอผล" } }
        : p.key === "ROLE-002" ? { ...p, body: { ...p.body, duty: "   " } }
        : p),
    };
    const v = vm(buildOverview({ ...withBodies, latestVersion: 4 }));
    expect(v.works[0]!.goal).toBe("พนักงานจองห้องประชุมได้เอง");
    expect(v.roles.map((r) => r.duty)).toEqual(["หาห้อง จอง และรอผล", null]);
    expect(v.version).toBe(4);
  });

  test("no open question → an empty list (the theme says ไม่มี ทุกคำถามตอบแล้ว)", () => {
    expect(vm(buildOverview({ ...worked, stuck: [] })).questions).toEqual([]);
  });

  test("the overview's required list: each goal (when there is one) and every role title, then the steps (C-046)", () => {
    expect(requiredId.role("ROLE-001")).toBe("role:ROLE-001");
    expect(requiredId.goal("WRK-001")).toBe("goal:WRK-001");
    const goal = { ...worked, parts: worked.parts.map((p) => (p.kind === "work" ? { ...p, body: { ...p.body, goal: "เป้าหมาย" } } : p)) };
    const ids = (d: ProjectData) => pageRequired("overview", vm(buildOverview(d))).filter((r) => /^(role|goal):/.test(r.id));
    expect(ids(goal)).toEqual([
      { id: "goal:WRK-001", text: "เป้าหมาย" },
      { id: "role:ROLE-001", text: "พนักงาน" },
      { id: "role:ROLE-002", text: "ผู้ดูแลห้อง" },
    ]);
    // no goal → no goal item (the theme draws none); the roles stay
    expect(ids(worked).map((r) => r.id)).toEqual(["role:ROLE-001", "role:ROLE-002"]);
  });
});

describe("REQ-103: project-wide history, who, and the requirements page", () => {
  const entry = (extra: Partial<ApiProjectHistoryEntry>): ApiProjectHistoryEntry => ({
    at: "2026-10-29T05:00:00.000Z", by: "โด่ง", kind: "operator", entity: "WORK-001", op: "update", before: null, after: null, changeSetId: "cs-1", ...extra,
  });

  test("no part chosen + project entries → the whole project's rows with who, in the API's order; no part", () => {
    const rows = vm(buildHistory(worked, undefined, [], [
      entry({ kind: "label", op: "label", entity: "label:2", changeSetId: null, after: { version: 2, label: "v1 ทดลอง" } }),
      entry({ kind: "source_add", op: "source_add", entity: "source:s1", changeSetId: null, after: { name: "brief.txt", text: "…" } }),
      entry({ op: "update", entity: "DEC-001", after: { title: "ชื่อใหม่" } }),
    ]));
    expect(rows.part).toBeNull();
    expect(rows.entries.map((e) => [e.by, e.what, e.whatLabel, e.summary])).toEqual([
      ["โด่ง", "label", "ใส่ป้าย version", "v1 ทดลอง"],
      ["โด่ง", "source_add", "เพิ่มเอกสาร", "brief.txt"],
      ["โด่ง", "update", "แก้", "ชื่อใหม่"],
    ]);
  });

  test("every audit action has the PM's word (REQ-103 Q4), so the page never shows a raw code", () => {
    expect(["project_create", "settings", "source_add", "source_refetch", "label", "quiz_start", "quiz_ask", "quiz_mark"].map((k) => historyWhat[k])).toEqual([
      "สร้างโปรเจกต์", "เปลี่ยนการตั้งค่า", "เพิ่มเอกสาร", "ดึงลิงก์ใหม่", "ใส่ป้าย version", "เริ่ม quiz", "ถาม quiz", "ตรวจคำตอบ quiz",
    ]);
  });

  test("a settings row says what moved: field, before → after, no invented words", () => {
    expect(auditSummary("settings", { model: "tier:small", creativity: 0.7 }, { model: "tier:small", creativity: 1 })).toBe("creativity: 0.7 → 1");
    expect(auditSummary("settings", { model: "a", creativity: 1 }, { model: "b", creativity: 1 })).toBe("model: a → b");
    expect(auditSummary("label", null, { version: 3, label: null })).toBe("v3");
    expect(auditSummary("quiz_ask", null, { question: "?" })).toBe("");
  });

  test("an empty spec still shows the project-wide history when it has rows (sources and settings come first); with none it is empty", () => {
    const empty = { ...worked, parts: [], links: [], stuck: [] };
    expect(vm(buildHistory(empty, undefined, [], [entry({ kind: "project_create", op: "project_create", entity: "project", changeSetId: null, after: { name: "ใหม่" } })])).entries).toHaveLength(1);
    expect(buildHistory(empty).ok).toBe(false);
    expect(buildHistory(empty, undefined, [], []).ok).toBe(false);
  });

  test("a per-part row gains `by` (null on a row from before names)", () => {
    const rows = vm(buildHistory(worked, "DEC-001", [{ ...fixture<ApiHistoryEntry[]>("worked-history-DEC-001")[0]!, by: "โด่ง" }, fixture<ApiHistoryEntry[]>("worked-history-DEC-001")[0]!])).entries;
    expect(rows.map((e) => e.by)).toEqual(["โด่ง", null]);
  });

  test("requirements: only requirement parts, title + text; the page marks each title as required", () => {
    const withReq: ProjectData = {
      ...worked,
      parts: [...worked.parts, { key: "REQ-001", kind: "requirement", title: "ชำระเงินได้", body: { text: "ผู้ใช้ต้องจ่ายผ่านบัตรได้" }, origin: { stamp: "operator", date: "2026-10-29" } } as unknown as ProjectData["parts"][number]],
    };
    const v = vm(buildRequirements(withReq));
    expect(v.requirements).toEqual([{ key: "REQ-001", title: "ชำระเงินได้", text: "ผู้ใช้ต้องจ่ายผ่านบัตรได้" }]);
    expect(v.frame.page).toBe("requirements");
    expect(pageRequired("requirements", v)).toEqual([{ id: requiredId.part("REQ-001"), text: "ชำระเงินได้" }]);
    expect(vm(buildRequirements(worked)).requirements).toEqual([]); // no requirement yet: an empty list, not an empty-state page
  });
});

describe("REQ-103 rework: who, in words — a named row shows the name, not 'โดยคุณ' (Sober 13:5x)", () => {
  const row = (extra: Partial<ApiProjectHistoryEntry>): ApiProjectHistoryEntry => ({
    at: "2026-10-29T05:00:00.000Z", by: "โด่ง", kind: "operator", entity: "WORK-001", op: "update", before: null, after: null, changeSetId: "cs-1", ...extra,
  });
  const cause = (e: ApiProjectHistoryEntry) => vm(buildHistory(worked, undefined, [], [e])).entries[0]!;

  test("named operator row → the name stands in (cause word left out, `by` carries it)", () => {
    expect(cause(row({}))).toMatchObject({ by: "โด่ง", cause: "" });
    expect(cause(row({ kind: "label", op: "label", changeSetId: null }))).toMatchObject({ by: "โด่ง", cause: "" });
  });
  test("named chat row → keeps 'จากแชต' (how, not who); source and undo too", () => {
    expect(cause(row({ kind: "message" }))).toMatchObject({ by: "โด่ง", cause: "จากแชต" });
    expect(cause(row({ kind: "source" }))).toMatchObject({ cause: "จากเอกสาร" });
    expect(cause(row({ kind: "undo" }))).toMatchObject({ cause: "ย้อนการแก้ไข" });
  });
  test("a row from before names (by null) keeps 'โดยคุณ'", () => {
    expect(cause(row({ by: null }))).toMatchObject({ by: null, cause: "โดยคุณ" });
    expect(cause(row({ by: null, kind: "label", op: "label", changeSetId: null }))).toMatchObject({ cause: "โดยคุณ" });
  });
  test("per-part rows follow the same rule", () => {
    const base = fixture<ApiHistoryEntry[]>("worked-history-DEC-001")[0]!;
    const rows = vm(buildHistory(worked, "DEC-001", [{ ...base, cause: { kind: "operator" }, by: "โด่ง" }, { ...base, cause: { kind: "operator" } }, { ...base, cause: { kind: "message" }, by: "โด่ง" }])).entries;
    expect(rows.map((e) => e.cause)).toEqual(["", "โดยคุณ", "จากแชต"]);
  });
});

describe("REQ-103 AC-10: requirements on the overview (and so in the PDF, which prints the overview page)", () => {
  const withReqs: ProjectData = {
    ...worked,
    parts: [...worked.parts,
      { key: "REQ-001", kind: "requirement", title: "จองห้องได้", body: { text: "เลือกวันและเวลา" }, origin: { stamp: "operator", date: "2026-10-29" } } as unknown as ProjectData["parts"][number],
      { key: "REQ-002", kind: "requirement", title: "ยกเลิกได้", body: { text: "ก่อน 1 ชั่วโมง" }, origin: { stamp: "operator", date: "2026-10-29" } } as unknown as ProjectData["parts"][number],
    ],
  };
  test("the overview VM lists both requirements, in order; none → an empty list (no section)", () => {
    expect(vm(buildOverview(withReqs)).requirements).toEqual([
      { key: "REQ-001", title: "จองห้องได้", text: "เลือกวันและเวลา" },
      { key: "REQ-002", title: "ยกเลิกได้", text: "ก่อน 1 ชั่วโมง" },
    ]);
    expect(vm(buildOverview(worked)).requirements).toEqual([]);
  });
  test("the section's title and each requirement's title are required items — only when there are requirements", () => {
    const req = pageRequired("overview", vm(buildOverview(withReqs)));
    expect(req).toContainEqual({ id: requiredId.requirementsSection, text: "Requirements" });
    expect(req).toContainEqual({ id: requiredId.part("REQ-001"), text: "จองห้องได้" });
    expect(req).toContainEqual({ id: requiredId.part("REQ-002"), text: "ยกเลิกได้" });
    expect(pageRequired("overview", vm(buildOverview(worked))).some((r) => r.id === requiredId.requirementsSection)).toBe(false);
  });
});
