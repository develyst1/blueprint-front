// The default theme's live preview in the new-project dialog: the worked example's head, readiness and steps.
import type { PreviewVM } from "../contract";
import s from "./default.module.css";

export function Preview({ sample }: { sample: PreviewVM }) {
  return (
    <div className={s.card}>
      <h3>{sample.project.name}</h3>
      <span className={sample.readiness.ready ? s.readiness : `${s.readiness} ${s.readinessStuck}`}>{sample.readiness.label}</span>
      <ol className={s.list}>
        {sample.steps.map((st) => <li key={st.key}>{st.number} {st.title}</li>)}
      </ol>
    </div>
  );
}
