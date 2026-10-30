// The chat loader's mapping against fixture API responses (invented data, shaped as blueprint-back answers).
import { describe, expect, mock, spyOn, test } from "bun:test";
import type { ProjectData } from "@/core/model/build/types";
import {
  buildChatVM, chatRequired, lastChange, lastChangeSetId, adjustedLines, refusedCount, refusedLines, rejectedText, toMessages, toModel, toPack, toSources, MESSAGES, PACK, type ApiMessage,
} from "./load";
import * as core from "@/core/words";
import { isTooLarge, MAX_UPLOAD_BYTES } from "./limits";
import * as chatWords from "./words";
import { acceptPack, botFailed, cawAsks, fieldDropped, modelTimeout, refusedMore, refusedReason, rejectReason, roundRejected, savedHeader, tierLabel } from "./words";

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

test("A-053: each message carries its round's changeSetId — the bot row of the set, null elsewhere; it matches lastChange", () => {
  const rows = [
    msg(1, "user", { content: "เพิ่มขั้นแจ้งเตือน" }),
    msg(2, "bot", { content: "เพิ่มให้แล้ว", roundStatus: "applied", changeSetId: "cs-a" }),
    msg(3, "user", { content: "ขอบคุณ" }),
    msg(4, "bot", { content: "ยินดีครับ", roundStatus: "no_changes", changeSetId: null }),
    msg(5, "caw", { content: "ขอแก้ขั้นที่ 2" }),
  ];
  expect(toMessages(rows).map((m) => [m.id, m.role, m.changeSetId])).toEqual([
    ["m-1", "user", null], ["m-2", "bot", "cs-a"], ["m-3", "user", null], ["m-4", "bot", null], ["m-5", "caw", null],
  ]);
  const lastId = lastChangeSetId(rows);
  expect(toMessages(rows).filter((m) => m.changeSetId === lastId).map((m) => m.id)).toEqual(["m-2"]);
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

  test("A-056 row 13 (D-035): the three tiers read เร็ว · สมดุล · เก่งที่สุด; provider/model ids stay as they are", () => {
    expect(tierLabel).toEqual({ small: "เร็ว", medium: "สมดุล", flagship: "เก่งที่สุด" });
    const m = toModel("tier:medium", { models: { openai: ["gpt-4.1-mini"] }, tiers: ["small", "medium", "flagship"] })!;
    expect(m.options.map((o) => [o.value, o.label])).toEqual([
      ["tier:small", "เร็ว"], ["tier:medium", "สมดุล"], ["tier:flagship", "เก่งที่สุด"], ["openai/gpt-4.1-mini", "openai/gpt-4.1-mini"],
    ]);
    // a current tier the list no longer holds is still worded; a tier the words do not know keeps the gateway's own name
    expect(toModel("tier:small", { models: {}, tiers: ["medium"] })!.options[0]).toEqual({ value: "tier:small", label: "เร็ว" });
    expect(toModel("tier:huge", { models: {}, tiers: ["huge"] })!.options.map((o) => o.label)).toEqual(["huge"]);
  });
});

test("A-056 row 7: when the bot failed, the newest failed bot row is left out (the alert says it); older ones stay; not failed → all rows", () => {
  const input = (messages: ApiMessage[]) => buildChatVM({ data: data([question("Q-001")]), messages, focus: null, change: null, sources: [], models: null });
  const rows = [
    msg(1, "user"), msg(2, "bot", { content: "", roundStatus: "bot_could_not_answer" }), // an older failure, already retried
    msg(3, "user"), msg(4, "bot", { content: "ตอบแล้ว", roundStatus: "no_changes" }),
    msg(5, "user"), msg(6, "bot", { content: "", roundStatus: "bot_could_not_answer" }), // the newest bot row: failed
  ];
  const failed = input(rows);
  expect(failed.failed).toBe(true);
  expect(failed.messages.map((m) => m.id)).toEqual(["m-1", "m-2", "m-3", "m-4", "m-5"]);
  expect(failed.messages.find((m) => m.id === "m-2")!.text).toBe(botFailed.message);
  const ok = input(rows.slice(0, 4));
  expect(ok.failed).toBe(false);
  expect(ok.messages.map((m) => m.id)).toEqual(["m-1", "m-2", "m-3", "m-4"]);
  // a failed row that is not the newest bot row (the bot answered since) is not "the" failure
  expect(input([...rows.slice(0, 2), msg(3, "user"), msg(4, "bot", { content: "ตอบแล้ว", roundStatus: "applied", changeSetId: "cs-a" })]).messages.map((m) => m.id))
    .toEqual(["m-1", "m-2", "m-3", "m-4"]);
});

test("buildChatVM: failed from the newest bot row, แชต is current — no room page is (A-039), ดู spec → overview", () => {
  const vm = buildChatVM({
    data: data([question("Q-001")]), messages: [msg(1, "user"), msg(2, "bot", { roundStatus: "bot_could_not_answer", content: "" })],
    focus: null, change: null, sources: [], models: null,
  });
  expect(vm.failed).toBe(true);
  expect(vm.frame.rooms.flatMap((r) => r.pages).filter((n) => n.current)).toEqual([]); // the chat is in no room
  expect(vm.frame.chatHref).toBe("/p/p-1/chat");
  // REQ-017: the chat is not a room; its frame keeps the front room current (SPEC-C-006 § 3)
  expect(vm.frame.rooms.filter((r) => r.current).map((r) => r.id)).toEqual(["front"]);
  expect(vm.frame.chatHref).toBe("/p/p-1/chat");
  expect(vm.specHref).toBe("/p/p-1/overview");
  expect(vm.model).toBeNull();
  expect(vm.creativity).toBe(0.7);
});

describe("A-034 actions (fixture API; next/cache's refresh stubbed — no Next request here)", () => {
  mock.module("next/cache", () => ({ refresh: () => {} }));
  // the typed name (REQ-103): the `bp_by` cookie as Next would hand it over; null = none typed yet
  let typed: string | null = "โด่ง";
  mock.module("next/headers", () => ({ cookies: async () => ({ get: (n: string) => (n === "bp_by" && typed !== null ? { value: typed } : undefined) }) }));
  const project = (parts: ProjectData["parts"]) => ({ ...data(parts).project, parts, links: [] });
  const fakeApi = (parts: ProjectData["parts"], round = (): Response => Response.json({ status: "applied" })) => {
    const calls: { url: string; body: unknown; by: string | null }[] = [];
    const spy = spyOn(globalThis, "fetch").mockImplementation((async (url: string | URL | Request, init?: RequestInit) => {
      const by = new Headers(init?.headers).get("x-blueprint-by");
      calls.push({ url: String(url), body: typeof init?.body === "string" ? JSON.parse(init.body) : null, by }); // a multipart body (FormData) has no JSON form
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

  test("A-060: uploadAction refuses a file over 20 000 000 bytes before any request — too_large; one at the limit goes through", async () => {
    const { uploadAction } = await import("./actions");
    const api = fakeApi([]);
    const form = (bytes: number) => { const f = new FormData(); f.set("file", new File([new Uint8Array(bytes)], "big.pdf", { type: "application/pdf" })); f.set("origin", "operator"); return f; };
    try {
      expect(await uploadAction("p-1", form(20_000_001))).toEqual({ ok: false, code: "too_large" });
      expect(api.calls).toHaveLength(0);
      expect(await uploadAction("p-1", form(20_000_000))).toEqual({ ok: true });
      expect(api.calls.map((c) => c.url.replace(/^.*\/v1/, "/v1"))).toEqual(["/v1/projects/p-1/sources"]);
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

describe("A-060 contradictions in the chat VM (TEST-A-005 DEF-2)", () => {
  const part = (key: string, kind: "decision" | "step", title: string) => ({ key, kind, title, createdIn: "cs-1", origin, body: {} });
  const withStuck = (stuck: ProjectData["stuck"], parts: ProjectData["parts"]) => ({ ...data(parts), stuck });
  const vmOf = (d: ProjectData) => buildChatVM({ data: d, messages: [], focus: null, change: null, sources: [], models: null });
  const con = (key: string, between?: string[]) => ({ kind: "contradiction" as const, key, title: `ข้อตัดสินใจขัดกับขั้นตอน ${key}`, ...(between ? { between } : {}) });

  test("a contradiction between two parts is worded with their titles, in the API's order; other stuck kinds are not here", () => {
    const parts = [part("DEC-001", "decision", "ห้องใหญ่ต้องอนุมัติ"), part("STEP-001", "step", "ส่งคำขอจอง")];
    const vm = vmOf(withStuck([
      { kind: "open_question", key: "Q-001", title: "คำถาม" }, con("CON-002", ["DEC-001", "STEP-001"]), con("CON-001", ["STEP-001", "DEC-001"]),
    ], parts));
    expect(vm.contradictions).toEqual([
      { key: "CON-002", text: "สองส่วนนี้ขัดกัน: ห้องใหญ่ต้องอนุมัติ กับ ส่งคำขอจอง" },
      { key: "CON-001", text: "สองส่วนนี้ขัดกัน: ส่งคำขอจอง กับ ห้องใหญ่ต้องอนุมัติ" },
    ]);
  });

  test("a side that is not a part reads as the item's own title; fewer than two sides → the item's title; never a raw key; none → []", () => {
    const parts = [part("DEC-001", "decision", "ห้องใหญ่ต้องอนุมัติ")];
    const out = vmOf(withStuck([con("CON-001", ["DEC-001", "STEP-404"]), con("CON-002", ["DEC-001"]), con("CON-003"), con("CON-004", ["STEP-404", "STEP-405"])], parts)).contradictions;
    expect(out).toEqual([
      { key: "CON-001", text: "สองส่วนนี้ขัดกัน: ห้องใหญ่ต้องอนุมัติ กับ ข้อตัดสินใจขัดกับขั้นตอน CON-001" },
      { key: "CON-002", text: "ข้อตัดสินใจขัดกับขั้นตอน CON-002" },
      { key: "CON-003", text: "ข้อตัดสินใจขัดกับขั้นตอน CON-003" },
      { key: "CON-004", text: "สองส่วนนี้ขัดกัน: ข้อตัดสินใจขัดกับขั้นตอน CON-004 กับ ข้อตัดสินใจขัดกับขั้นตอน CON-004" },
    ]);
    // nothing on screen reads like a part key (DEC-… / STEP-… / the item's own CON-…) except what a title itself says
    for (const c of out.slice(0, 3)) expect(c.text.replace(/ข้อตัดสินใจขัดกับขั้นตอน CON-00\d/g, "")).not.toMatch(/\b(DEC|STEP|CON)-\d+/);
    expect(vmOf(withStuck([], parts)).contradictions).toEqual([]);
  });
});

describe("A-060 the 20 MB guard (TEST-A-005 DEF-1) — one limit, shared with the back end", () => {
  test("the limit is the back end's 20 000 000 bytes; exactly at it is allowed, one over is not", () => {
    expect(MAX_UPLOAD_BYTES).toBe(20_000_000);
    expect(isTooLarge({ size: 20_000_000 } as File)).toBe(false);
    expect(isTooLarge({ size: 20_000_001 } as File)).toBe(true);
    expect(isTooLarge({ size: 22_020_105 } as File)).toBe(true);
    expect(isTooLarge({ size: 0 } as File)).toBe(false);
  });
});

test("A-060 (A-056 follow-up): an inherited object key is not a tier word; toModel's own words are exactly the three", () => {
  const m = toModel("tier:small", { models: {}, tiers: ["toString", "constructor", "small"] })!;
  expect(m.options.map((o) => o.label)).toEqual(["toString", "constructor", "เร็ว"]);
});

test("A-060: contradiction's one home is the core's — ours re-exports it", () => {
  expect(chatWords.contradiction).toBe(core.contradiction);
  expect(chatWords.contradiction("ก", "ข")).toBe("สองส่วนนี้ขัดกัน: ก กับ ข");
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

describe("REQ-103: every chat write carries the typed name, or is refused before any call (AC-6)", () => {
  mock.module("next/cache", () => ({ refresh: () => {} }));
  let typed: string | null = "โด่ง";
  mock.module("next/headers", () => ({ cookies: async () => ({ get: (n: string) => (n === "bp_by" && typed !== null ? { value: typed } : undefined) }) }));
  const record = () => {
    const calls: { url: string; method: string; by: string | null }[] = [];
    const spy = spyOn(globalThis, "fetch").mockImplementation((async (url: string | URL | Request, init?: RequestInit) => {
      calls.push({ url: String(url), method: init?.method ?? "GET", by: new Headers(init?.headers).get("x-blueprint-by") });
      return Response.json({ status: "applied" });
    }) as typeof fetch);
    return { calls, spy };
  };

  test("a name → X-Blueprint-By is the percent-encoded name on the write", async () => {
    const { sendAction } = await import("./actions");
    typed = "โด่ง";
    const r = record();
    try {
      expect(await sendAction("p-1", "สวัสดี")).toEqual({ ok: true });
      expect(r.calls).toHaveLength(1);
      expect(r.calls[0]!.by).toBe(encodeURIComponent("โด่ง"));
      expect(decodeURIComponent(r.calls[0]!.by!)).toBe("โด่ง");
    } finally { r.spy.mockRestore(); }
  });

  test("no name → name_required, and nothing is sent — for a round, a setting, an undo and an upload alike", async () => {
    const { sendAction, setModelAction, setCreativityAction, undoAction, retryAction } = await import("./actions");
    typed = null;
    const r = record();
    try {
      const refused = { ok: false as const, code: "name_required" as const };
      expect(await sendAction("p-1", "สวัสดี")).toEqual(refused);
      expect(await setModelAction("p-1", "tier:small")).toEqual(refused);
      expect(await setCreativityAction("p-1", 0.5)).toEqual(refused);
      expect(await undoAction("p-1", "cs-1")).toEqual(refused);
      expect(await retryAction("p-1")).toEqual(refused);
      expect(r.calls).toHaveLength(0);
    } finally { r.spy.mockRestore(); typed = "โด่ง"; }
  });

  test("a back-end 400 name_required maps to the same code", async () => {
    const { sendAction } = await import("./actions");
    typed = "โด่ง";
    const spy = spyOn(globalThis, "fetch").mockImplementation((async () => Response.json({ error: { code: "name_required", message: "type your name first" } }, { status: 400 })) as unknown as typeof fetch);
    try {
      expect(await sendAction("p-1", "สวัสดี")).toEqual({ ok: false, code: "name_required" });
    } finally { spy.mockRestore(); }
  });
});

describe("REQ-110: a rejected round and a timeout say so, in the PM's words (SPEC-105 § Front)", () => {
  const bot = (i: number, extra: Partial<ApiMessage>) => msg(i, "bot", { content: "", ...extra });
  const textOf = (m: ApiMessage) => toMessages([msg(0, "user", { content: "เพิ่ม feature" }), m]).at(-1)?.text;
  const chat = (messages: ApiMessage[]) => buildChatVM({ data: data([question("Q-001")]), messages, focus: null, change: null, sources: [], models: null });

  test("the words are verbatim (REQ-110 § Wording, SPEC-105 Q2)", () => {
    expect(roundRejected("X")).toBe("รอบนี้ยังไม่ได้บันทึกอะไรเลย — X ลองพิมพ์ใหม่หรือแก้ตามนี้ได้ครับ");
    expect(rejectReason.unknown_kind("feature")).toBe("AI เสนอข้อมูลแบบ “feature” ที่ Blueprint ยังไม่รองรับ");
    expect(rejectReason.needs_user_words).toBe("การแก้หรือลบสิ่งที่คุณพูดไว้เองต้องใช้คำของคุณ");
    expect(rejectReason.invalid_change).toBe("ข้อเสนอของ AI ไม่ผ่านการตรวจของระบบ");
    expect(rejectReason.protocol).toBe("AI ตอบกลับมาในรูปแบบที่ระบบอ่านไม่ได้");
    expect(modelTimeout).toBe("AI ตอบไม่ทันเวลา — ยังไม่ได้บันทึกอะไร ลองใหม่ หรือเปลี่ยนเป็นรุ่นที่เร็วกว่า");
  });

  test("rejected + unknown_kind + a note → the sentence naming the kind", () => {
    expect(textOf(bot(1, { roundStatus: "changes_rejected", roundReason: "unknown_kind", roundNote: "feature" })))
      .toBe("รอบนี้ยังไม่ได้บันทึกอะไรเลย — AI เสนอข้อมูลแบบ “feature” ที่ Blueprint ยังไม่รองรับ ลองพิมพ์ใหม่หรือแก้ตามนี้ได้ครับ");
  });

  test("rejected + each other code → its own reason inside the same sentence", () => {
    for (const code of ["needs_user_words", "invalid_change", "protocol"] as const) {
      expect(textOf(bot(1, { roundStatus: "changes_rejected", roundReason: code, roundNote: null }))).toBe(roundRejected(rejectReason[code]));
    }
  });

  test("a rejected row's own content is never shown, and the sentence claims no change was made", () => {
    const t = textOf(bot(1, { content: "เพิ่ม feature ให้แล้วครับ", roundStatus: "changes_rejected", roundReason: "invalid_change" }));
    expect(t).toBe(roundRejected(rejectReason.invalid_change));
    expect(t).not.toContain("ให้แล้ว");
  });

  test("a null or unknown reason → as before this TASK (no sentence: the empty row is left out)", () => {
    expect(rejectedText(null, null)).toBeNull();
    expect(rejectedText("something_new", null)).toBeNull();
    expect(rejectedText("unknown_kind", null)).toBeNull(); // no kind to name
    expect(toMessages([bot(1, { roundStatus: "changes_rejected", roundReason: null })])).toEqual([]);
    expect(textOf(bot(1, { roundStatus: "bot_could_not_answer", roundReason: null }))).toBe(botFailed.message);
    expect(textOf(bot(1, { roundStatus: "bot_could_not_answer" }))).toBe(botFailed.message); // an older back end sends no field
  });

  test("timeout → the timeout sentence, kept on the page beside the failed alert (retry + change model); other reasons keep the old behaviour", () => {
    const timedOut = [msg(1, "user", { content: "ถาม" }), bot(2, { roundStatus: "bot_could_not_answer", roundReason: "timeout" })];
    const vm = chat(timedOut);
    expect(vm.failed).toBe(true);
    expect(vm.messages.map((m) => m.text)).toEqual(["ถาม", modelTimeout]);
    // any other reason: the alert says it, the newest failed row is not shown twice — as before
    const other = chat([msg(1, "user", { content: "ถาม" }), bot(2, { roundStatus: "bot_could_not_answer", roundReason: "gateway_error" })]);
    expect(other.failed).toBe(true);
    expect(other.messages.map((m) => m.text)).toEqual(["ถาม"]);
  });

  test("a rejected round is not a failed bot: no alert, the sentence shows as the bot's line", () => {
    const vm = chat([msg(1, "user", { content: "เพิ่ม feature" }), bot(2, { roundStatus: "changes_rejected", roundReason: "unknown_kind", roundNote: "feature" })]);
    expect(vm.failed).toBe(false);
    expect(vm.messages.at(-1)).toMatchObject({ role: "bot", text: roundRejected(rejectReason.unknown_kind("feature")) });
  });
});

describe("REQ-110 round 2: 'saved n, not saved m' and one line per refused item (SPEC-105 E5c, E6; Q4 defaults)", () => {
  const refused = (extra: Partial<NonNullable<ApiMessage["roundRefused"]>[number]>) => ({ item: "changes[1]", op: "part.add", kind: "step", ref: "$s", key: null, title: "ส่งอีเมล", reason: "invalid_change", detail: "x", ...extra });
  const bot = (i: number, extra: Partial<ApiMessage>) => msg(i, "bot", { content: "เพิ่มให้ครบแล้วครับ", roundStatus: "applied", changeSetId: "cs-1", ...extra });
  const text = (m: ApiMessage, saved?: number | null) => toMessages([msg(0, "user", { content: "เพิ่ม 5 ขั้น" }), { ...m, ...(saved === undefined ? {} : { roundSaved: saved }) }]).at(-1)?.text;

  test("the Q4 words are verbatim", () => {
    expect(savedHeader(4, 1)).toBe("บันทึกแล้ว 4 รายการ — ยังไม่ได้บันทึก 1 รายการ:");
    expect(refusedReason.invalid_change).toBe("ข้อมูลไม่ครบหรือไม่ถูกรูปแบบ");
    expect(refusedReason.depends_on_refused).toBe("ผูกกับรายการที่ไม่ได้บันทึก");
    expect(refusedReason.unknown_kind("feature")).toBe("AI เสนอข้อมูลแบบ “feature” ที่ Blueprint ยังไม่รองรับ");
    expect(refusedMore(7)).toBe("และอีก 7 รายการ");
  });

  test("applied + 1 refused → the header, then the item line; the model's own text is not shown", () => {
    const t = text(bot(1, { roundRefused: [refused({})] }), 4)!;
    expect(t).toBe("บันทึกแล้ว 4 รายการ — ยังไม่ได้บันทึก 1 รายการ:\nส่งอีเมล — ข้อมูลไม่ครบหรือไม่ถูกรูปแบบ");
    expect(t).not.toContain("เพิ่มให้ครบแล้ว");
  });

  test("the item's name is its title, else its key, else its ref, else the item path; each reason has its word", () => {
    const lines = refusedLines([
      refused({ title: null, key: "STEP-004" }), refused({ title: null, key: null, ref: "$s2" }), refused({ title: null, key: null, ref: null, item: "links[0]" }),
      refused({ title: "ค", reason: "unknown_kind", kind: "feature" }), refused({ title: "ง", reason: "needs_user_words" }), refused({ title: "จ", reason: "depends_on_refused" }),
    ]);
    expect(lines).toEqual([
      "STEP-004 — ข้อมูลไม่ครบหรือไม่ถูกรูปแบบ", "$s2 — ข้อมูลไม่ครบหรือไม่ถูกรูปแบบ", "links[0] — ข้อมูลไม่ครบหรือไม่ถูกรูปแบบ",
      "ค — AI เสนอข้อมูลแบบ “feature” ที่ Blueprint ยังไม่รองรับ", "ง — การแก้หรือลบสิ่งที่คุณพูดไว้เองต้องใช้คำของคุณ", "จ — ผูกกับรายการที่ไม่ได้บันทึก",
    ]);
  });

  test("rejected + a list → the accepted 'nothing saved' sentence, then the same lines", () => {
    const m = bot(1, { content: "", roundStatus: "changes_rejected", changeSetId: null, roundReason: "invalid_change", roundNote: null, roundRefused: [refused({ title: "ก" }), refused({ title: "ข", reason: "depends_on_refused" })] });
    expect(text(m)).toBe([roundRejected(rejectReason.invalid_change), "ก — ข้อมูลไม่ครบหรือไม่ถูกรูปแบบ", "ข — ผูกกับรายการที่ไม่ได้บันทึก"].join("\n"));
  });

  test("past 50: the 'more' element becomes 'and n more'; m counts it", () => {
    const list = [...Array.from({ length: 50 }, (_, i) => refused({ title: `รายการ ${i}` })), { item: "more", count: 3 }];
    const lines = refusedLines(list);
    expect(lines).toHaveLength(51);
    expect(lines.at(-1)).toBe("และอีก 3 รายการ");
    expect(refusedCount(list)).toBe(53);
    expect(text(bot(1, { roundRefused: list }), 10)!.split("\n")[0]).toBe(savedHeader(10, 53));
  });

  test("null and [] → exactly as today (the model's reply, a failed or accepted row unchanged)", () => {
    expect(text(bot(1, { roundRefused: null }))).toBe("เพิ่มให้ครบแล้วครับ");
    expect(text(bot(1, { roundRefused: [] }))).toBe("เพิ่มให้ครบแล้วครับ");
    expect(text(bot(1, {}))).toBe("เพิ่มให้ครบแล้วครับ"); // an older back end sends no field
  });

  test("n unknown (roundSaved missing, an older back end) → the list alone, no guessed header", () => {
    expect(text(bot(1, { roundRefused: [refused({})] }))).toBe("ส่งอีเมล — ข้อมูลไม่ครบหรือไม่ถูกรูปแบบ");
  });

  test("n = the row's `roundSaved` (model items applied); 0 is a real count; null or missing → the list alone", () => {
    expect(text(bot(1, { roundRefused: [refused({})] }), 0)).toBe("บันทึกแล้ว 0 รายการ — ยังไม่ได้บันทึก 1 รายการ:\nส่งอีเมล — ข้อมูลไม่ครบหรือไม่ถูกรูปแบบ");
    expect(text(bot(1, { roundRefused: [refused({})] }), null)).toBe("ส่งอีเมล — ข้อมูลไม่ครบหรือไม่ถูกรูปแบบ");
  });
});

describe("REQ-110 round 3: 'saved, but field X left out' from roundAdjusted (SPEC-105 E9, Q5 default)", () => {
  const dropped = (extra: Partial<NonNullable<ApiMessage["roundAdjusted"]>[number]> = {}) => ({ item: "changes[2]", what: "field_dropped", field: "open", title: "กฎการจอง", key: null, ref: "$d", ...extra });
  const bot = (extra: Partial<ApiMessage>) => msg(1, "bot", { content: "เพิ่มกฎให้แล้วครับ", roundStatus: "applied", changeSetId: "cs-1", ...extra });
  const text = (m: ApiMessage) => toMessages([msg(0, "user", { content: "เพิ่มกฎ" }), m]).at(-1)?.text;

  test("the word is the Q5 default, verbatim", () => {
    expect(fieldDropped("กฎการจอง", "open")).toBe("กฎการจอง — บันทึกแล้ว แต่ตัดช่อง open ออก");
  });

  test("a field_dropped entry → its line under the row's text (nothing refused: the model's reply stays)", () => {
    expect(text(bot({ roundAdjusted: [dropped()] }))).toBe("เพิ่มกฎให้แล้วครับ\nกฎการจอง — บันทึกแล้ว แต่ตัดช่อง open ออก");
  });

  test("under the saved/not-saved lines when something was refused too", () => {
    const refused = [{ item: "changes[4]", reason: "invalid_change", title: "แจ้งเตือน" }];
    expect(text(bot({ roundRefused: refused, roundSaved: 3, roundAdjusted: [dropped()] })))
      .toBe("บันทึกแล้ว 3 รายการ — ยังไม่ได้บันทึก 1 รายการ:\nแจ้งเตือน — ข้อมูลไม่ครบหรือไม่ถูกรูปแบบ\nกฎการจอง — บันทึกแล้ว แต่ตัดช่อง open ออก");
  });

  test("one line per dropped field; the name falls back title → key → ref → item", () => {
    expect(adjustedLines([dropped({ field: "open" }), dropped({ field: "cases", title: null, key: "DEC-004" }), dropped({ title: null, key: null, ref: null, item: "changes[7]", field: "x" })]))
      .toEqual(["กฎการจอง — บันทึกแล้ว แต่ตัดช่อง open ออก", "DEC-004 — บันทึกแล้ว แต่ตัดช่อง cases ออก", "changes[7] — บันทึกแล้ว แต่ตัดช่อง x ออก"]);
  });

  test("ref_renamed / body_defaulted / wrapped_in_list / more → no line", () => {
    const quiet = [{ item: "changes[0]", what: "ref_renamed", from: "$a-b", to: "$a_b" }, { item: "changes[1]", what: "body_defaulted" }, { item: "changes[2]", what: "wrapped_in_list", field: "cases" }, { item: "more", count: 3 }];
    expect(adjustedLines(quiet)).toEqual([]);
    expect(text(bot({ roundAdjusted: quiet }))).toBe("เพิ่มกฎให้แล้วครับ");
  });

  test("op_renamed only (REQ-110 round 4, TASK-130) → no extra line, same text as with no adjustments", () => {
    const only = [{ item: "changes[0]", what: "op_renamed" }, { item: "changes[1]", what: "op_renamed" }];
    expect(adjustedLines(only)).toEqual([]);
    expect(text(bot({ roundAdjusted: only }))).toBe(text(bot({ roundAdjusted: null })));
  });

  test("roundRaw is never in the text", () => {
    const m = { ...bot({ roundAdjusted: [dropped()] }), roundRaw: "SECRET-UNREADABLE-REPLY {not json" } as ApiMessage;
    expect(text(m)).not.toContain("SECRET-UNREADABLE-REPLY");
    expect(text({ ...m, roundAdjusted: null })).not.toContain("SECRET-UNREADABLE-REPLY");
  });

  test("null, [] or no field → exactly as today; a dropped field with no name says nothing; user rows never get one", () => {
    expect(text(bot({ roundAdjusted: null }))).toBe("เพิ่มกฎให้แล้วครับ");
    expect(text(bot({ roundAdjusted: [] }))).toBe("เพิ่มกฎให้แล้วครับ");
    expect(text(bot({}))).toBe("เพิ่มกฎให้แล้วครับ");
    expect(adjustedLines([dropped({ field: null })])).toEqual([]);
    expect(toMessages([msg(0, "user", { content: "ถาม", roundAdjusted: [dropped()] } as Partial<ApiMessage>)]).at(-1)?.text).toBe("ถาม");
  });
});
