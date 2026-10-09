// The ids of screen ④'s required items (SPEC-C-002 ask 3) — a pure module: no API client, no words, nothing server-only,
// so the core's `@/core/theme/required` (imported by theme components) can build its ready ids from these (TASK-B-015).
// Moved unchanged from load.ts (TASK-C-014).
import type { GateCode } from "./contract";

export const readyRequiredId = {
  reason: (code: GateCode) => `ready:reason:${code}`,
  score: "ready:score",
} as const;
