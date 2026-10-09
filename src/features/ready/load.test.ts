// Screen ④'s loader mapping against fixture API responses (invented data, shaped as blueprint-back answers).
import { describe, expect, test } from "bun:test";
import type { ProjectData } from "@/core/model/build/types";
import { actionCode, buildReadyVM, gate, gateReasons, toQuiz, MAX_ANSWERED, QUIZ_ANCHOR, type ApiQuiz, type ApiQuizItem, type ApiVersions } from "./load";
import { readyRequiredId } from "./required";
import { build, buildNotReady, reasons, scoreEarly } from "./words";

const origin = { stamp: "team-proposed" as const, date: "2026-10-09" };
const part = (key: string, kind: string, title = `ส่วน ${key}`) =>
  ({ key, kind, title, createdIn: "cs-1", origin, body: {} }) as ProjectData["parts"][number];
const link = (i: number, fromKey: string, toKey: string, kind = "has_step") =>
  ({ id: `l-${i}`, kind, fromKey, toKey, label: null, position: i, origin, createdIn: "cs-1" }) as ProjectData["links"][number];
const stuckItem = (key: string) => ({ kind: "open_question", key, title: `คำถาม ${key}` }) as ProjectData["stuck"][number];

const data = (stuck: ProjectData["stuck"] = []): ProjectData => ({
  project: { id: "p-1", organisationId: "o", name: "ทดลอง", createdAt: "2026-10-09T01:00:00.000Z", theme: "luxury-gold", model: "tier:small", creativity: 0.7 },
  parts: [
    part("WORK-001", "work", "งานหลัก"), part("STEP-001", "step", "ขั้นแรก"), part("STEP-002", "step", "ขั้นสอง"),
    part("SCR-001", "screen"), part("SCR-002", "screen"), part("API-001", "api"), part("ROLE-001", "role"),
  ],
  links: [link(1, "WORK-001", "STEP-001"), link(2, "WORK-001", "STEP-002")],
  stuck,
});
const item = (i: number, extra: Partial<ApiQuizItem> = {}): ApiQuizItem => ({
  id: `i-${i}`, position: i, question: `คำถามที่ ${i}`, status: "answered", answer: `คำตอบที่ ${i}`, notInSpec: false,
  parts: [], mark: null, note: null, questionKey: null, createdAt: "2026-10-09T02:00:00.000Z", ...extra,
});
const quiz = (items: ApiQuizItem[], extra: Partial<ApiQuiz> = {}): ApiQuiz => {
  const marked = items.filter((i) => i.mark).length;
  const right = items.filter((i) => i.mark === "right").length;
  return { id: "q-1", createdAt: "2026-10-09T02:00:00.000Z", stale: false, items, right, marked, score: marked >= 5 ? Math.floor((right * 100) / marked) : null, ...extra };
};
/** One entry of `GET …/versions` (the schema's VersionFeed item). */
const version = (n: number, confirmedAt: string): ApiVersions["versions"][number] => ({
  version: n, confirmedAt, confirmedBy: "operator", summary: { parts: 0, links: 0, partsByKind: {} }, changes: { added: [], changed: [], removed: [] },
});
const marks = (n: number, wrong = 0) => Array.from({ length: n }, (_, i) => item(i + 1, { mark: i < wrong ? "wrong" : "right" }));
const codes = (stuck: number, q: ApiQuiz | null) => gateReasons(stuck, toQuiz(data(), q), "/p/p-1/stuck").map((r) => r.code);

describe("gate reasons (SPEC-C-002 order)", () => {
  test("each reason on its own", () => {
    expect(codes(2, quiz(marks(5)))).toEqual(["stuck"]);
    expect(codes(0, null)).toEqual(["no_quiz"]);
    expect(codes(0, quiz(marks(4)))).toEqual(["too_few"]);
    expect(codes(0, quiz(marks(5, 1)))).toEqual(["not_100"]);
    expect(codes(0, quiz(marks(5), { stale: true }))).toEqual(["stale"]);
    expect(codes(0, quiz(marks(5)))).toEqual([]);
  });

  test("order: stuck → no_quiz → too_few / not_100 → stale", () => {
    expect(codes(1, null)).toEqual(["stuck", "no_quiz"]);
    expect(codes(1, quiz(marks(3), { stale: true }))).toEqual(["stuck", "too_few", "stale"]);
    expect(codes(1, quiz(marks(5, 1), { stale: true }))).toEqual(["stuck", "not_100", "stale"]);
  });

  test("texts are REQ-007's; stuck leads to the stuck page, the rest to #quiz", () => {
    const r = gateReasons(3, null, "/p/p-1/stuck");
    expect(r).toEqual([
      { code: "stuck", text: reasons.stuck(3), href: "/p/p-1/stuck" },
      { code: "no_quiz", text: reasons.noQuiz, href: QUIZ_ANCHOR },
    ]);
    expect(reasons.stuck(3)).toBe("ยังติดอยู่ 3 จุด");
  });
});

describe("quiz", () => {
  test("404 latest quiz → quiz null", () => {
    expect(buildReadyVM({ data: data(), quiz: null, versions: [] }).quiz).toBeNull();
  });

  test("full at 10 answered; failed items do not count", () => {
    expect(toQuiz(data(), quiz(Array.from({ length: MAX_ANSWERED - 1 }, (_, i) => item(i + 1))))!.full).toBe(false);
    expect(toQuiz(data(), quiz([...Array.from({ length: 9 }, (_, i) => item(i + 1)), item(10, { status: "failed", answer: null })]))!.full).toBe(false);
    expect(toQuiz(data(), quiz(Array.from({ length: MAX_ANSWERED }, (_, i) => item(i + 1))))!.full).toBe(true);
  });

  test("failed items pass through; notInSpec kept; items in position order", () => {
    const q = toQuiz(data(), quiz([item(2, { notInSpec: true }), item(1, { status: "failed", answer: null })]))!;
    expect(q.items.map((i) => [i.position, i.status, i.answer, i.notInSpec])).toEqual([[1, "failed", null, false], [2, "answered", "คำตอบที่ 2", true]]);
  });

  test("parts → titles + the web page href; an unknown key keeps the key", () => {
    const q = toQuiz(data(), quiz([item(1, { parts: ["STEP-001", "GONE-9"] })]))!;
    expect(q.items[0]!.parts).toEqual([
      { key: "STEP-001", title: "ขั้นแรก", href: "/p/p-1/web?part=STEP-001" },
      { key: "GONE-9", title: "GONE-9", href: "/p/p-1/web?part=GONE-9" },
    ]);
  });

  test("score straight from the API, never recomputed", () => {
    expect(toQuiz(data(), quiz(marks(5), { score: 42 }))!.score).toBe(42);
  });
});

describe("summary, version, build", () => {
  test("steps of the main work, counts by kind, stuck count and link", () => {
    const vm = buildReadyVM({ data: data([stuckItem("Q-1"), stuckItem("Q-2")]), quiz: null, versions: [] });
    expect(vm.steps.map((s) => [s.number, s.title])).toEqual([["01", "ขั้นแรก"], ["02", "ขั้นสอง"]]);
    expect(vm.counts).toEqual({ screens: 2, apis: 1, people: 1 });
    expect(vm.stuck).toEqual({ count: 2, href: "/p/p-1/stuck" });
    expect(vm.gate.ok).toBe(false);
    // this page's own nav entry is the current one (SPEC-B-001 v1.10, TASK-C-012 A1)
    expect(vm.frame.nav.filter((n) => n.current).map((n) => [n.page, n.href])).toEqual([["ready", "/p/p-1/ready"]]);
  });

  test("version = the last of `versions`, date by formatThaiDate; changedSince false until Team A's field", () => {
    const vm = buildReadyVM({
      data: data(), quiz: quiz(marks(5)),
      versions: [version(1, "2026-10-08T03:00:00.000Z"), version(2, "2026-10-09T03:00:00.000Z")],
    });
    expect(vm.version).toEqual({ n: 2, dateLabel: "9 ต.ค. 2569", changedSince: false });
    // clean and confirmed, nothing changed since: the gate's state is `confirmed` and Confirm is off (D-030)
    expect(vm.gate).toEqual({ ok: false, reasons: [{ code: "confirmed", text: reasons.confirmed(2), href: QUIZ_ANCHOR }] });
    expect(buildReadyVM({ data: data(), quiz: null, versions: [] }).version).toBeNull();
  });

  test("changedSince = the back end's changedSinceLatest when it sends it (TASK-A-032)", () => {
    const versions = [version(1, "2026-10-09T03:00:00.000Z")];
    expect(buildReadyVM({ data: data(), quiz: null, versions, changedSinceLatest: true }).version!.changedSince).toBe(true);
    expect(buildReadyVM({ data: data(), quiz: null, versions, changedSinceLatest: false }).version!.changedSince).toBe(false);
  });

  test("build is always off, with REQ-007's words", () => {
    expect(buildReadyVM({ data: data(), quiz: null, versions: [] }).build).toEqual({ enabled: false, label: build, reason: buildNotReady });
  });
});

describe("readyRequiredId (TASK-C-014 — moved to ./required, strings unchanged)", () => {
  test("the same id strings as before the move", () => {
    expect(readyRequiredId.reason("stuck")).toBe("ready:reason:stuck");
    expect(readyRequiredId.score).toBe("ready:score");
  });
});

describe("gate states `empty` and `confirmed` (TASK-C-016, D-030, D-032)", () => {
  const confirmedV1 = { n: 1, dateLabel: "9 ต.ค. 2569", changedSince: false };
  const empty = (): ProjectData => ({ ...data(), parts: [], links: [] });

  test("empty project → `empty` is the only reason, and it leads to the chat", () => {
    expect(gate(empty(), null, null)).toEqual({ ok: false, reasons: [{ code: "empty", text: reasons.empty, href: "/p/p-1/chat" }] });
    // alone even when other reasons would apply (stuck, a quiz, a version)
    const r = gate({ ...empty(), stuck: [stuckItem("Q-1")] }, toQuiz(data(), quiz(marks(3))), confirmedV1);
    expect(r.reasons.map((x) => x.code)).toEqual(["empty"]);
    expect(buildReadyVM({ data: empty(), quiz: null, versions: [] }).gate.reasons.map((x) => x.code)).toEqual(["empty"]);
  });

  test("confirmed + unchanged + nothing else blocks → `confirmed`, Confirm off; its link is the quiz that passed", () => {
    expect(gate(data(), toQuiz(data(), quiz(marks(5))), confirmedV1)).toEqual({
      ok: false, reasons: [{ code: "confirmed", text: reasons.confirmed(1), href: QUIZ_ANCHOR }],
    });
  });

  test("`confirmed` is gone once the spec changed, and never shown beside another reason", () => {
    const clean = toQuiz(data(), quiz(marks(5)));
    expect(gate(data(), clean, { ...confirmedV1, changedSince: true })).toEqual({ ok: true, reasons: [] });
    expect(gate(data(), toQuiz(data(), quiz(marks(5), { stale: true })), confirmedV1).reasons.map((x) => x.code)).toEqual(["stale"]);
    expect(gate(data([stuckItem("Q-1")]), clean, confirmedV1).reasons.map((x) => x.code)).toEqual(["stuck"]);
    expect(gate(data(), clean, null)).toEqual({ ok: true, reasons: [] });
  });

  test("REQ-007's new words, verbatim (lines 53–55)", () => {
    expect(scoreEarly(3)).toBe("ตรวจแล้ว 3 ข้อ · ต้องตรวจอย่างน้อย 5 ข้อ");
    expect(reasons.confirmed(1)).toBe("ยืนยันเวอร์ชัน 1 แล้ว · ยังไม่มีอะไรเปลี่ยน");
    expect(reasons.empty).toBe("ยังไม่มีข้อมูลในโปรเจกต์นี้ · เริ่มที่แชต");
    // the too-few reason uses the same verb as the early line (C-016 Q1, PM 2026-10-09, REQ-007 line 46)
    expect(reasons.tooFew).toBe("ต้องตรวจอย่างน้อย 5 ข้อ");
  });
});

describe("action codes (blueprint-back 409s → the page's codes)", () => {
  const conflict = (code: string, details?: unknown) => ({ ok: false as const, status: 409, body: { error: { code, message: "", details } } });
  test("409 already_confirmed {version} → `already_confirmed` (TASK-A-050)", () => {
    expect(actionCode(conflict("already_confirmed", { version: 1 }))).toBe("already_confirmed");
  });
  test("the existing codes are unchanged", () => {
    expect(actionCode(conflict("quiz_stale"))).toBe("stale");
    expect(actionCode(conflict("confirm_blocked"))).toBe("blocked");
    expect(actionCode({ ok: false, status: 0, body: null })).toBe("unreachable");
    expect(actionCode({ ok: false, status: 400, body: null })).toBe("invalid");
  });
});
