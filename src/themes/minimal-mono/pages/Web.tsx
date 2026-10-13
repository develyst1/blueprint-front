import "@mantine/core/styles/Paper.css";
import "@mantine/core/styles/Stack.css";
import "@mantine/core/styles/Group.css";
import "@mantine/core/styles/Text.css";
import "@mantine/core/styles/Title.css";
import "@mantine/core/styles/Grid.css";
import { Group, Stack, Text } from "@mantine/core";
import type { PartKind, RequiredItem, WebVM } from "@/core/theme/contract";
import { partKind } from "@/core/words";
import { WebDesk } from "../diagram/WebDesk";
import { KindMark, PART_KIND_ORDER } from "../parts/KindMark";
import s from "./pages.module.css";

// ใยโหนด in minimal mono (TASK-A-021): the legend (only the kinds present), then the web and — when a part is selected —
// its panel. Both live in the client WebDesk, the one owner of the core's view hook (TASK-A-069, REQ-009 R7: choosing a
// node never reloads the page); this server page only hands the VM down. No raw code is printed.
export function Web({ vm, required }: { vm: WebVM; required: RequiredItem[] }) {
  const present = new Set(vm.layout.nodes.map((n) => n.kind));
  const kinds: PartKind[] = PART_KIND_ORDER.filter((k) => present.has(k));

  return (
    <Stack gap="lg">
      <Group gap="lg" className={s.legend}>
        {kinds.map((k) => (
          <Group key={k} gap={8} wrap="nowrap">
            <KindMark kind={k} size={16} />
            <Text component="span" fz="sm" fw={500}>
              {partKind[k]}
            </Text>
          </Group>
        ))}
      </Group>
      <WebDesk vm={vm} required={required} />
    </Stack>
  );
}
