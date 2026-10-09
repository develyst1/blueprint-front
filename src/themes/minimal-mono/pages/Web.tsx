import "@mantine/core/styles/Paper.css";
import "@mantine/core/styles/Stack.css";
import "@mantine/core/styles/Group.css";
import "@mantine/core/styles/Text.css";
import "@mantine/core/styles/Title.css";
import "@mantine/core/styles/Grid.css";
import { Grid, GridCol, Group, Paper, Stack, Text, Title } from "@mantine/core";
import type { PartKind, RequiredItem, WebVM } from "@/core/theme/contract";
import { partKind } from "@/core/words";
import { WebDiagram } from "../diagram/WebDiagram";
import { KindMark, PART_KIND_ORDER } from "../parts/KindMark";
import { StuckIcon } from "../parts/StuckIcon";
import s from "./pages.module.css";

// ใยโหนด in minimal mono (TASK-A-021): the legend (only the kinds present), the web, and — when a part is
// selected — an inline panel beside it (below it on a phone): its title, kind, who stamped it and when (the core's
// labels, v1.5), where it came from, and its links (core labels v1.6, core hrefs v1.4). No raw code is printed.
export function Web({ vm, required }: { vm: WebVM; required: RequiredItem[] }) {
  const present = new Set(vm.layout.nodes.map((n) => n.kind));
  const kinds: PartKind[] = PART_KIND_ORDER.filter((k) => present.has(k));
  const sel = vm.selected;
  const kindOf = new Map(vm.layout.nodes.map((n) => [n.key, n.kind]));
  const selStuck = !!sel && vm.layout.nodes.some((n) => n.key === sel.key && n.stuck);

  const panel = sel ? (
    <Paper component="aside" radius="lg" p="lg" className={s.panel} aria-labelledby="web-selected">
      <Stack gap="md">
        <Group gap="sm" wrap="nowrap" align="center">
          <KindMark kind={sel.kind} size={18} solid={selStuck} />
          <Text component="span" fz="sm" fw={700} className={s.partLabel}>
            {partKind[sel.kind]}
          </Text>
        </Group>
        <Group gap="sm" wrap="nowrap" className={s.panelTitle}>
          <Title order={2} id="web-selected" className={s.heading}>
            {sel.title}
          </Title>
          {selStuck ? <StuckIcon /> : null}
        </Group>
        <Stack gap={0}>
          <Text fz="sm" fw={500}>
            {sel.stampLabel}
          </Text>
          <Text component="time" dateTime={sel.date} fz="sm" c="#5C5C5C">
            {sel.dateLabel}
          </Text>
          <Text fz="sm" c="#5C5C5C">
            {sel.cameFrom}
          </Text>
        </Stack>
        {/* Each link: the core's words for how it relates (v1.6 `label`, empty when it has none — never the code),
            then the other part as a link, with that part's kind shape. */}
        {sel.links.length ? (
          <ul className={s.panelLinks}>
            {sel.links.map((l) => {
              const kind = kindOf.get(l.key);
              return (
                <li key={`${l.direction}:${l.kind}:${l.key}`}>
                  {kind ? <KindMark kind={kind} size={14} /> : <span />}
                  <span>
                    {l.label ? <span className={s.linkKind}>{l.label} </span> : null}
                    <a href={l.href} className={s.panelLink}>{l.title}</a>
                  </span>
                </li>
              );
            })}
          </ul>
        ) : null}
      </Stack>
    </Paper>
  ) : null;

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
      <Grid gap="lg">
        <GridCol span={{ base: 12, lg: panel ? 8 : 12 }}>
          <WebDiagram layout={vm.layout} selectedKey={sel?.key ?? null} required={required} />
        </GridCol>
        {panel ? <GridCol span={{ base: 12, lg: 4 }}>{panel}</GridCol> : null}
      </Grid>
    </Stack>
  );
}
