// ภาพรวม — each work's steps as numbered medallion cards (they are a sequence), each a link to its sequence;
// the decisions on a plaque beside them (rule / cases / open behind words.showMore). Required: every step title.
import type { OverviewVM, RequiredItem } from "@/core/theme/contract";
import { findRequired, requiredId, requiredProps } from "@/core/theme/required";
import { decisionPart, pageLabel } from "@/core/words";
import { MoreDisclosure } from "../client/MoreDisclosure";
import { Medallion } from "../primitives/Medallion";

export function Overview({ vm, required }: { vm: OverviewVM; required: RequiredItem[] }) {
  return (
    // Split into stage + plaque only when the plaque is drawn; otherwise the picture takes the full width.
    <div className={vm.decisions.length > 0 ? "lg-page lg-page-split" : "lg-page"}>
      <div className="lg-page-stage">
        <h1 className="lg-page-title">{pageLabel.overview}</h1>
        {vm.works.map((w) => (
          <section key={w.key} className="lg-work" aria-labelledby={`lg-work-${w.key}`}>
            <h2 id={`lg-work-${w.key}`} className="lg-work-title">
              {w.title}
            </h2>
            <ol className="lg-step-cards">
              {w.steps.map((s) => {
                const item = findRequired(required, requiredId.step(s.key));
                return (
                  <li key={s.key}>
                    <a className="lg-step-card" href={s.href} data-stuck={s.stuck || undefined}>
                      <Medallion
                        number={s.number}
                        title={s.title}
                        end={s.ends}
                        stuck={s.stuck ? s.stuckWordings : undefined}
                        stuckVisible
                        titleProps={item ? requiredProps(item) : undefined}
                      />
                    </a>
                  </li>
                );
              })}
            </ol>
          </section>
        ))}
      </div>

      {vm.decisions.length > 0 && (
        <aside className="lg-plaque lg-decisions">
          {vm.decisions.map((d) => (
            <section key={d.key} className="lg-decision">
              <h2 className="lg-plaque-title">{d.title}</h2>
              <MoreDisclosure>
                <dl className="lg-decision-parts">
                  {/* The rule is not repeated when it is the decision's own title (R1 lesson, REVIEW-C-001 row 3). */}
                  {d.rule !== d.title && (
                    <>
                      <dt>{decisionPart.rule}</dt>
                      <dd>{d.rule}</dd>
                    </>
                  )}
                  {d.cases.length > 0 && <dt>{decisionPart.cases}</dt>}
                  {d.cases.map((c) => (
                    <dd key={c}>{c}</dd>
                  ))}
                  {d.open && (
                    <>
                      <dt>{decisionPart.open}</dt>
                      <dd className="lg-decision-open">{d.open}</dd>
                    </>
                  )}
                </dl>
              </MoreDisclosure>
              {d.covers.length > 0 && (
                <ul className="lg-chip-links">
                  {d.covers.map((c) => (
                    <li key={c.key}>
                      <a className="lg-chip-link" href={c.href}>
                        {c.title}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </aside>
      )}
    </div>
  );
}
