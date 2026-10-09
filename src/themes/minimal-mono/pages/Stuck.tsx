import "@mantine/core/styles/Paper.css";
import "@mantine/core/styles/Stack.css";
import "@mantine/core/styles/Text.css";
import "@mantine/core/styles/Title.css";
import "@mantine/core/styles/Anchor.css";
import { Anchor, Paper, Stack, Text, Title } from "@mantine/core";
import type { RequiredItem, StuckVM } from "@/core/theme/contract";
import { requiredId } from "@/core/theme/required";
import { proposedAnswer } from "@/core/words";
import { RequiredList, RequiredPicker } from "../parts/Required";
import { StuckIcon } from "../parts/StuckIcon";
import s from "./pages.module.css";

// ติดอยู่ตรงไหน in minimal mono (TASK-A-017). Every item in the order given, drawn the same way whatever its
// kind — a kind this theme has never seen still shows its wording; nothing is dropped by switching on kind.
export function Stuck({ vm, required }: { vm: StuckVM; required: RequiredItem[] }) {
  const picker = new RequiredPicker(required);
  const countProps = picker.takeId(requiredId.readiness); // only if a page list carries it (v1.1+: the shell's)
  const rows = vm.items.map((item) => {
    const wordingProps = picker.takeId(requiredId.stuck(item));
    return (
      <Paper key={`${item.kind}:${item.key}`} component="li" radius="lg" p="lg" className={s.stuckRow}>
        <Stack gap="xs" align="flex-start">
          <Text fz="md" fw={700} lh={1.5} className={s.partLabel} {...wordingProps}>
            {item.wording}
          </Text>
          <Text fz="lg" fw={700} lh={1.4}>
            {item.title}
          </Text>
          {item.proposedAnswer ? (
            <Text fz="md" lh={1.6}>
              <span className={s.partLabel}>{proposedAnswer}</span> {item.proposedAnswer}
            </Text>
          ) : null}
          <Anchor href={item.target.href} fz="md" fw={700} c="#000000" underline="always" className={s.target}>
            {item.target.title}
          </Anchor>
        </Stack>
      </Paper>
    );
  });

  const left = picker.rest();

  return (
    <Stack gap="xl" className={s.stuckPage}>
      <Title order={2} className={s.count}>
        {!vm.frame.readiness.ready ? <StuckIcon size={28} /> : null}
        <span {...countProps}>{vm.frame.readiness.label}</span>
      </Title>
      <Stack component="ol" gap="md" className={s.stuckList}>
        {rows}
      </Stack>
      <RequiredList items={left} />
    </Stack>
  );
}
