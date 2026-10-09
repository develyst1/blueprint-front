// Screen ④ "พร้อมสร้างหรือยัง" — the page's seam (SPEC-C-002 § The view model, REQ-007). Pure types: a theme's ready
// page gets a ReadyVM, the server actions and its required items; it never calls the API. Until SA-B adds
// `Theme.ready` (SPEC-C-002 ask 1) these are imported from here; afterwards the core re-exports them.
import type { FrameVM, RequiredItem, StepVM } from "@/core/theme/contract";

export type GateCode = "stuck" | "no_quiz" | "too_few" | "not_100" | "stale";

export interface ReadyQuizItemVM {
  id: string;
  position: number;
  question: string;
  status: "answered" | "failed";
  answer: string | null;
  notInSpec: boolean;
  /** the parts the answer used, each a link to the node web focused on it */
  parts: { key: string; title: string; href: string }[];
  mark: "right" | "wrong" | null;
  note: string | null;
}

export interface ReadyQuizVM {
  id: string;
  stale: boolean;
  /** 10 answered items — the quiz takes no more (SPEC-A-004 rule 3) */
  full: boolean;
  items: ReadyQuizItemVM[];
  right: number;
  marked: number;
  /** straight from the API — never recomputed; null before 5 marks */
  score: number | null;
}

export interface ReadyVM {
  frame: FrameVM;
  /** the main work's steps, for the small picture (R1) */
  steps: StepVM[];
  /** parts of kind screen · api · role */
  counts: { screens: number; apis: number; people: number };
  stuck: { count: number; href: string };
  quiz: ReadyQuizVM | null;
  gate: { ok: boolean; reasons: { code: GateCode; text: string; href: string }[] };
  /** the newest confirmed version */
  version: null | { n: number; dateLabel: string; changedSince: boolean };
  build: { enabled: false; label: string; reason: string };
}

export type ActionCode = "stale" | "full" | "closed" | "already_marked" | "invalid" | "blocked" | "unreachable";
export type ActionResult = { ok: true } | { ok: false; code: ActionCode };

export interface ReadyActions {
  startQuiz(): Promise<ActionResult>;
  ask(question: string): Promise<ActionResult>;
  mark(itemId: string, mark: "right" | "wrong", note?: string): Promise<ActionResult>;
  confirm(): Promise<ActionResult>;
}

export interface ReadyPageProps {
  vm: ReadyVM;
  actions: ReadyActions;
  required: RequiredItem[];
}
