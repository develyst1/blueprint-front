"use client";

// ใยโหนด's one client owner of the view (TASK-A-069, REQ-009 R7, SPEC-B-001 v1.16): it calls the core's `useWebView` once
// and draws both the web (WebDiagram, handed the hook's `view`) and — when a part is chosen — the panel beside it (below it
// on a phone): its title, kind, who stamped it and when (the core's labels, v1.5), where it came from, its links under
// เชื่อมกับ (core labels v1.6, core hrefs v1.4), and ปิด back to the whole web. Every link that chooses or clears a node
// spreads `view.linkProps(href)`, so choosing a node is a client navigation — the page never reloads. Moved from
// pages/Web.tsx unchanged in look and words; the server page keeps the legend and hands the VM down.
import { Grid, GridCol, Group, Paper, Stack, Text, Title } from "@mantine/core";
import type { RequiredItem, WebVM } from "@/core/theme/contract";
import { useWebView } from "@/core/web/useWebView";
import { closeDialog, linkedWith, partKind } from "@/core/words";
import { KindMark } from "../parts/KindMark";
import { StuckIcon } from "../parts/StuckIcon";
import { WebDiagram } from "./WebDiagram";
import s from "../pages/pages.module.css";

export function WebDesk({ vm, required }: { vm: WebVM; required: RequiredItem[] }) {
  const sel = vm.selected;
  // v1.15/v1.16: the hook picks the wide or the tall arrangement by the box; a cleared choice goes to allHref the client way
  const view = useWebView(vm.layout, sel?.key ?? null, { clearHref: vm.allHref, tall: vm.tall });
  const kindOf = new Map(vm.layout.nodes.map((n) => [n.key, n.kind]));
  const selStuck = !!sel && vm.layout.nodes.some((n) => n.key === sel.key && n.stuck);

  const panel = sel ? (
    <Paper component="aside" radius="lg" p="lg" className={s.panel} aria-labelledby="web-selected">
      <Stack gap="md">
        <Group gap="sm" wrap="nowrap" align="center" justify="space-between">
          <Group gap="sm" wrap="nowrap" align="center">
            <KindMark kind={sel.kind} size={18} solid={selStuck} />
            <Text component="span" fz="sm" fw={700} className={s.partLabel}>
              {partKind[sel.kind]}
            </Text>
          </Group>
          <a {...view.linkProps(vm.allHref)} className={s.panelClose}>{closeDialog}</a>
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
          <h3 className={s.panelLinksHeading}>{linkedWith}</h3>
        ) : null}
        {sel.links.length ? (
          <ul className={s.panelLinks}>
            {sel.links.map((l) => {
              const kind = kindOf.get(l.key);
              return (
                <li key={`${l.direction}:${l.kind}:${l.key}`}>
                  {kind ? <KindMark kind={kind} size={14} /> : <span />}
                  <span>
                    {l.label ? <span className={s.linkKind}>{l.label} </span> : null}
                    <a {...view.linkProps(l.href)} className={s.panelLink}>{l.title}</a>
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
    <Grid gap="lg">
      <GridCol span={{ base: 12, lg: panel ? 8 : 12 }}>
        <WebDiagram view={view} selectedKey={sel?.key ?? null} allHref={vm.allHref} required={required} />
      </GridCol>
      {panel ? <GridCol span={{ base: 12, lg: 4 }}>{panel}</GridCol> : null}
    </Grid>
  );
}
