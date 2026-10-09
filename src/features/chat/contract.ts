// The chat page's seam (SPEC-A-006 § The view model, REQ-004). Pure types — a theme's chat page gets a ChatVM, the
// server actions and its required items; it never calls the API. Until SA-B adds `Theme.chat` (SPEC-A-006 ask 1)
// these are imported from here; afterwards the core re-exports them.
import type { FrameVM, RequiredItem } from "@/core/theme/contract";

export type ChatRole = "user" | "bot" | "caw";

export interface ChatMessageVM {
  id: string;
  role: ChatRole;
  /** what to show: the message, or for `caw` the REQ-004 wording around it */
  text: string;
  at: string;
  atLabel: string;
  roundStatus: string | null;
}

/** One open question — a card of the pack (R2; REQ-003 Addendum A: with or without a proposed answer). */
export interface ChatQuestionVM {
  key: string;
  text: string;
  /** null = no proposed answer: the card offers ตอบเอง… and ไม่ต้องใช้ข้อนี้ instead of ตามนั้น (TASK-A-034) */
  proposedAnswer: string | null;
  /** the proposed answer is the bot's suggestion (`proposedAnswerStamp: "team-proposed"`) → บอทเสนอ: … */
  suggested: boolean;
  cases: string[];
  about: { key: string; title: string }[];
}

/** What the newest chat-caused change set did (R3). */
export interface ChatChangeVM {
  changeSetId: string;
  added: number;
  updated: number;
  removed: number;
  undoable: boolean;
}

/** `pending` never reaches the page; while an upload runs, the page itself shows กำลังอ่าน. */
export interface ChatSourceVM {
  id: string;
  name: string;
  state: "read" | "failed";
  reason: string | null;
  note: string | null;
}

export interface ChatModelVM {
  current: string;
  options: { value: string; label: string }[];
}

export interface ChatVM {
  frame: FrameVM;
  /** newest 50, oldest first */
  messages: ChatMessageVM[];
  /** every open question, ≤ 5, oldest first (the `focus` one always included) */
  pack: ChatQuestionVM[];
  /** ?q=<key>: the question to open at (R7) */
  focus: string | null;
  lastChange: ChatChangeVM | null;
  sources: ChatSourceVM[];
  /** null = the gateway's list is unavailable: model change hidden, the chat still works */
  model: ChatModelVM | null;
  creativity: number;
  /** the newest bot row is bot_could_not_answer */
  failed: boolean;
  /** ดู spec → overview */
  specHref: string;
}

export type ActionCode = "undo_refused" | "invalid" | "unreachable" | "too_large" | "unsupported_file" | "already_added";
export type ActionResult = { ok: true } | { ok: false; code: ActionCode; parts?: string[] };

/** Server actions, bound to the project. Each ends with refresh(); none returns data the page must render. */
export interface ChatActions {
  send(text: string): Promise<ActionResult>;
  /** keys of questions that have a proposed answer only — any other key → `invalid`, nothing sent */
  accept(keys: string[]): Promise<ActionResult>;
  /** REQ-003 Addendum A: answer one open question in the user's own words */
  answer(key: string, text: string): Promise<ActionResult>;
  /** REQ-003 Addendum A: ไม่ต้องใช้ข้อนี้ — park one open question, with an optional reason */
  park(key: string, reason?: string): Promise<ActionResult>;
  undo(changeSetId: string): Promise<ActionResult>;
  upload(form: FormData): Promise<ActionResult>;
  setModel(model: string): Promise<ActionResult>;
  setCreativity(value: number): Promise<ActionResult>;
  retry(): Promise<ActionResult>;
}

export interface ChatPageProps {
  vm: ChatVM;
  actions: ChatActions;
  required: RequiredItem[];
}
