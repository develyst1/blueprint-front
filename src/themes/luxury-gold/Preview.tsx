// The live preview in the new-project dialog: the first three steps as small medallions, plus the readiness.
// Static — no layout function, no data of its own (the sample comes from the core).
import type { PreviewVM } from "@/core/theme/contract";
import { Medallion } from "./primitives/Medallion";
import { Readiness } from "./primitives/Seal";

export function Preview({ sample }: { sample: PreviewVM }) {
  return (
    <div className="lg-preview">
      <span className="lg-preview-name">{sample.project.name}</span>
      <ol className="lg-preview-steps">
        {sample.steps.slice(0, 3).map((s) => (
          <li key={s.key}>
            <Medallion small number={s.number} title={s.title} end={s.ends} />
          </li>
        ))}
      </ol>
      <Readiness stuckCount={sample.readiness.stuckCount} label={sample.readiness.label} ready={sample.readiness.ready} />
    </div>
  );
}
