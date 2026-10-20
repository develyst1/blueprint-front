// Swimlane layout: lanes grouped by kind — คน → หน้าจอ → API → ระบบ (D-112, TASK-C-047) — the API's order kept inside each
// kind, each with its new index; and the groups over them, for the matrix's group header. The theme draws the grid; rows
// and handoffs come from the builder (TASK-B-005). Groups are computed from the lanes, never stored (harness § 9).
import type { ParticipantKind, ParticipantVM, SwimLayout } from "@/core/theme/contract";
import { participantKind } from "@/core/words";

const KIND_ORDER: ParticipantKind[] = ["role", "screen", "api", "system"];

/** The lanes by kind, and their groups: consecutive, one per kind present, labelled from words.participantKind. */
export function swimLanes(lanes: ParticipantVM[]): Pick<SwimLayout, "lanes" | "groups"> {
  return {
    lanes: KIND_ORDER.flatMap((kind) => lanes.filter((l) => l.kind === kind)).map((lane, index) => ({ ...lane, index })),
    groups: KIND_ORDER.map((kind) => ({ kind, label: participantKind[kind], count: lanes.filter((l) => l.kind === kind).length }))
      .filter((g) => g.count > 0),
  };
}
