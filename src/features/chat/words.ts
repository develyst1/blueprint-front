// The chat page's words — REQ-004 § User-facing wording, verbatim (stamp `operator-delegated`, 2026-10-09 standing
// rule). No other user-facing string is written for the chat; a missing one is a question, never a guess.
// One home per word (TASK-A-039, SA-B Q3): the D-020 words and the nav label live in `@/core/words`; this file
// re-exports them under its old names so no caller changes. Every other chat word lives here only.
import {
  chatActionError, chatChooseFile, chatEnterHint, chatLog, chatPack, chatSend, chatSourceReason, chatSpeaker, chatTryAgain, pageLabel, stamp,
} from "@/core/words";

export const acceptPack = "ตามนั้น";
/** the pack-wide button: accepts every listed key at once (D-026) — a single card / a bot suggestion keeps acceptPack */
export const acceptAll = (n: number) => `ตามนั้นทั้ง ${n} ข้อ`;

export const changeCard = {
  added: (n: number) => `เพิ่ม ${n}`,
  updated: (n: number) => `แก้ ${n}`,
  removed: (n: number) => `ลบ ${n}`,
  undo: "ย้อนกลับ",
} as const;

export const undoRefused = (part: string) => `ย้อนไม่ได้ — ${part} ถูกแก้ต่อไปแล้ว`;

export const uploadAsks = "ไฟล์นี้มาจากใคร";

export const sourceState = {
  reading: "กำลังอ่าน",
  read: "อ่านแล้ว",
  failed: (reason: string) => `อ่านไม่ได้ (${reason})`,
} as const;

export const thinking = "กำลังคิด…";

export const botFailed = { message: "บอทตอบไม่ได้ตอนนี้", retry: "ลองใหม่", changeModel: "เปลี่ยนโมเดล" } as const;

// REQ-110 § User-facing wording (the PM) and SPEC-105 Q2's four reason words, accepted by the PM 2026-10-29 as written
/** A round whose changes were rejected: nothing was saved; `reason` is one of `rejectReason`'s lines. */
export const roundRejected = (reason: string): string => `รอบนี้ยังไม่ได้บันทึกอะไรเลย — ${reason} ลองพิมพ์ใหม่หรือแก้ตามนี้ได้ครับ`;
/** The short reason per stored code (`roundReason`); `unknown_kind` names the kind the AI proposed (`roundNote`). */
export const rejectReason = {
  unknown_kind: (kind: string): string => `AI เสนอข้อมูลแบบ “${kind}” ที่ Blueprint ยังไม่รองรับ`,
  needs_user_words: "การแก้หรือลบสิ่งที่คุณพูดไว้เองต้องใช้คำของคุณ",
  invalid_change: "ข้อเสนอของ AI ไม่ผ่านการตรวจของระบบ",
  protocol: "AI ตอบกลับมาในรูปแบบที่ระบบอ่านไม่ได้",
} as const;
/** The AI did not answer in time (`bot_could_not_answer` with the reason `timeout`) — the retry and change-model controls stay. */
export const modelTimeout = "AI ตอบไม่ทันเวลา — ยังไม่ได้บันทึกอะไร ลองใหม่ หรือเปลี่ยนเป็นรุ่นที่เร็วกว่า";

// REQ-110 round 2 (SPEC-105 E5c/E6): some saved, some not — the PM's Q4 lines (defaults until she answers; invented by nobody here)
/** The header when a round saved n and refused m. */
export const savedHeader = (n: number, m: number): string => `บันทึกแล้ว ${n} รายการ — ยังไม่ได้บันทึก ${m} รายการ:`;
/** One refused item: its name and why. */
export const refusedItem = (name: string, reason: string): string => `${name} — ${reason}`;
/** The per-item reasons (`roundRefused[].reason`). `unknown_kind` and `needs_user_words` are the already-accepted words. */
export const refusedReason = {
  unknown_kind: (kind: string): string => rejectReason.unknown_kind(kind),
  needs_user_words: rejectReason.needs_user_words,
  invalid_change: "ข้อมูลไม่ครบหรือไม่ถูกรูปแบบ",
  depends_on_refused: "ผูกกับรายการที่ไม่ได้บันทึก",
} as const;
/** Past 50 refused items the record ends with `{ item: "more", count }`. */
export const refusedMore = (n: number): string => `และอีก ${n} รายการ`;

// REQ-110 round 3 (SPEC-105 E9, Q5 default until the PM answers): a part was saved but one malformed optional field was left out
export const fieldDropped = (name: string, field: string): string => `${name} — บันทึกแล้ว แต่ตัดช่อง ${field} ออก`;

export const toSpec = "ดู spec";

/** the chat's entry in the page strip — the core's nav label */
export const navChat = pageLabel.chat;

export const chatPlaceholder = "เล่าเรื่องงานของคุณ หรือวางเอกสารไว้ที่นี่";

export const modelLabel = "โมเดล";
export const creativityLabel = "ความสร้างสรรค์";

// the core owns this word (SPEC-B-001 v1.13): one home, re-exported here under the same name
export { contradiction } from "@/core/words";

export const cawAsks = (text: string) => `ทีมงาน AI ขอแก้ spec: ${text}`;

/** Who a file came from (SPEC-A-006, Interpreted): the two stamps a person can give without a channel. */
export const originChoices = [
  { stamp: "operator", label: stamp.operator },
  { stamp: "customer-asked", label: stamp["customer-asked"] },
] as const;

/** Closes "ไฟล์นี้มาจากใคร" without uploading (D-034, REQ-004 l.52) — every theme's chat page. */
export const cancel = "ยกเลิก";

// ---------- added 2026-10-09 (D-020 · REQ-004 table rows "Send" … "Upload / undo errors"; D-021 Addendum A) ----------

export const send = chatSend;
export const enterHint = chatEnterHint;
export const chooseFile = chatChooseFile;

/** accessible names: who wrote a row · the pack · the conversation */
export const speaker = chatSpeaker;
export const packName = chatPack;
export const logName = chatLog;

/** Why a source could not be read — shown inside อ่านไม่ได้ (…). Any other code: อ่านไม่ได้ alone. */
export const sourceReason = chatSourceReason;
export const sourceFailed = (code: string | null) => {
  const reason = code ? chatSourceReason[code] : undefined;
  return reason ? sourceState.failed(reason) : "อ่านไม่ได้";
};

/** Upload / undo errors (ActionCode → words) and the button to try again. */
export const actionError = chatActionError;
export const tryAgain = chatTryAgain;

/** A question without a proposed answer (REQ-003 Addendum A, D-021). */
export const answerOwn = "ตอบเอง…";
export const notNeeded = "ไม่ต้องใช้ข้อนี้";
export const reasonOptional = "เหตุผล (ไม่บังคับ)";

/** A proposed answer the bot suggested (A-R4); accepting it uses acceptPack (ตามนั้น). */
export const botSuggests = (answer: string) => `บอทเสนอ: ${answer}`;

/** The gateway's three tiers in the model list (D-035, REQ-004 table). A tier not listed here keeps the gateway's own name;
 *  `provider/model` ids are product names and are not worded. */
export const tierLabel = { small: "เร็ว", medium: "สมดุล", flagship: "เก่งที่สุด" } as const;
