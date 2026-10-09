import "@mantine/core/styles/Paper.css";
import "@mantine/core/styles/Card.css";
import "@mantine/core/styles/Stack.css";
import "@mantine/core/styles/Text.css";
import { Card as MantineCard, Stack, Text } from "@mantine/core";
import type { ProjectCardVM, ProjectHeadVM, ReadinessVM } from "@/core/theme/contract";
import { ReadinessStrip } from "../parts/ReadinessStrip";
import s from "./card.module.css";

function Face({ project, readiness }: { project: ProjectHeadVM; readiness: ReadinessVM }) {
  return (
    <Stack gap="md">
      <Stack gap={2}>
        <Text component="h2" fz="lg" fw={700} lh={1.4} c="inherit" m={0}>
          {project.name}
        </Text>
        <Text component="time" dateTime={project.createdAt} fz="sm" c="#5C5C5C">
          {project.createdLabel}
        </Text>
      </Stack>
      <div className={s.strip}>
        <ReadinessStrip readiness={readiness} />
      </div>
    </Stack>
  );
}

// One project on the home, in mono. The whole card is one link (the core gives the href). It sits inside the
// home's default shell, so no AppShell here.
export function Card({ card }: { card: ProjectCardVM }) {
  return (
    <MantineCard component="a" href={card.href} padding="lg" radius="lg" className={`${s.card} ${s.link}`}>
      <Face project={card.project} readiness={card.readiness} />
    </MantineCard>
  );
}

// The same card as a picture, not a link — for the new-project preview, where there is nothing to open yet.
export function CardFace({ project, readiness }: { project: ProjectHeadVM; readiness: ReadinessVM }) {
  return (
    <MantineCard padding="lg" radius="lg" className={s.card}>
      <Face project={project} readiness={readiness} />
    </MantineCard>
  );
}
