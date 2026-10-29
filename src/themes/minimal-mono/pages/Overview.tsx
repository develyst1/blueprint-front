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
import { Button, Card, Collapse, Grid, GridCol, Group, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import { IconChevronDown } from "@tabler/icons-react";
import { useId, useState } from "react";
import type { DecisionVM, OverviewVM, RequiredItem } from "@/core/theme/contract";
import { requiredId } from "@/core/theme/required";
import { brief, decisionPart, requirementsSection, showMore } from "@/core/words";
import { KindMark } from "../parts/KindMark";
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

// The page — the brief (REQ-017, comp A), top-down as an analyst hands it back: what we understood (each work's goal) →
// ใครเกี่ยวข้อง → เส้นทางของงาน (the steps as numbered cards, then the endings) → กติกาที่ตกลงกันแล้ว → ยังรอคำตอบจากคุณ.
// Beside it (under it on a phone), an outlined panel: the readiness and what the system needs behind it, each count a
// link into the back room. Weight is the hierarchy: the stuck step stays the page's only solid block.
export function Overview({ vm, required }: { vm: OverviewVM; required: RequiredItem[] }) {
  const picker = new RequiredPicker(required);
  const back = new Map((vm.frame.rooms.find((r) => r.id === "back")?.pages ?? []).map((p) => [p.page, p.href]));
  const counts = [
    { kind: "screen", label: brief.rail.screens, n: vm.back.screens, href: back.get("screens") },
    { kind: "api", label: brief.rail.apis, n: vm.back.apis, href: back.get("api") },
    { kind: "system", label: brief.rail.systems, n: vm.back.systems, href: back.get("web") },
    { kind: "data", label: brief.rail.data, n: vm.back.data, href: back.get("web") },
  ] as const;

  const goals = vm.works.filter((w) => w.goal).map((w) => (
    <section key={w.key} className={s.goal}>
      <Text component="p" fz={24} fw={700} lh={1.55} className={s.goalText} {...picker.takeId(requiredId.goal(w.key))}>
        {w.goal}
      </Text>
      <Text component="p" fz="md" className={s.muted}>
        {brief.source(vm.version)}
      </Text>
    </section>
  ));

  const path = vm.works.map((work) => {
    const endings = work.steps.filter((st) => st.ends);
    return (
      <div key={work.key} className={s.path}>
        {vm.works.length > 1 ? (
          <Title order={3} className={s.subheading}>
            {work.title}
          </Title>
        ) : null}
        <SimpleGrid cols={{ base: 2, sm: 3, lg: 4 }} spacing={{ base: "sm", sm: "md" }}>
          {work.steps.filter((st) => !st.ends).map((step) => (
            <StepCard key={step.key} step={step} requiredAttrs={picker.takeId(requiredId.step(step.key))} />
          ))}
        </SimpleGrid>
        {endings.length ? (
          <ul className={s.endings}>
            {endings.map((st, i) => (
              <li key={st.key}>
                <span className={s.muted}>{brief.ending(i + 1, "")}</span>
                <a href={st.href} className={s.endingLink}>
                  <span {...picker.takeId(requiredId.step(st.key))}>{st.title}</span>
                </a>
                {st.stuck ? <StuckIcon size={18} /> : null}
                {st.stuckWordings.map((t, j) => (
                  <span key={j} className={s.stuckWords}>
                    {t}
                  </span>
                ))}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    );
  });

  const roles = vm.roles.map((r) => (
    <Card key={r.key} padding="md" radius="lg" className={s.role}>
      <Text component="span" fz="md" fw={700} {...picker.takeId(requiredId.role(r.key))}>
        {r.title}
      </Text>
      {r.duty ? (
        <Text component="span" fz="md" className={s.muted}>
          {r.duty}
        </Text>
      ) : null}
    </Card>
  ));

  // Fallback only: every item an overview carries (goals, roles, steps) is claimed above; anything else still shows.
  const left = picker.rest();
  const stuck = vm.frame.readiness.stuckCount > 0;

  return (
    <Grid gap="xl" className={s.brief}>
      <GridCol span={{ base: 12, md: 8 }}>
        <Stack gap="xl">
          {goals}
          <section aria-labelledby="brief-roles" className={s.section}>
            <Title order={2} id="brief-roles" className={s.heading}>
              {brief.roles}
            </Title>
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
              {roles}
            </SimpleGrid>
          </section>
          {vm.requirements.length ? (
            <section aria-labelledby="brief-requirements" className={s.section}>
              <Title order={2} id="brief-requirements" className={s.heading} {...picker.takeId(requiredId.requirementsSection)}>
                {requirementsSection}
              </Title>
              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                {vm.requirements.map((r) => (
                  <Card key={r.key} padding="md" radius="lg" className={s.role}>
                    <Text component="span" fz="md" fw={700} {...picker.takeId(requiredId.part(r.key))}>{r.title}</Text>
                    {r.text ? <Text component="span" fz="md" className={s.muted}>{r.text}</Text> : null}
                  </Card>
                ))}
              </SimpleGrid>
            </section>
          ) : null}
          <section aria-labelledby="brief-path" className={s.section}>
            <Title order={2} id="brief-path" className={s.heading}>
              {brief.path}
            </Title>
            {path}
          </section>
          {vm.decisions.length ? (
            <section aria-labelledby="brief-rules" className={s.section}>
              <Title order={2} id="brief-rules" className={s.heading}>
                {brief.rules}
              </Title>
              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                {vm.decisions.map((d) => (
                  <DecisionCard key={d.key} decision={d} />
                ))}
              </SimpleGrid>
            </section>
          ) : null}
          <section aria-labelledby="brief-waiting" className={s.section}>
            <Title order={2} id="brief-waiting" className={s.heading}>
              {brief.waiting}
            </Title>
            {vm.questions.length ? (
              <ul className={s.questions}>
                {vm.questions.map((q) => (
                  <li key={q.key}>
                    <a href={q.target.href} className={s.endingLink}>
                      {q.title}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <Text component="p" fz="md" className={s.muted}>
                {brief.noQuestions}
              </Text>
            )}
          </section>
        </Stack>
      </GridCol>
      <GridCol span={{ base: 12, md: 4 }}>
        <aside className={s.rail}>
          <Group gap="sm" wrap="nowrap" className={s.railReady}>
            {stuck ? <StuckIcon size={20} /> : null}
            <Text component="p" fz="md" fw={700}>
              {vm.frame.readiness.label}
            </Text>
          </Group>
          <Title order={2} className={s.railTitle}>
            {brief.rail.title}
          </Title>
          <ul className={s.counts}>
            {counts.map((c) => (
              <li key={c.label}>
                <a href={c.href} className={s.railRow}>
                  <KindMark kind={c.kind} size={16} />
                  <span className={s.countLabel}>{c.label}</span>
                  <b>{c.n}</b>
                </a>
              </li>
            ))}
            <li>
              <a href={back.get("sequence")} className={s.railRow}>
                <KindMark kind="interaction" size={16} />
                <span className={s.countLabel}>{brief.rail.interactions(vm.back.interactions)}</span>
              </a>
            </li>
            <li className={s.railRow}>
              <KindMark kind="data" size={16} />
              <span className={s.countLabel}>{brief.rail.er}</span>
              <span className={s.notYet}>{brief.rail.notYet}</span>
            </li>
            <li className={s.railRow}>
              <KindMark kind="system" size={16} />
              <span className={s.countLabel}>{brief.rail.services}</span>
              <span className={s.notYet}>{brief.rail.notYet}</span>
            </li>
          </ul>
          <RequiredList items={left} />
        </aside>
      </GridCol>
    </Grid>
  );
}
