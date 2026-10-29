// Screen ④'s loader mapping against fixture API responses (invented data, shaped as blueprint-back answers).
import { describe, expect, test } from "bun:test";
import type { ProjectData } from "@/core/model/build/types";
import { actionCode, buildReadyVM, gate, gateReasons, labelWarning, readyRequired, toQuiz, MAX_ANSWERED, QUIZ_ANCHOR, type ApiLabel, type ApiQuiz, type ApiQuizItem } from "./load";
import { readyRequiredId } from "./required";
import { build, emptyLabel, labelButton, labelPlaceholder, reasons, scoreEarly, warningBoth, warningQuiz, warningStuck } from "./words";

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
/** One entry of `GET …/labels` (REQ-103, SPEC-104): `label` null = an old confirmed version. */
const label = (version: number, text: string | null, labelledAt: string, by = "โด่ง"): ApiLabel => ({ version, label: text, labelledAt, by });
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
    expect(buildReadyVM({ data: data(), quiz: null, labels: [] }).quiz).toBeNull();
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

describe("summary, labels, build", () => {
  test("steps of the main work, counts by kind, stuck count and link", () => {
    const vm = buildReadyVM({ data: data([stuckItem("Q-1"), stuckItem("Q-2")]), quiz: null, labels: [] });
    expect(vm.steps.map((s) => [s.number, s.title])).toEqual([["01", "ขั้นแรก"], ["02", "ขั้นสอง"]]);
    expect(vm.counts).toEqual({ screens: 2, apis: 1, people: 1 });
    expect(vm.stuck).toEqual({ count: 2, href: "/p/p-1/stuck" });
    // this page's own nav entry is the current one (SPEC-B-001 v1.10, TASK-C-012 A1)
    expect(vm.frame.rooms.flatMap((r) => r.pages).filter((n) => n.current).map((n) => [n.page, n.href])).toEqual([["ready", "/p/p-1/ready"]]);
    // REQ-017: ④ sits in the front room, as its last page (SPEC-C-006 § 3)
    expect(vm.frame.rooms.filter((r) => r.current).map((r) => r.id)).toEqual(["front"]);
    expect(vm.frame.rooms[0]!.pages.filter((p) => p.current).map((p) => p.page)).toEqual(["ready"]);
  });

  test("labels keep the API's order (newest first), the typed text or v{n}, a Thai date and who", () => {
    const vm = buildReadyVM({
      data: data(), quiz: null,
      labels: [label(3, "v1 ทดลอง", "2026-10-09T03:00:00.000Z"), label(1, null, "2026-10-08T03:00:00.000Z", "operator")],
    });
    expect(vm.labels).toEqual([
      { version: 3, text: "v1 ทดลอง", dateLabel: "9 ต.ค. 2569", by: "โด่ง" },
      { version: 1, text: "v1", dateLabel: "8 ต.ค. 2569", by: "operator" },
    ]);
    expect(buildReadyVM({ data: data(), quiz: null, labels: [] }).labels).toEqual([]);
  });
});

describe("the warning before a label (REQ-103 § Wording, SPEC-104 Q1) — never a gate", () => {
  const complete = toQuiz(data(), quiz(marks(5)));
  test("stuck and quiz → both halves; stuck only; quiz only; neither → null", () => {
    expect(labelWarning(2, null)).toBe(warningBoth(2));
    expect(labelWarning(2, complete)).toBe(warningStuck(2));
    expect(labelWarning(0, null)).toBe(warningQuiz);
    expect(labelWarning(0, complete)).toBeNull();
  });
  test("a quiz is incomplete under 5 marks, with a wrong mark, or stale", () => {
    expect(labelWarning(0, toQuiz(data(), quiz(marks(4))))).toBe(warningQuiz);
    expect(labelWarning(0, toQuiz(data(), quiz(marks(5, 1))))).toBe(warningQuiz);
    expect(labelWarning(0, toQuiz(data(), quiz(marks(5), { stale: true })))).toBe(warningQuiz);
  });
  test("the words are REQ-103's, verbatim", () => {
    expect(warningBoth(3)).toBe("ยังมี 3 จุดค้าง และ quiz ยังไม่ครบ — ใส่ป้ายได้ แต่ spec อาจยังไม่พร้อม");
    expect(warningStuck(3)).toBe("ยังมี 3 จุดค้าง — ใส่ป้ายได้ แต่ spec อาจยังไม่พร้อม");
    expect(warningQuiz).toBe("quiz ยังไม่ครบ — ใส่ป้ายได้ แต่ spec อาจยังไม่พร้อม");
    expect(labelButton).toBe("ใส่ป้าย version");
    expect(labelPlaceholder).toBe("ตั้งชื่อป้าย เช่น v1 ทดลอง");
    expect(emptyLabel).toBe("ต้องตั้งชื่อป้ายก่อน");
  });
  test("the VM carries it, and the page must show it (a required item)", () => {
    const vm = buildReadyVM({ data: data([stuckItem("Q-1")]), quiz: null, labels: [] });
    expect(vm.warning).toBe(warningBoth(1));
    expect(readyRequired(vm).find((r) => r.id === readyRequiredId.warning)?.text).toBe(warningBoth(1));
    const clean = buildReadyVM({ data: data(), quiz: quiz(marks(5)), labels: [] });
    expect(clean.warning).toBeNull();
    expect(readyRequired(clean).some((r) => r.id === readyRequiredId.warning)).toBe(false);
  });
});

describe("build → CAW (REQ-103 AC-3, SPEC-104 Q2 — always on, D-050 for the href)", () => {
  const two = [label(2, "v2", "2026-10-09T03:00:00.000Z"), label(1, "v1", "2026-10-08T03:00:00.000Z")];
  const withEnv = (value: string | undefined, fn: () => void) => {
    const was = process.env.CAW_URL;
    if (value === undefined) delete process.env.CAW_URL;
    else process.env.CAW_URL = value;
    try { fn(); } finally { if (was === undefined) delete process.env.CAW_URL; else process.env.CAW_URL = was; }
  };

  test("(a) no label → still on; CAW's start page for this project, no version", () => withEnv(undefined, () => {
    expect(buildReadyVM({ data: data(), quiz: null, labels: [] }).build)
      .toEqual({ enabled: true, label: build, reason: "", href: "http://127.0.0.1:3500/start?project=p-1" });
  }));

  test("(b) with labels → the newest label's version", () => withEnv(undefined, () => {
    expect(buildReadyVM({ data: data(), quiz: null, labels: two }).build)
      .toEqual({ enabled: true, label: build, reason: "", href: "http://127.0.0.1:3500/start?project=p-1&version=2" });
  }));

  test("(c) on even with stuck items and an incomplete quiz", () => withEnv(undefined, () => {
    expect(buildReadyVM({ data: data([stuckItem("Q-1")]), quiz: null, labels: [] }).build.enabled).toBe(true);
  }));

  test("CAW_URL set → that base; an empty one falls back (|| not ??)", () => {
    withEnv("https://caw.example.test", () => {
      expect(buildReadyVM({ data: data(), quiz: null, labels: two }).build.href).toBe("https://caw.example.test/start?project=p-1&version=2");
    });
    withEnv("", () => {
      expect(buildReadyVM({ data: data(), quiz: null, labels: two }).build.href).toBe("http://127.0.0.1:3500/start?project=p-1&version=2");
    });
  });
});

describe("readyRequiredId (TASK-C-014 — moved to ./required, strings unchanged)", () => {
  test("the same id strings as before the move; the warning's is new (REQ-103)", () => {
    expect(readyRequiredId.reason("stuck")).toBe("ready:reason:stuck");
    expect(readyRequiredId.score).toBe("ready:score");
    expect(readyRequiredId.warning).toBe("ready:warning");
  });
});

describe("gate state `empty` (TASK-C-016, D-032) — the `confirmed` state went with the confirm button", () => {
  const empty = (): ProjectData => ({ ...data(), parts: [], links: [] });

  test("empty project → `empty` is the only reason, and it leads to the chat", () => {
    expect(gate(empty(), null)).toEqual({ reasons: [{ code: "empty", text: reasons.empty, href: "/p/p-1/chat" }] });
    // alone even when other reasons would apply (stuck, a quiz)
    const r = gate({ ...empty(), stuck: [stuckItem("Q-1")] }, toQuiz(data(), quiz(marks(3))));
    expect(r.reasons.map((x) => x.code)).toEqual(["empty"]);
    expect(buildReadyVM({ data: empty(), quiz: null, labels: [] }).gate.reasons.map((x) => x.code)).toEqual(["empty"]);
  });

  test("a clean project with a complete quiz has no reasons", () => {
    expect(gate(data(), toQuiz(data(), quiz(marks(5))))).toEqual({ reasons: [] });
    expect(gate(data([stuckItem("Q-1")]), toQuiz(data(), quiz(marks(5)))).reasons.map((x) => x.code)).toEqual(["stuck"]);
  });

  test("REQ-007's words, verbatim (lines 53–55)", () => {
    expect(scoreEarly(3)).toBe("ตรวจแล้ว 3 ข้อ · ต้องตรวจอย่างน้อย 5 ข้อ");
    expect(reasons.empty).toBe("ยังไม่มีข้อมูลในโปรเจกต์นี้ · เริ่มที่แชต");
    // the too-few reason uses the same verb as the early line (C-016 Q1, PM 2026-10-09, REQ-007 line 46)
    expect(reasons.tooFew).toBe("ต้องตรวจอย่างน้อย 5 ข้อ");
  });
});

describe("action codes (blueprint-back 4xx → the page's codes)", () => {
  const conflict = (code: string, details?: unknown) => ({ ok: false as const, status: 409, body: { error: { code, message: "", details } } });
  test("the existing quiz codes are unchanged", () => {
    expect(actionCode(conflict("quiz_stale"))).toBe("stale");
    expect(actionCode(conflict("quiz_missing"))).toBe("blocked");
    expect(actionCode({ ok: false, status: 0, body: null })).toBe("unreachable");
    expect(actionCode({ ok: false, status: 400, body: null })).toBe("invalid");
  });
  test("400 name_required → `name_required` (REQ-103 AC-6); the old confirm refusals are no longer a code", () => {
    expect(actionCode({ ok: false, status: 400, body: { error: { code: "name_required", message: "" } } })).toBe("name_required");
    expect(actionCode(conflict("already_confirmed", { version: 1 }))).toBe("invalid");
  });
});
