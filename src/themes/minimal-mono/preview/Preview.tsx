import "@mantine/core/styles/SimpleGrid.css";
import "@mantine/core/styles/Stack.css";
import { SimpleGrid, Stack } from "@mantine/core";
import type { PreviewVM } from "@/core/theme/contract";
import { CardFace } from "../card/Card";
import { StepCard } from "../parts/StepCard";

// The live preview in the new-project dialog: the mono card (a picture, not a link — nothing exists to open yet),
// then the worked example's steps as small step cards — enough to see this theme's look before choosing it.
export function Preview({ sample }: { sample: PreviewVM }) {
  return (
    <Stack gap="md">
      <CardFace project={sample.project} readiness={sample.readiness} />
      <SimpleGrid cols={3} spacing="xs">
        {sample.steps.map((step) => (
          <StepCard key={step.key} step={step} size="sm" />
        ))}
      </SimpleGrid>
    </Stack>
  );
}
