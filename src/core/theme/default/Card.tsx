// The default project card (home): name, date, readiness — the whole card is the link.
import type { ProjectCardVM } from "../contract";
import s from "./default.module.css";

export function Card({ card }: { card: ProjectCardVM }) {
  return (
    <a className={s.card} href={card.href}>
      <h2>{card.project.name}</h2>
      <span className={s.muted}>{card.project.createdLabel}</span>
      {/* the stuck style only when something is stuck — an empty project is not ready, but neutral (TASK-B-010 Q3) */}
      <span className={card.readiness.stuckCount > 0 ? `${s.readiness} ${s.readinessStuck}` : s.readiness}>{card.readiness.label}</span>
    </a>
  );
}
