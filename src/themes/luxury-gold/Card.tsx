// The luxury gold project card on the projects home: a link to the project, styled as a HeroUI Card.
// HeroUI's Card renders a <div>; an interactive card is a native <a> carrying the card's own classes
// (cardVariants — the accessible pattern in HeroUI's Card docs). Light on purpose (C-K3): no Tabs, Table,
// Popover, Drawer or diagram code — the home loads every visible card's theme.
import { cardVariants } from "@heroui/react";
import type { ProjectCardVM } from "@/core/theme/contract";
import { Readiness } from "./primitives/Seal";

export function Card({ card }: { card: ProjectCardVM }) {
  const s = cardVariants({ variant: "default" });
  return (
    <a href={card.href} className={`${s.base()} lg-card`}>
      {/* h2: the home's own heading is the h1 (REVIEW-C-002 row 24). A div, because a heading may not sit in a span. */}
      <div className={`${s.header()} lg-card-head`}>
        <h2 className="lg-card-name">{card.project.name}</h2>
        <span className="lg-card-date">{card.project.createdLabel}</span>
      </div>
      <span className="lg-card-foot">
        <Readiness stuckCount={card.readiness.stuckCount} label={card.readiness.label} ready={card.readiness.ready} />
      </span>
    </a>
  );
}
