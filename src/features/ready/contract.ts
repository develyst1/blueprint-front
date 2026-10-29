// Screen ④ "พร้อมสร้างหรือยัง" — the page's seam (SPEC-C-002 § The view model, REQ-007). Pure types: a theme's ready
// page gets a ReadyVM, the server actions and its required items; it never calls the API. Until SA-B adds
// `Theme.ready` (SPEC-C-002 ask 1) these are imported from here; afterwards the core re-exports them.
import type { ReactNode } from "react";
import type { FrameVM, RequiredItem, StepVM } from "@/core/theme/contract";

/** What is still open on the page — a note, never a gate (REQ-103: a label is never blocked). `empty` (no parts — leads to the
 *  chat): TASK-C-016, D-032. The `confirmed` state is gone with the confirm button. */
export type GateCode = "empty" | "stuck" | "no_quiz" | "too_few" | "not_100" | "stale";

/** One hand label (REQ-103): the text the person typed, `v{n}` for an old confirmed version that has none. */
export interface ReadyLabelVM { version: number; text: string; dateLabel: string; by: string }

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
  gate: { reasons: { code: GateCode; text: string; href: string }[] };
  /** The labels, newest first, from GET …/labels. */
  labels: ReadyLabelVM[];
  /** The warning shown before a label is saved (REQ-103 § Wording): stuck items and/or an incomplete quiz; null = none. */
  warning: string | null;
  /** Build (REQ-103 AC-3): always on. `href` opens CAW's start page for this project, with the newest label's version when
   *  there is one (SPEC-104 Q2: none → no version). `enabled` stays true and `reason` "" so a theme's old off-branch is dead. */
  build: { enabled: boolean; label: string; reason: string; href: string | null };
}

export type ActionCode = "stale" | "full" | "closed" | "already_marked" | "invalid" | "blocked" | "unreachable" | "name_required" /* REQ-103 */;
export type ActionResult = { ok: true } | { ok: false; code: ActionCode };

export interface ReadyActions {
  startQuiz(): Promise<ActionResult>;
  ask(question: string): Promise<ActionResult>;
  mark(itemId: string, mark: "right" | "wrong", note?: string): Promise<ActionResult>;
  /** Put a label on the project's current state (REQ-103). An empty text is refused by the caller; the action refuses it too. */
  label(text: string): Promise<ActionResult>;
}

export interface ReadyPageProps {
  vm: ReadyVM;
  actions: ReadyActions;
  required: RequiredItem[];
  /** The label field, its warning and the label list — core-owned, placed by the theme where the confirm button was
   *  (REQ-103). Themes never build it. */
  labelSection: ReactNode;
}
