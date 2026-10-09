// Swimlane layout: lanes in the API's order, each with its index. The theme draws the grid; rows and handoffs come
// from the builder (TASK-B-005). A function on purpose — a later lane order (e.g. by kind) changes only this.
import type { ParticipantVM, SwimLayout } from "@/core/theme/contract";

export function swimLanes(lanes: ParticipantVM[]): SwimLayout["lanes"] {
  return lanes.map((lane, index) => ({ ...lane, index }));
}
