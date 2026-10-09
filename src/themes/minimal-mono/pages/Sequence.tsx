import "@mantine/core/styles/Stack.css";
import "@mantine/core/styles/Group.css";
import "@mantine/core/styles/Text.css";
import "@mantine/core/styles/Title.css";
import { Group, Stack, Text, Title } from "@mantine/core";
import type { RequiredItem, SequenceVM } from "@/core/theme/contract";
import { pageLabel } from "@/core/words";
import { SeqDiagram } from "../diagram/SeqDiagram";
import { StuckIcon } from "../parts/StuckIcon";
import s from "./pages.module.css";

// ลำดับการโต้ตอบ in minimal mono (TASK-A-021): a step chooser (the core's links), then the chosen step's sequence.
export function Sequence({ vm, required }: { vm: SequenceVM; required: RequiredItem[] }) {
  const step = vm.step;
  return (
    <Stack gap="lg">
      <nav aria-label={pageLabel.sequence} className={s.stepChooser}>
        {vm.steps.map((st) => (
          <a key={st.key} href={st.href} aria-current={st.key === step.key ? "page" : undefined} className={s.stepChip}>
            {st.number}
            {st.stuck ? <StuckIcon size={16} /> : null}
            {st.stuck && st.stuckWordings.length ? <span className={s.srOnly}>{st.stuckWordings.join(" ")}</span> : null}
          </a>
        ))}
      </nav>

      <Group gap="sm" wrap="nowrap" align="center">
        <Title order={2} className={s.heading}>
          {step.number} {step.title}
        </Title>
        {step.stuck ? <StuckIcon /> : null}
      </Group>
      {step.stuck && step.stuckWordings.length ? (
        <Stack gap={2}>
          {step.stuckWordings.map((w) => (
            <Text key={w} fz="md" fw={700} className={s.partLabel}>
              {w}
            </Text>
          ))}
        </Stack>
      ) : null}

      <SeqDiagram layout={vm.layout} required={required} />
    </Stack>
  );
}
