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

export const toSpec = "ดู spec";

/** the chat's entry in the page strip — the core's nav label */
export const navChat = pageLabel.chat;

export const chatPlaceholder = "เล่าเรื่องงานของคุณ หรือวางเอกสารไว้ที่นี่";

export const modelLabel = "โมเดล";
export const creativityLabel = "ความสร้างสรรค์";

export const contradiction = (first: string, second: string) => `สองส่วนนี้ขัดกัน: ${first} กับ ${second}`;

export const cawAsks = (text: string) => `ทีมงาน AI ขอแก้ spec: ${text}`;

/** Who a file came from (SPEC-A-006, Interpreted): the two stamps a person can give without a channel. */
export const originChoices = [
  { stamp: "operator", label: stamp.operator },
  { stamp: "customer-asked", label: stamp["customer-asked"] },
] as const;

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
