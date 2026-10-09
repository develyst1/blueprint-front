"use client";

// Dev-only showcase of the luxury gold theme (TASK-C-003 primitives + TASK-C-004 shell, card, preview, states),
// drawn on the core's samples only. Team B's route renders <Showcase /> with nothing around it
// (SPEC-B-001 § "Dev showcase routes"), so it wraps itself in ThemeRoot. Removed when the real pages land.
// No section headings: any heading would be a word REQ-002 does not have — sections are separated by a rule.
import { Disclosure, Popover } from "@heroui/react";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { contentId } from "@/core/theme/anchors";
import type { PageState } from "@/core/theme/contract";
import {
  sampleApis,
  sampleCard,
  sampleFlowchart,
  sampleHistory,
  sampleSequence,
  sampleWeb,
  sampleOverview,
  samplePreview,
  sampleRequired,
  sampleScreens,
  sampleShellRequired,
  sampleStuck,
  sampleWorkOrder,
} from "@/core/model/samples";
import { Api } from "../pages/Api";
import { Flowchart } from "../pages/Flowchart";
import { History } from "../pages/History";
import { Sequence } from "../pages/Sequence";
import { Web } from "../pages/Web";
import { WorkOrder } from "../pages/WorkOrder";
import { Overview } from "../pages/Overview";
import { Screens } from "../pages/Screens";
import { Stuck } from "../pages/Stuck";
import { decisionPart, showMore } from "@/core/words";
import { Card } from "../Card";
import { Preview } from "../Preview";
import { Shell } from "../Shell";
import { State } from "../State";
import { ThemeRoot } from "../ThemeRoot";
import { KindMark } from "../primitives/KindMark";
import { Legend } from "../primitives/Legend";
import { Medallion } from "../primitives/Medallion";
import { Plaque } from "../primitives/Plaque";

const frame = sampleOverview.frame;
const work = sampleOverview.works[0];
const decision = sampleOverview.decisions[0];
const stuckItem = sampleStuck.items[0];
const handoffsOf = (stepKey: string) => sampleWorkOrder.layout.rows.find((r) => r.step.key === stepKey)?.handoffs ?? [];

const states: PageState[] = [
  { kind: "unreachable", retry: () => {} },
  { kind: "empty", page: "overview" },
  { kind: "notFound", homeHref: sampleCard.href },
];

// `?page=<id>` shows that page (list pages TASK-C-006, diagram pages TASK-C-005) in the shell, on the core samples.
function ListPage({ page }: { page: string }) {
  const req = (p: keyof typeof sampleRequired) => sampleRequired[p];
  const body =
    page === "overview" ? { frame: sampleOverview.frame, el: <Overview vm={sampleOverview} required={req("overview")} /> }
    : page === "screens" ? { frame: sampleScreens.frame, el: <Screens vm={sampleScreens} required={req("screens")} /> }
    : page === "api" ? { frame: sampleApis.frame, el: <Api vm={sampleApis} required={req("api")} /> }
    : page === "stuck" ? { frame: sampleStuck.frame, el: <Stuck vm={sampleStuck} required={req("stuck")} /> }
    : page === "history" ? { frame: sampleHistory.frame, el: <History vm={sampleHistory} required={req("history")} /> }
    : page === "flowchart" ? { frame: sampleFlowchart.frame, el: <Flowchart vm={sampleFlowchart} required={req("flowchart")} /> }
    : page === "workOrder" ? { frame: sampleWorkOrder.frame, el: <WorkOrder vm={sampleWorkOrder} required={req("workOrder")} /> }
    : page === "sequence" ? { frame: sampleSequence.frame, el: <Sequence vm={sampleSequence} required={req("sequence")} /> }
    : page === "web" ? { frame: sampleWeb.frame, el: <Web vm={sampleWeb} required={req("web")} /> }
    : null;
  if (!body) return null;
  return (
    <ThemeRoot>
      <Shell frame={body.frame} required={sampleShellRequired}>
        {/* What the core's pages pass as children: the content inside <main id="content"> (SPEC-B-001 § Skip link). */}
        <main id={contentId} tabIndex={-1}>
          {body.el}
        </main>
      </Shell>
    </ThemeRoot>
  );
}

function Pick() {
  const page = useSearchParams().get("page");
  return page ? <ListPage page={page} /> : <Foundation />;
}

export function Showcase() {
  return (
    <Suspense fallback={null}>
      <Pick />
    </Suspense>
  );
}

function Foundation() {
  const [open, setOpen] = useState(false);
  return (
    <ThemeRoot>
      <Shell frame={frame} required={sampleShellRequired}>
        <main id={contentId} tabIndex={-1} className="lg-showcase">
          <h1 className="lg-showcase-title">{work.title}</h1>

          <div className="lg-showcase-stage">
            <section className="lg-showcase-picture" aria-label={work.title}>
              <ol className="lg-showcase-steps">
                {work.steps.map((s) =>
                  s.stuck ? (
                    <li key={s.key}>
                      {/* Popover.Trigger is itself role="button" — the medallion inside must not be a second button. */}
                      <Popover>
                        <Popover.Trigger
                          className="lg-medallion-trigger"
                          aria-label={`${s.number} ${s.title}; ${s.stuckWordings.join("; ")}`}
                        >
                          <Medallion number={s.number} title={s.title} end={s.ends} stuck={s.stuckWordings} />
                        </Popover.Trigger>
                        <Popover.Content placement="bottom">
                          <Popover.Dialog>
                            <Popover.Heading>{s.title}</Popover.Heading>
                            <ol className="lg-showcase-handoffs">
                              {handoffsOf(s.key).map((h) => (
                                <li key={h.key}>
                                  <span className="lg-showcase-handoff-n">{h.order}</span>
                                  {h.text}
                                </li>
                              ))}
                            </ol>
                          </Popover.Dialog>
                        </Popover.Content>
                      </Popover>
                    </li>
                  ) : (
                    <li key={s.key}>
                      <Medallion number={s.number} title={s.title} end={s.ends} />
                    </li>
                  ),
                )}
              </ol>
              {/* The legend decodes something on screen: the participants, each with its kind mark. */}
              <Legend />
              <ul className="lg-showcase-participants">
                {sampleWorkOrder.layout.lanes.map((p) => (
                  <li key={p.key}>
                    <KindMark kind={p.kind} />
                    {p.title}
                  </li>
                ))}
              </ul>
            </section>

            <Plaque title={stuckItem.target.title} stuck={[{ wording: stuckItem.wording, title: stuckItem.title }]}>
              <Disclosure isExpanded={open} onExpandedChange={setOpen}>
                <Disclosure.Heading>
                  <Disclosure.Trigger className="lg-showcase-more">
                    {showMore}
                    <Disclosure.Indicator />
                  </Disclosure.Trigger>
                </Disclosure.Heading>
                <Disclosure.Content>
                  <Disclosure.Body>
                    <dl className="lg-showcase-decision">
                      <dt>{decisionPart.rule}</dt>
                      <dd>{decision.rule}</dd>
                      <dt>{decisionPart.cases}</dt>
                      {decision.cases.map((c) => (
                        <dd key={c}>{c}</dd>
                      ))}
                      {decision.open && (
                        <>
                          <dt>{decisionPart.open}</dt>
                          <dd>{decision.open}</dd>
                        </>
                      )}
                    </dl>
                  </Disclosure.Body>
                </Disclosure.Content>
              </Disclosure>
            </Plaque>
          </div>

          <hr className="lg-showcase-rule" />
          <div className="lg-showcase-cards">
            <Card card={sampleCard} />
            <Preview sample={samplePreview} />
          </div>

          <hr className="lg-showcase-rule" />
          <div className="lg-showcase-states">
            {states.map((st) => (
              <State key={st.kind} frame={null} state={st} required={[]} />
            ))}
          </div>
        </main>
      </Shell>
    </ThemeRoot>
  );
}
