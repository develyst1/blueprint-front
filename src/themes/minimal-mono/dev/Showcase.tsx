"use client";

// Dev only (TASK-A-013, -015, -017) — not a page of the product. Renders the theme's pieces from the core's typed
// samples, inside MonoRoot, so they can be seen and checked before the core's real pages exist:
//   (no query)        shell, step cards, project card ×2, preview, the three page states
//   ?view=overview    the ภาพรวม page with sampleRequired.overview
//   ?view=stuck       the ติดอยู่ตรงไหน page with sampleRequired.stuck
// One page per view, so required-item ids never repeat on screen. Replaced when the pages land.
import "@mantine/core/styles/SimpleGrid.css";
import "@mantine/core/styles/Stack.css";
import { SimpleGrid, Stack } from "@mantine/core";
import { useSearchParams } from "next/navigation";
import { sampleCard, sampleFlowchart, sampleOverview, samplePreview, sampleRequired, sampleSequence, sampleShellRequired, sampleStuck, sampleWeb, sampleWorkOrder } from "@/core/model/samples";
import { readinessClean } from "@/core/words";
import { MonoRoot } from "../MonoRoot";
import { Shell } from "../shell/Shell";
import { Card } from "../card/Card";
import { Preview } from "../preview/Preview";
import { State } from "../state/State";
import { StepCard } from "../parts/StepCard";
import { Overview } from "../pages/Overview";
import { Stuck } from "../pages/Stuck";
import { Flowchart } from "../pages/Flowchart";
import { WorkOrder } from "../pages/WorkOrder";
import { Sequence } from "../pages/Sequence";
import { Web } from "../pages/Web";

function Pieces() {
  const steps = sampleOverview.works[0].steps;
  const frame = sampleOverview.frame;
  return (
    <Stack gap="xl">
      <SimpleGrid cols={{ base: 1, sm: 3, lg: 6 }} spacing="md" data-probe="steps">
        {steps.map((step) => (
          <StepCard key={step.key} step={step} />
        ))}
      </SimpleGrid>

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md" data-probe="card-preview">
        <Card card={sampleCard} />
        <Card card={{ ...sampleCard, readiness: { stuckCount: 0, label: readinessClean, ready: true } }} />
        <Preview sample={samplePreview} />
      </SimpleGrid>

      <SimpleGrid cols={{ base: 1, lg: 3 }} spacing="md" data-probe="states">
        {/* the retry here waits 800 ms, so a click visibly runs the handler and shows the pending state */}
        <State frame={frame} state={{ kind: "unreachable", retry: () => new Promise<void>((r) => setTimeout(r, 800)).then(() => console.info("[showcase] retry ran")) }} required={[]} />
        <State frame={frame} state={{ kind: "empty", page: "overview" }} required={sampleShellRequired} />
        <State frame={null} state={{ kind: "notFound", homeHref: sampleCard.href }} />
      </SimpleGrid>
    </Stack>
  );
}

// The core wraps every real page in <main id="content" tabIndex={-1}> (SPEC-B-001 § Skip link); the dev views do
// the same so the shell's skip link has its target here too.
function Content({ children }: { children: React.ReactNode }) {
  return (
    <main id="content" tabIndex={-1}>
      {children}
    </main>
  );
}

export function Showcase() {
  const view = useSearchParams().get("view");
  if (view === "overview") {
    return (
      <MonoRoot>
        <Shell frame={sampleOverview.frame} required={sampleShellRequired}>
          <Content><Overview vm={sampleOverview} required={sampleRequired.overview} /></Content>
        </Shell>
      </MonoRoot>
    );
  }
  if (view === "sequence") {
    return (
      <MonoRoot>
        <Shell frame={sampleSequence.frame} required={sampleShellRequired}>
          <Content><Sequence vm={sampleSequence} required={sampleRequired.sequence} /></Content>
        </Shell>
      </MonoRoot>
    );
  }
  if (view === "web") {
    return (
      <MonoRoot>
        <Shell frame={sampleWeb.frame} required={sampleShellRequired}>
          <Content><Web vm={sampleWeb} required={sampleRequired.web} /></Content>
        </Shell>
      </MonoRoot>
    );
  }
  if (view === "flowchart") {
    return (
      <MonoRoot>
        <Shell frame={sampleFlowchart.frame} required={sampleShellRequired}>
          <Content><Flowchart vm={sampleFlowchart} required={sampleRequired.flowchart} /></Content>
        </Shell>
      </MonoRoot>
    );
  }
  if (view === "workOrder") {
    return (
      <MonoRoot>
        <Shell frame={sampleWorkOrder.frame} required={sampleShellRequired}>
          <Content><WorkOrder vm={sampleWorkOrder} required={sampleRequired.workOrder} /></Content>
        </Shell>
      </MonoRoot>
    );
  }
  if (view === "stuck") {
    return (
      <MonoRoot>
        <Shell frame={sampleStuck.frame} required={sampleShellRequired}>
          <Content><Stuck vm={sampleStuck} required={sampleRequired.stuck} /></Content>
        </Shell>
      </MonoRoot>
    );
  }
  return (
    <MonoRoot>
      <Shell frame={sampleOverview.frame}>
        <Content><Pieces /></Content>
      </Shell>
    </MonoRoot>
  );
}
