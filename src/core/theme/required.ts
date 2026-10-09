import type { RequiredItem, StuckItemVM } from "./contract";
// Team C's pure module (no API client) — screen ④'s ids are theirs; the core re-exports them, never re-types them.
import { readyRequiredId } from "@/features/ready/required";

// Spread on the element that shows a required item: <span {...requiredProps(item)}>{item.text}</span>
export function requiredProps(item: RequiredItem) {
  return { "data-required": item.id } as const;
}

// The id of each required piece (contract v1.3). A theme pairs a piece with its item by id, never by text — and the
// core builds its own lists with these same helpers, so the two cannot disagree.
export const requiredId = {
  readiness: "readiness",
  step: (key: string) => `step:${key}`,
  lane: (key: string) => `lane:${key}`,
  branch: (from: string, to: string) => `branch:${from}->${to}`,
  message: (key: string) => `message:${key}`,
  screen: (key: string) => `screen:${key}`,
  api: (key: string) => `api:${key}`,
  part: (key: string) => `part:${key}`,
  stuck: (item: Pick<StuckItemVM, "key" | "kind" | "reason">) => `stuck:${item.key}:${item.reason ?? item.kind}`,
  readyReason: readyRequiredId.reason, // screen ④: one gate reason (Team C, TASK-B-015)
  readyScore: readyRequiredId.score, //   screen ④: the score line
} as const;

/** The required item with this id, if the page asked for it. */
export function findRequired(required: RequiredItem[], id: string): RequiredItem | undefined {
  return required.find((r) => r.id === id);
}
