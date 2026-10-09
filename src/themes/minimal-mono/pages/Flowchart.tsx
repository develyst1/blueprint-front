import "@mantine/core/styles/Stack.css";
import "@mantine/core/styles/Group.css";
import "@mantine/core/styles/Title.css";
import { Group, Stack, Title } from "@mantine/core";
import type { FlowchartVM, RequiredItem } from "@/core/theme/contract";
import { FlowDiagram } from "../diagram/FlowDiagram";
import s from "./pages.module.css";

// ผังการทำงาน in minimal mono (TASK-A-019): the work's flowchart, drawn from the core's layout. A work switcher
// (core hrefs) only when the project has more than one work. Screen-reader users get every arrow as a line.
export function Flowchart({ vm, required }: { vm: FlowchartVM; required: RequiredItem[] }) {
  const stepOf = new Map(vm.work.steps.map((st) => [st.key, st]));
  const name = (key: string) => {
    const st = stepOf.get(key);
    return st ? `${st.number} ${st.title}` : key;
  };
  const arrows = vm.layouts.LR.edges;
  return (
    <Stack gap="lg">
      <Title order={2} className={s.heading}>
        {vm.work.title}
      </Title>
      {vm.works.length > 1 ? (
        <Group gap="xs" component="nav" className={s.works}>
          {vm.works.map((w) => (
            <a key={w.key} href={w.href} aria-current={w.key === vm.work.key ? "page" : undefined} className={s.workLink}>
              {w.title}
            </a>
          ))}
        </Group>
      ) : null}
      <FlowDiagram layouts={vm.layouts} steps={vm.work.steps} required={required} />
      <ol className={s.srOnly}>
        {arrows.map((e) => (
          <li key={`${e.from}-${e.to}`}>
            {name(e.from)} → {name(e.to)}
            {e.label ? ` (${e.label})` : ""}
          </li>
        ))}
      </ol>
    </Stack>
  );
}
