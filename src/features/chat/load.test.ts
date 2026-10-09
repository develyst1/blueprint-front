// The chat loader's mapping against fixture API responses (invented data, shaped as blueprint-back answers).
import { describe, expect, mock, spyOn, test } from "bun:test";
import type { ProjectData } from "@/core/model/build/types";
import {
  buildChatVM, chatRequired, lastChange, lastChangeSetId, toMessages, toModel, toPack, toSources, MESSAGES, PACK, type ApiMessage,
} from "./load";
import * as core from "@/core/words";
import * as chatWords from "./words";
import { acceptPack, botFailed, cawAsks } from "./words";

const origin = { stamp: "team-proposed" as const, date: "2026-10-09" };
const question = (key: string, extra: Record<string, unknown> = {}) => ({
  key, kind: "question" as const, title: `คำถาม ${key}`, createdIn: "cs-1", origin,
  body: { text: `คำถาม ${key}`, proposedAnswer: `คำตอบ ${key}`, cases: ["กรณีหนึ่ง"], status: "open", ...extra },
});
const data = (parts: ProjectData["parts"], links: ProjectData["links"] = []): ProjectData => ({
  project: { id: "p-1", organisationId: "o", name: "ทดลอง", createdAt: "2026-10-09T01:00:00.000Z", theme: "minimal-mono", model: "tier:small", creativity: 0.7 },
  parts, links, stuck: [],
});
const msg = (i: number, role: ApiMessage["role"], extra: Partial<ApiMessage> = {}): ApiMessage => ({
  id: `m-${i}`, role, content: `ข้อความ ${i}`, model: "tier:small", creativity: 0.7, roundStatus: null, changeSetId: null,
  createdAt: new Date(Date.UTC(2026, 9, 9, 1, 0, i)).toISOString(), ...extra,
});

describe("messages", () => {
  test("A-034: a park-only turn (empty user row + empty applied bot row) shows nothing; an accept-only turn still says ตามนั้น", () => {
    const out = toMessages([
      msg(1, "user", { content: "" }), msg(2, "bot", { content: "", roundStatus: "applied", changeSetId: "cs-park" }),
      msg(3, "user", { content: "" }), msg(4, "bot", { content: "รับทราบ", roundStatus: "applied", changeSetId: "cs-acc" }),
    ]);
    expect(out.map((m) => [m.id, m.text])).toEqual([["m-3", acceptPack], ["m-4", "รับทราบ"]]);
  });

  test("a pack-only turn says ตามนั้น; a failed bot says so; other empty rows are left out", () => {
    const out = toMessages([
      msg(1, "user", { content: "" }), msg(2, "bot", { content: "", roundStatus: "bot_could_not_answer" }), msg(3, "bot", { content: " ", roundStatus: "no_changes" }),
    ]);
    expect(out.map((m) => m.text)).toEqual([acceptPack, botFailed.message]);
  });

  test("newest 50, oldest first; caw wrapped in the REQ-004 words", () => {
    const rows = Array.from({ length: 60 }, (_, i) => msg(i, i % 2 ? "bot" : "user"));
    rows.push(msg(60, "caw", { content: "ขอเพิ่มขั้น" }));
    const out = toMessages(rows);
    expect(out).toHaveLength(MESSAGES);
    expect(out[0]!.id).toBe("m-11");
    expect(out.at(-1)!.text).toBe(cawAsks("ขอเพิ่มขั้น"));
    expect(out.at(-1)!.atLabel).toBe("9 ต.ค. 2569");
  });
});

describe("pack", () => {
  test("A-034: every open question, with or without a proposed answer, key order, at most 5", () => {
    const parts = [
      question("Q-010"), question("Q-002", { proposedAnswer: undefined }), question("Q-001"), question("Q-003", { status: "answered" }),
      question("Q-004", { proposedAnswer: " " }), question("Q-005", { status: "parked" }), question("Q-006"), question("Q-007"), question("Q-008"),
    ];
    const pack = toPack(data(parts), null);
    expect(pack.map((q) => [q.key, q.proposedAnswer])).toEqual([
      ["Q-001", "คำตอบ Q-001"], ["Q-002", null], ["Q-004", null], ["Q-006", "คำตอบ Q-006"], ["Q-007", "คำตอบ Q-007"],
    ]);
    expect(pack).toHaveLength(PACK);
    expect(pack[0]).toMatchObject({ text: "คำถาม Q-001", cases: ["กรณีหนึ่ง"], suggested: false });
  });

  test("A-034: suggested is true only for a proposed answer stamped team-proposed", () => {
    const pack = toPack(data([
      question("Q-001", { proposedAnswerStamp: "team-proposed" }), question("Q-002", { proposedAnswerStamp: "operator" }), question("Q-003"),
      question("Q-004", { proposedAnswer: undefined, proposedAnswerStamp: "team-proposed" }),
    ]), null);
    expect(pack.map((q) => [q.key, q.suggested])).toEqual([["Q-001", true], ["Q-002", false], ["Q-003", false], ["Q-004", false]]);
  });

  test("a focus question past the first five takes the last place (R7)", () => {
    const parts = ["Q-001", "Q-002", "Q-003", "Q-004", "Q-005", "Q-006", "Q-007"].map((k) => question(k));
    expect(toPack(data(parts), "Q-007").map((q) => q.key)).toEqual(["Q-001", "Q-002", "Q-003", "Q-004", "Q-007"]);
    expect(toPack(data(parts), "Q-002").map((q) => q.key)).toEqual(["Q-001", "Q-002", "Q-003", "Q-004", "Q-005"]);
    // a focus question without a proposed answer is kept too
    const mixed = [...parts.slice(0, 6), question("Q-007", { proposedAnswer: undefined })];
    expect(toPack(data(mixed), "Q-007").map((q) => [q.key, q.proposedAnswer])).toEqual([
      ["Q-001", "คำตอบ Q-001"], ["Q-002", "คำตอบ Q-002"], ["Q-003", "คำตอบ Q-003"], ["Q-004", "คำตอบ Q-004"], ["Q-007", null],
    ]);
  });

  test("about → the part's title", () => {
    const step = { key: "STEP-001", kind: "step" as const, title: "ขั้นแรก", createdIn: "cs-1", origin, body: {} };
    const link = { id: "l-1", kind: "about" as const, fromKey: "Q-001", toKey: "STEP-001", label: null, position: null, origin, createdIn: "cs-1" };
    expect(toPack(data([question("Q-001"), step], [link] as ProjectData["links"]), null)[0]!.about).toEqual([{ key: "STEP-001", title: "ขั้นแรก" }]);
  });
});

describe("last change", () => {
  test("the newest bot row that names a change set", () => {
    expect(lastChangeSetId([msg(1, "bot", { changeSetId: "cs-a" }), msg(2, "user"), msg(3, "bot")])).toBe("cs-a");
    expect(lastChangeSetId([msg(1, "user")])).toBeNull();
  });

  test("A-034: the counts and undoable come from the change-set route only; a failing route → null, never a partial count", async () => {
    const rows = [msg(1, "user"), msg(2, "bot", { changeSetId: "cs-a" })];
    const seen: string[] = [];
    const ok = spyOn(globalThis, "fetch").mockImplementation((async (url: string | URL | Request) => {
      seen.push(String(url));
      return Response.json({ id: "cs-a", at: "2026-10-09T01:00:00.000Z", cause: { kind: "message", ref: "m-1" },
        counts: { added: 3, updated: 1, removed: 2 }, entities: [], undoable: false });
    }) as typeof fetch);
    try {
      expect(await lastChange("p-1", rows)).toEqual({ changeSetId: "cs-a", added: 3, updated: 1, removed: 2, undoable: false });
      expect(seen).toHaveLength(1);
      expect(seen[0]).toEndWith("/v1/projects/p-1/change-sets/cs-a");
    } finally { ok.mockRestore(); }
    const down = spyOn(globalThis, "fetch").mockImplementation((async () => new Response("no", { status: 500 })) as unknown as typeof fetch);
    try {
      expect(await lastChange("p-1", rows)).toBeNull();
      expect(down).toHaveBeenCalledTimes(1); // no fallback reads (the history stub is gone)
    } finally { down.mockRestore(); }
    expect(await lastChange("p-1", [msg(1, "user")])).toBeNull();
  });
});

describe("sources and model", () => {
  test("pending never reaches the page", () => {
    expect(toSources([
      { id: "s1", name: "a.pdf", status: "read" }, { id: "s2", name: "b.pdf", status: "failed", reason: "unreadable_pdf" }, { id: "s3", name: "c", status: "pending" },
    ])).toEqual([
      { id: "s1", name: "a.pdf", state: "read", reason: null, note: null },
      { id: "s2", name: "b.pdf", state: "failed", reason: "unreadable_pdf", note: null },
    ]);
  });

  test("gateway list → choices; unavailable → null; the current one kept", () => {
    expect(toModel("tier:small", null)).toBeNull();
    const m = toModel("old/gone", { models: { prov: ["m1"] }, tiers: ["small", "medium", "flagship"] })!;
    expect(m.options.map((o) => o.value)).toEqual(["old/gone", "tier:small", "tier:medium", "tier:flagship", "prov/m1"]);
  });
});

test("buildChatVM: failed from the newest bot row, the nav marks แชต current (A-039), ดู spec → overview", () => {
  const vm = buildChatVM({
    data: data([question("Q-001")]), messages: [msg(1, "user"), msg(2, "bot", { roundStatus: "bot_could_not_answer", content: "" })],
    focus: null, change: null, sources: [], models: null,
  });
  expect(vm.failed).toBe(true);
  expect(vm.frame.nav.filter((n) => n.current).map((n) => [n.page, n.label])).toEqual([["chat", "แชต"]]);
  expect(vm.specHref).toBe("/p/p-1/overview");
  expect(vm.model).toBeNull();
  expect(vm.creativity).toBe(0.7);
});

describe("A-034 actions (fixture API; next/cache's refresh stubbed — no Next request here)", () => {
  mock.module("next/cache", () => ({ refresh: () => {} }));
  const project = (parts: ProjectData["parts"]) => ({ ...data(parts).project, parts, links: [] });
  const fakeApi = (parts: ProjectData["parts"], round = (): Response => Response.json({ status: "applied" })) => {
    const calls: { url: string; body: unknown }[] = [];
    const spy = spyOn(globalThis, "fetch").mockImplementation((async (url: string | URL | Request, init?: RequestInit) => {
      calls.push({ url: String(url), body: init?.body ? JSON.parse(String(init.body)) : null });
      return String(url).endsWith("/rounds") ? round() : Response.json(project(parts));
    }) as typeof fetch);
    return { calls, rounds: () => calls.filter((c) => c.url.endsWith("/rounds")), spy };
  };

  test("accept of a key without a proposed answer → invalid, no round call; with one → one round", async () => {
    const { acceptAction } = await import("./actions");
    const api = fakeApi([question("Q-001"), question("Q-002", { proposedAnswer: undefined })]);
    try {
      expect(await acceptAction("p-1", ["Q-001", "Q-002"])).toEqual({ ok: false, code: "invalid" });
      expect(api.rounds()).toHaveLength(0);
      expect(await acceptAction("p-1", ["Q-001"])).toEqual({ ok: true });
      expect(api.rounds().map((c) => c.body)).toEqual([{ accept: ["Q-001"] }]);
    } finally { api.spy.mockRestore(); }
  });

  test("answer and park post the Addendum A bodies; blank text → invalid, no call; a 400 → invalid", async () => {
    const { answerAction, parkAction } = await import("./actions");
    const api = fakeApi([question("Q-002", { proposedAnswer: undefined })]);
    try {
      expect(await answerAction("p-1", "Q-002", "  ผู้ดูแลห้องอนุมัติ  ")).toEqual({ ok: true });
      expect(await parkAction("p-1", "Q-002", " ยังไม่ต้อง ")).toEqual({ ok: true });
      expect(await parkAction("p-1", "Q-002")).toEqual({ ok: true });
      expect(await parkAction("p-1", "Q-002", "   ")).toEqual({ ok: true });
      expect(await answerAction("p-1", "Q-002", "   ")).toEqual({ ok: false, code: "invalid" });
      expect(api.rounds().map((c) => c.body)).toEqual([
        { answers: [{ key: "Q-002", text: "ผู้ดูแลห้องอนุมัติ" }] },
        { park: [{ key: "Q-002", reason: "ยังไม่ต้อง" }] }, { park: [{ key: "Q-002" }] }, { park: [{ key: "Q-002" }] },
      ]);
    } finally { api.spy.mockRestore(); }
    const bad = fakeApi([], () => Response.json({ error: { code: "validation", message: "x" } }, { status: 400 }));
    try {
      expect(await answerAction("p-1", "Q-002", "x")).toEqual({ ok: false, code: "invalid" });
    } finally { bad.spy.mockRestore(); }
  });

  test("A-037: ลองใหม่ posts { retry: true } — the bot is asked again for the same turn; 409 nothing_to_retry → invalid", async () => {
    const { retryAction } = await import("./actions");
    const api = fakeApi([]);
    try {
      expect(await retryAction("p-1")).toEqual({ ok: true });
      expect(api.calls.map((c) => [c.url.replace(/^.*\/v1/, "/v1"), c.body])).toEqual([["/v1/projects/p-1/rounds", { retry: true }]]);
    } finally { api.spy.mockRestore(); }
    const none = fakeApi([], () => Response.json({ error: { code: "nothing_to_retry", message: "x" } }, { status: 409 }));
    try {
      expect(await retryAction("p-1")).toEqual({ ok: false, code: "invalid" });
    } finally { none.spy.mockRestore(); }
  });
});

test("A-039: chatRequired lives in load.ts — each pack question's text, by part id", () => {
  const vm = buildChatVM({ data: data([question("Q-001"), question("Q-002", { proposedAnswer: undefined })]), messages: [], focus: null,
    change: null, sources: [], models: null });
  expect(chatRequired(vm).map((r) => r.text)).toEqual(["คำถาม Q-001", "คำถาม Q-002"]);
});

test("A-039: the D-020 words have one home — ours re-export the core's under the old names", () => {
  expect([chatWords.send, chatWords.enterHint, chatWords.chooseFile, chatWords.packName, chatWords.logName, chatWords.tryAgain, chatWords.navChat])
    .toEqual([core.chatSend, core.chatEnterHint, core.chatChooseFile, core.chatPack, core.chatLog, core.chatTryAgain, core.pageLabel.chat]);
  expect(chatWords.speaker).toBe(core.chatSpeaker);
  expect(chatWords.sourceReason).toBe(core.chatSourceReason);
  expect(chatWords.actionError).toBe(core.chatActionError);
  expect([chatWords.sourceFailed("unreadable_pdf"), chatWords.sourceFailed("weird"), chatWords.sourceFailed(null)])
    .toEqual(["อ่านไม่ได้ (เปิดไฟล์ PDF ไม่ได้)", "อ่านไม่ได้", "อ่านไม่ได้"]);
});
