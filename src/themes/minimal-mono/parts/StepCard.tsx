import "@mantine/core/styles/Paper.css";
import "@mantine/core/styles/Card.css";
import "@mantine/core/styles/Group.css";
import "@mantine/core/styles/Stack.css";
import "@mantine/core/styles/Text.css";
import { Card, Group, Stack, Text } from "@mantine/core";
import type { StepVM } from "@/core/theme/contract";
import { stepEnds } from "@/core/words";
import { StuckIcon } from "./StuckIcon";
import s from "./parts.module.css";

type StepCardProps = {
  step: Pick<StepVM, "number" | "title" | "ends" | "stuck"> & { stuckWordings?: string[]; href?: string };
  size?: "md" | "sm";
  /** required-item attributes for the title (from RequiredPicker.take — TASK-A-017) */
  requiredAttrs?: Record<string, string>;
};

// Weight is the hierarchy (direction § 4): the stuck step is the only solid block, and says why — each of its
// stuckWordings on its own line, never joined (REVIEW-C-002 row 3). An end step is the same card marked with the
// flowchart's start/end stadium, drawn small beside the `จบงาน` word — a mark, not a boxed tag that reads as a control (row 2). size "sm" is the live-preview thumbnail: smaller, but
// nothing under 14 px; there the words stay for screen readers. With an href the whole card is one link.
export function StepCard({ step, size = "md", requiredAttrs = {} }: StepCardProps) {
  const sm = size === "sm";
  const cls = [
    s.step,
    sm ? s.stepSm : null,
    step.stuck ? s.stepStuck : null,
    step.href ? s.stepLink : null,
  ].filter(Boolean).join(" ");
  const linkProps = step.href ? ({ component: "a", href: step.href } as const) : {};
  return (
    <Card {...linkProps} padding={sm ? "sm" : "lg"} radius="lg" className={cls}>
      <Stack gap={sm ? 4 : "xs"}>
        <Group justify="space-between" align="flex-start" wrap="nowrap">
          <Text component="span" fz={sm ? 28 : 48} fw={800} lh={1} c="inherit">
            {step.number}
          </Text>
          {step.stuck ? <StuckIcon size={sm ? 18 : 22} /> : null}
        </Group>
        <Text fz={sm ? "sm" : "md"} fw={700} lh={1.4} c="inherit" {...requiredAttrs}>
          {step.title}
        </Text>
        {step.ends && !sm ? (
          <span className={s.endMark}>
            <svg width={24} height={12} viewBox="0 0 24 12" aria-hidden="true" focusable="false">
              <rect x={0.75} y={0.75} width={22.5} height={10.5} rx={5.25} fill="none" stroke="currentColor" strokeWidth={1.5} />
            </svg>
            {stepEnds}
          </span>
        ) : null}
        {/* v1.3: why it is stuck, in the stuck list's own words (every item targeting this step), one per line */}
        {step.stuck && step.stuckWordings?.length ? (
          <ul className={sm ? s.srOnly : s.stuckWords}>
            {step.stuckWordings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        ) : null}
        {step.ends && sm ? <span className={s.srOnly}>{stepEnds}</span> : null}
      </Stack>
    </Card>
  );
}
