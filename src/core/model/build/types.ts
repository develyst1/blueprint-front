// What the builders take (the API's JSON, typed by the generated schema) and what they hand back.
import type { components } from "@/core/api/schema";
import type {
  FlowLayout, PageId, ParticipantVM, Point, SeqLayout, StepVM, SwimLayout, WebLayout,
} from "@/core/theme/contract";

type S = components["schemas"];
export type ApiProject = S["Project"];
export type ApiPart = S["Part"];
export type ApiLink = S["Link"];
export type ApiStuckItem = S["StuckItem"];
export type ApiHistoryEntry = S["HistoryEntry"];
export type ApiFlowchart = S["FlowchartDiagram"];
export type ApiSwimlane = S["SwimlaneDiagram"];
export type ApiSequence = S["SequenceDiagram"];

/** Everything every page starts from: GET /v1/projects/{id} + GET …/stuck. */
export interface ProjectData {
  project: ApiProject;
  parts: ApiPart[];
  links: ApiLink[];
  stuck: ApiStuckItem[];
}

/** A page that cannot draw: the project has nothing in it yet (AC-15). */
export type Built<T> = { ok: true; vm: T } | { ok: false; state: { kind: "empty"; page: PageId } };

/**
 * Positions are not the builders' job (TASK-B-006 owns them). The builders get these functions passed in;
 * this TASK passes sampleLayouts (build/sample-layouts.ts).
 */
export interface Layouts {
  flow(diagram: ApiFlowchart, direction: "LR" | "TB"): FlowLayout;
  swimLanes(lanes: ParticipantVM[]): SwimLayout["lanes"];
  sequence(participants: ParticipantVM[], messages: ApiSequence["messages"]): SeqLayout;
  web(nodes: { key: string; kind: ApiPart["kind"]; title: string; stuck: boolean }[], links: ApiLink[]): UrlFreeWebLayout;
}

/** A layout knows positions, never URLs: the web builder adds each node's `href` (contract v1.4). */
export type UrlFreeWebLayout = Omit<WebLayout, "nodes"> & { nodes: Omit<WebLayout["nodes"][number], "href">[] };

export type { FlowLayout, Point, SeqLayout, StepVM, SwimLayout, WebLayout };
