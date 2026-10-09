"use client";

// The project card on the home (NotebookLM home, ref 13): a big tile first, then the name, date and readiness.
// The whole card is one link.
import type { ProjectCardVM } from "@/core/theme/contract";
import { Readiness } from "./Shell";
import { KindTile } from "./parts/Tile";
import s from "./pages/pages.module.css";

export function Card({ card }: { card: ProjectCardVM }) {
  return (
    <a href={card.href} className={s.projectCard}>
      <KindTile kind="work" size="lg" />
      <span className={s.projectName}>{card.project.name}</span>
      <span className={s.muted}>{card.project.createdLabel}</span>
      <Readiness readiness={card.readiness} required={[]} />
    </a>
  );
}
