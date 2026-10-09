import "@mantine/core/styles/Group.css";
import "@mantine/core/styles/Text.css";
import { Group, Text } from "@mantine/core";
import { IconCircleCheck, IconCircleDashed } from "@tabler/icons-react";
import type { ReadinessVM } from "@/core/theme/contract";
import { StuckIcon } from "./StuckIcon";
import s from "./parts.module.css";

// Not a percentage bar — Blueprint has no denominator for "stuck" (direction § 3). Three states, never by colour alone:
// stuck (stuckCount > 0 — SA-B's rule, TASK-A-042): solid black, white words, the stuck mark — the page's only solid
// block · ready: an ink check and the words, no box (REVIEW-C-002 row 23) · neither (an empty project: ready false,
// nothing stuck): a dashed circle and the words in ink-2 — neither the stuck fill nor the ready check.
export function ReadinessStrip({ readiness, requiredAttrs = {} }: { readiness: ReadinessVM; requiredAttrs?: Record<string, string> }) {
  const state = readiness.stuckCount > 0 ? "stuck" : readiness.ready ? "ready" : "neutral";
  const cls = state === "stuck" ? s.stripStuck : state === "ready" ? s.stripReady : s.stripNeutral;
  return (
    <Group gap="sm" wrap="nowrap" className={cls} data-state={state}>
      {state === "stuck" ? (
        <StuckIcon />
      ) : state === "ready" ? (
        <IconCircleCheck size={20} color="#000000" aria-hidden="true" focusable="false" style={{ flex: "none" }} />
      ) : (
        <IconCircleDashed size={20} color="#5C5C5C" aria-hidden="true" focusable="false" style={{ flex: "none" }} />
      )}
      <Text component="span" fz="md" fw={700} c="inherit" lh={1.4} {...requiredAttrs}>
        {readiness.label}
      </Text>
    </Group>
  );
}
