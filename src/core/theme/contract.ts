// src/core/theme/contract.ts — v1, 2026-10-09 (SPEC-B-001). Changing a published type needs SA-B + PM + both teams.
import type { FC, ReactNode } from "react";
import type { ChatPageProps } from "@/features/chat/contract"; // Team A, D-018 (v1.9)
export type { ChatVM, ChatActions, ChatPageProps } from "@/features/chat/contract";
import type { ReadyPageProps } from "@/features/ready/contract"; // Team C, REQ-007 (v1.10)
export type { ReadyVM, ReadyActions, ReadyPageProps } from "@/features/ready/contract";

export type PageId = "overview" | "workOrder" | "flowchart" | "sequence" | "screens" | "api" | "web" | "stuck" | "history";
export type PartKind = "work" | "step" | "interaction" | "role" | "screen" | "api" | "system" | "data" | "decision" | "question";
export type ParticipantKind = "role" | "screen" | "api" | "system";
export type StuckKind = "open_question" | "unlinked_part" | "flow_break" | "unconfirmed_guess" | "screen_without_api";
export type FlowBreakReason = "unreachable" | "dead_end" | "unlabelled_branch" | "no_interactions" | "incomplete_interaction";

/** What must be visible: an element carrying data-required={id} whose visible text contains `text`. */
export interface RequiredItem { id: string; text: string }

export interface Point { x: number; y: number }

// ---------- shared pieces ----------
export interface ProjectHeadVM { id: string; name: string; createdAt: string; createdLabel: string /* "9 ต.ค. 2569" — core-formatted, D-006 */; theme: string }
export interface ReadinessVM { stuckCount: number; label: string /* words.readinessStuck(n) | words.readinessClean */; ready: boolean }
export interface NavItemVM { page: PageId | "chat" | "ready"; label: string; href: string; current: boolean } // "chat" v1.9 · "ready" v1.10
export interface FrameVM { project: ProjectHeadVM; readiness: ReadinessVM; nav: NavItemVM[]; page: PageId }
export interface StepVM { key: string; number: string /* "01" */; title: string; ends: boolean; stuck: boolean; stuckWordings: string[] /* words of every stuck item targeting this step, [] if none (v1.3) */; href: string /* its sequence */ }
export interface WorkVM { key: string; title: string; steps: StepVM[] }
export interface DecisionVM { key: string; title: string; rule: string; cases: string[]; open: string | null; covers: { key: string; title: string; href: string /* v1.7 */ }[] }
export interface ParticipantVM { key: string; kind: ParticipantKind; title: string }

// ---------- layouts (computed by the core, drawn by the theme; positions in px, origin top-left) ----------
export interface FlowLayout {
  direction: "LR" | "TB"; width: number; height: number;
  nodes: { key: string; x: number; y: number; w: number; h: number; layer: number; isBranch: boolean; ends: boolean }[];
  edges: { from: string; to: string; label: string | null; points: Point[]; labelAnchor: Point | null /* after the fork, never at the split */ }[];
}
export interface SwimLayout {
  lanes: (ParticipantVM & { index: number })[];
  rows: {
    step: StepVM;
    lanes: string[];                            // participant keys in this step
    handoffs: { key: string; order: number; from: string | null; to: string | null; text: string }[]; // the step's interactions in order — who hands to whom (added 2026-10-09, Team C)
  }[];
}
export interface SeqLayout {
  width: number; height: number;
  participants: (ParticipantVM & { x: number })[];
  messages: { key: string; order: number; y: number; from: string | null; to: string | null; text: string; reply: string | null }[];
}
export interface WebLayout {
  width: number; height: number;
  nodes: { key: string; kind: PartKind; title: string; x: number; y: number; stuck: boolean; href: string /* this part on the web page (v1.4) */ }[];
  edges: { id: string; kind: string; from: string; to: string }[];
}

// ---------- one view model per page ----------
export interface OverviewVM { frame: FrameVM; works: WorkVM[]; decisions: DecisionVM[] }
export interface WorkOrderVM { frame: FrameVM; works: { key: string; title: string; href: string }[]; work: WorkVM; layout: SwimLayout }
export interface FlowchartVM { frame: FrameVM; works: { key: string; title: string; href: string }[]; work: WorkVM; layouts: { LR: FlowLayout; TB: FlowLayout } }
export interface SequenceVM { frame: FrameVM; steps: StepVM[]; step: StepVM; layout: SeqLayout }
export interface ScreenVM { key: string; title: string; stuck: boolean; stuckWordings: string[] /* v1.7 */; fields: { name: string; label: string | null; type: string | null }[]; actions: { name: string; label: string | null }[]; states: { name: string; note: string | null }[]; shows: { key: string; title: string; href: string /* v1.7 */ }[] }
export interface ScreensVM { frame: FrameVM; screens: ScreenVM[] }
export interface ApiVM { key: string; title: string; stuck: boolean; stuckWordings: string[] /* v1.7 */; method: string; path: string; request: unknown; responses: { status: number; body: unknown; note: string | null }[]; reads: { key: string; title: string; href: string }[]; writes: { key: string; title: string; href: string }[] /* hrefs v1.7 */ }
export interface ApisVM { frame: FrameVM; apis: ApiVM[] }
export interface PartDetailVM { key: string; kind: PartKind; title: string; stamp: string; stampLabel: string /* words.stamp[stamp], D-008 (v1.5) */; date: string; dateLabel: string /* core-formatted, D-006 (v1.5) */; cameFrom: string /* words.historyCause.* */; links: { kind: string; direction: "out" | "in"; label: string /* words.linkKind[kind][direction], D-009 (v1.6) */; key: string; title: string; href: string /* v1.4 */ }[] }
export interface WebVM { frame: FrameVM; layout: WebLayout; selected: PartDetailVM | null }
export interface StuckItemVM { kind: StuckKind; reason: FlowBreakReason | null; key: string; title: string; wording: string; proposedAnswer: string | null; target: { key: string; title: string; href: string } }
export interface StuckVM { frame: FrameVM; items: StuckItemVM[] }
export interface HistoryEntryVM { at: string; atLabel: string /* core-formatted, D-006 */; cause: string /* words.historyCause.* */; what: string /* the API op code — logic only */; whatLabel: string /* words.historyWhat[what], "" if no word (v1.7, D-010) */; summary: string }
export interface HistoryVM { frame: FrameVM; parts: { key: string; kind: PartKind /* v1.8 */; title: string; href: string }[]; part: { key: string; title: string } | null; entries: HistoryEntryVM[] }

export interface PageVMs { overview: OverviewVM; workOrder: WorkOrderVM; flowchart: FlowchartVM; sequence: SequenceVM; screens: ScreensVM; api: ApisVM; web: WebVM; stuck: StuckVM; history: HistoryVM }

// ---------- home + new project ----------
export interface ProjectCardVM { project: ProjectHeadVM; readiness: ReadinessVM; href: string }
export interface PreviewVM { project: ProjectHeadVM; readiness: ReadinessVM; steps: StepVM[] /* the worked example's, for the live preview */ }

// ---------- states every page has (AC-14…16) ----------
export type PageState = { kind: "unreachable"; retry: () => void } | { kind: "empty"; page: PageId } | { kind: "notFound"; homeHref: string /* built by the core (Team A, 2026-10-09) */ };

// ---------- the theme ----------
export interface Theme {
  id: string;                                   // = the folder name = Project.theme
  name: string;                                 // shown in the theme picker
  /** Required. Renders data-theme-root={id}, its library provider, its font — and nothing on html/body. */
  Root: FC<{ children: ReactNode }>;
  /** `required` = the frame's own items (the readiness label); a page's `required` never repeats them (v1.1). */
  /** `tools` (v1.11): core-owned controls (today: ส่งออก PDF, REQ-008) — the shell places them in its header, never builds them. */
  shell?: FC<{ frame: FrameVM; required: RequiredItem[]; tools?: ReactNode; children: ReactNode }>;
  card?: FC<{ card: ProjectCardVM }>;
  preview?: FC<{ sample: PreviewVM }>;
  pages?: { [P in PageId]?: FC<{ vm: PageVMs[P]; required: RequiredItem[] }> };
  /** `required` = the frame's items when a frame exists (readiness on an empty page), else [] (v1.2, Team C). */
  state?: FC<{ frame: FrameVM | null; state: PageState; required: RequiredItem[] }>;
  chat?: FC<ChatPageProps>;                     // v1.9 — Team A's chat core (REQ-004)
  ready?: FC<ReadyPageProps>;                   // v1.10 — Team C's ready-to-build core (REQ-007)
}
