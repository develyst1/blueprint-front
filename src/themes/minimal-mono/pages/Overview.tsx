"use client";

// ภาพรวม in minimal mono (TASK-A-017). A client file because each decision's ดูรายละเอียด opens and closes;
// index.ts stays a server module and only references this component.
import "@mantine/core/styles/UnstyledButton.css";
import "@mantine/core/styles/Button.css";
import "@mantine/core/styles/Paper.css";
import "@mantine/core/styles/Card.css";
import "@mantine/core/styles/Grid.css";
import "@mantine/core/styles/SimpleGrid.css";
import "@mantine/core/styles/Stack.css";
import "@mantine/core/styles/Group.css";
import "@mantine/core/styles/Text.css";
import "@mantine/core/styles/Title.css";
import { Button, Card, Collapse, Grid, GridCol, Group, Paper, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import { IconChevronDown } from "@tabler/icons-react";
import { useId, useState } from "react";
import type { DecisionVM, OverviewVM, RequiredItem } from "@/core/theme/contract";
import { requiredId } from "@/core/theme/required";
import { decisionPart, pageLabel, showMore } from "@/core/words";
import { StepCard } from "../parts/StepCard";
import { RequiredList, RequiredPicker } from "../parts/Required";
import { StuckIcon } from "../parts/StuckIcon";
import s from "./pages.module.css";

function DecisionCard({ decision }: { decision: DecisionVM }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const showRule = decision.rule.trim() !== decision.title.trim();
  return (
    <Card padding="lg" radius="lg" className={s.decision}>
      <Stack gap="sm" align="flex-start">
        <Text fz="md" fw={700} lh={1.5} lineClamp={2}>
          {decision.title}
        </Text>
        {showRule ? (
          <Text fz="md" lh={1.6} lineClamp={2}>
            <span className={s.partLabel}>{decisionPart.rule}</span> {decision.rule}
          </Text>
        ) : null}
        {/* Open or closed, the button stays an outline: the stuck step must remain the page's only solid block.
            The open state shows in the chevron (and aria-expanded), not in a fill. */}
        <Button
          variant="default"
          radius="md"
          h={44}
          className={s.moreButton}
          rightSection={<IconChevronDown size={18} aria-hidden="true" className={open ? s.chevronOpen : s.chevron} />}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((v) => !v)}
        >
          {showMore}
        </Button>
        <Collapse expanded={open} id={panelId}>
          <dl className={s.parts}>
            <dt className={s.partLabel}>{decisionPart.cases}</dt>
            <dd>
              <ul className={s.cases}>
                {decision.cases.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </dd>
            {decision.open ? (
              <>
                <dt className={s.partLabel}>{decisionPart.open}</dt>
                <dd>
                  <span className={s.openCase}>{decision.open}</span>
                </dd>
              </>
            ) : null}
          </dl>
          {decision.covers.length ? (
            <div className={s.covers}>
              {decision.covers.map((c) => (
                <a key={c.key} href={c.href} className={s.chip}>
                  {c.title}
                </a>
              ))}
            </div>
          ) : null}
        </Collapse>
      </Stack>
    </Card>
  );
}

// The page: each work's steps as numbered cards (6 / 3 / 1 across); below them the decisions, with the
// "ติดอยู่ตรงไหน" panel beside them (and first on a phone) holding every required item the steps do not show.
export function Overview({ vm, required }: { vm: OverviewVM; required: RequiredItem[] }) {
  const picker = new RequiredPicker(required);

  const works = vm.works.map((work) => (
    <section key={work.key} aria-labelledby={`work-${work.key}`} className={s.section}>
      <Title order={2} id={`work-${work.key}`} className={s.heading}>
        {work.title}
      </Title>
      <SimpleGrid cols={{ base: 2, sm: 3, lg: 6 }} spacing={{ base: "sm", sm: "md" }}>
        {work.steps.map((step) => (
          <StepCard key={step.key} step={step} requiredAttrs={picker.takeId(requiredId.step(step.key))} />
        ))}
      </SimpleGrid>
    </section>
  ));

  // Fallback only (v1.1: an overview's required list holds just its steps, which the cards claim). If a list
  // ever carries more — e.g. the v1 samples' readiness + stuck items — they still show, in this panel.
  const left = picker.rest();
  const anyStuck = !vm.frame.readiness.ready;

  return (
    <Stack gap="xl">
      {works}
      <Grid gap="lg" className={s.lower}>
        {left.length ? (
          <GridCol span={{ base: 12, md: 4 }} order={{ base: 1, md: 2 }}>
            <Paper radius="lg" p="lg" className={anyStuck ? s.stuckPanel : s.quietPanel}>
              <Stack gap="sm">
                <Group gap="sm" wrap="nowrap">
                  {anyStuck ? <StuckIcon /> : null}
                  <Title order={2} className={s.heading}>
                    {pageLabel.stuck}
                  </Title>
                </Group>
                <RequiredList items={left} />
              </Stack>
            </Paper>
          </GridCol>
        ) : null}
        <GridCol span={{ base: 12, md: left.length ? 8 : 12 }} order={{ base: 2, md: 1 }}>
          <SimpleGrid cols={{ base: 1, sm: 2, lg: left.length ? 2 : 3 }} spacing="md">
            {vm.decisions.map((d) => (
              <DecisionCard key={d.key} decision={d} />
            ))}
          </SimpleGrid>
        </GridCol>
      </Grid>
    </Stack>
  );
}
