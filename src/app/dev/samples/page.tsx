// Dev only (TASK-B-003): proves the samples and words are real, in the default theme. Plain markup, no design.
import { requireDevPages } from "@/dev/isolation/guard";
import { defaultTheme } from "@/core/theme/default";
import {
  sampleApis, sampleCard, sampleFlowchart, sampleHistory, sampleOverview, samplePreview, sampleScreens,
  sampleSequence, sampleShellRequired, sampleStuck, sampleWeb, sampleWorkOrder,
} from "@/core/model/samples";

export const dynamic = "force-dynamic";

const frames = [sampleOverview, sampleWorkOrder, sampleFlowchart, sampleSequence, sampleScreens, sampleApis, sampleWeb, sampleStuck, sampleHistory]
  .map((vm) => vm.frame);

// The core hands retry down as a server action (SPEC-B-001 § "Server/client split"); here it only re-renders the page.
async function retryAction() {
  "use server";
}

export default function Page() {
  requireDevPages();
  const { Root } = defaultTheme;
  const State = defaultTheme.state!;
  return (
    <Root>
      <main>
        <h1>{sampleCard.project.name}</h1>
        <p data-probe="readiness">{samplePreview.readiness.label}</p>

        <ol data-probe="steps">
          {sampleOverview.works[0].steps.map((s) => (
            <li key={s.key}>{s.number} {s.title}</li>
          ))}
        </ol>

        <ul data-probe="frames">
          {frames.map((f) => (
            <li key={f.page}>{f.nav.find((n) => n.current)?.label} · {f.project.name} · {f.readiness.label}</li>
          ))}
        </ul>

        <section data-probe="states">
          <State frame={sampleOverview.frame} state={{ kind: "unreachable", retry: retryAction }} required={sampleShellRequired} />
          <State frame={sampleOverview.frame} state={{ kind: "empty", page: "overview" }} required={sampleShellRequired} />
          <State frame={null} state={{ kind: "notFound", homeHref: "/" }} required={[]} />
        </section>
      </main>
    </Root>
  );
}
