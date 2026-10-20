// ภาพรวม — the brief (REQ-017, comp A), top-down as an analyst hands it back: what we understood (each work's goal, in
// serif, with its source line) → ใครเกี่ยวข้อง (role cards) → เส้นทางของงาน (the steps as numbered medallion cards, they
// are a sequence, each a link to its sequence; the endings under them) → กติกาที่ตกลงกันแล้ว (rule / cases / open behind
// words.showMore) → ยังรอคำตอบจากคุณ. Beside it, a plaque: the readiness and what the system needs behind it, each count a
// link into the back room. Required: every step title, every role title, every goal.
import type { OverviewVM, RequiredItem } from "@/core/theme/contract";
import { findRequired, requiredId, requiredProps } from "@/core/theme/required";
import { brief, decisionPart, pageLabel } from "@/core/words";
import { MoreDisclosure } from "../client/MoreDisclosure";
import { Medallion } from "../primitives/Medallion";

export function Overview({ vm, required }: { vm: OverviewVM; required: RequiredItem[] }) {
  const marked = (id: string) => {
    const item = findRequired(required, id);
    return item ? requiredProps(item) : undefined;
  };
  const back = new Map((vm.frame.rooms.find((r) => r.id === "back")?.pages ?? []).map((p) => [p.page, p.href]));
  const counts: { label: string; n: number; href: string | undefined }[] = [
    { label: brief.rail.screens, n: vm.back.screens, href: back.get("screens") },
    { label: brief.rail.apis, n: vm.back.apis, href: back.get("api") },
    { label: brief.rail.systems, n: vm.back.systems, href: back.get("web") },
    { label: brief.rail.data, n: vm.back.data, href: back.get("web") },
  ];
  return (
    <div className="lg-page lg-page-split lg-brief">
      <div className="lg-page-stage">
        <h1 className="lg-page-title">{pageLabel.overview}</h1>

        {vm.works.filter((w) => w.goal).map((w) => (
          <section key={w.key} className="lg-goal">
            <p className="lg-goal-text" {...marked(requiredId.goal(w.key))}>{w.goal}</p>
            <p className="lg-goal-source">{brief.source(vm.version)}</p>
          </section>
        ))}

        <section className="lg-work" aria-labelledby="lg-brief-roles">
          <h2 id="lg-brief-roles" className="lg-work-title">{brief.roles}</h2>
          <ul className="lg-roles">
            {vm.roles.map((r) => (
              <li key={r.key} className="lg-role">
                <span className="lg-role-title" {...marked(requiredId.role(r.key))}>{r.title}</span>
                {r.duty && <span className="lg-role-duty">{r.duty}</span>}
              </li>
            ))}
          </ul>
        </section>

        <section className="lg-work" aria-labelledby="lg-brief-path">
          <h2 id="lg-brief-path" className="lg-work-title">{brief.path}</h2>
          {vm.works.map((w) => {
            const endings = w.steps.filter((s) => s.ends);
            return (
              <div key={w.key} className="lg-brief-path">
                {vm.works.length > 1 && <h3 className="lg-brief-path-work">{w.title}</h3>}
                <ol className="lg-step-cards">
                  {w.steps.filter((s) => !s.ends).map((s) => (
                    <li key={s.key}>
                      <a className="lg-step-card" href={s.href} data-stuck={s.stuck || undefined}>
                        <Medallion
                          number={s.number}
                          title={s.title}
                          stuck={s.stuck ? s.stuckWordings : undefined}
                          stuckVisible
                          titleProps={marked(requiredId.step(s.key))}
                        />
                      </a>
                    </li>
                  ))}
                </ol>
                {endings.length > 0 && (
                  <ul className="lg-endings">
                    {endings.map((s, i) => (
                      <li key={s.key} data-stuck={s.stuck || undefined}>
                        <span className="lg-ending-n">{brief.ending(i + 1, "")}</span>
                        <a className="lg-ending-link" href={s.href}>
                          <span {...marked(requiredId.step(s.key))}>{s.title}</span>
                        </a>
                        {s.stuckWordings.map((t, j) => (
                          <span key={j} className="lg-item-stuck">{t}</span>
                        ))}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </section>

        {vm.decisions.length > 0 && (
          <section className="lg-work" aria-labelledby="lg-brief-rules">
            <h2 id="lg-brief-rules" className="lg-work-title">{brief.rules}</h2>
            <div className="lg-rules">
              {vm.decisions.map((d) => (
                <section key={d.key} className="lg-decision">
                  <h3 className="lg-decision-title">{d.title}</h3>
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
            </div>
          </section>
        )}

        <section className="lg-work" aria-labelledby="lg-brief-waiting">
          <h2 id="lg-brief-waiting" className="lg-work-title">{brief.waiting}</h2>
          {vm.questions.length > 0 ? (
            <ul className="lg-questions">
              {vm.questions.map((q) => (
                <li key={q.key}>
                  <a className="lg-question" href={q.target.href}>{q.title}</a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="lg-goal-source">{brief.noQuestions}</p>
          )}
        </section>
      </div>

      <aside className="lg-plaque lg-rail">
        <p className="lg-rail-ready" data-stuck={vm.frame.readiness.stuckCount > 0 || undefined}>{vm.frame.readiness.label}</p>
        <h2 className="lg-plaque-title">{brief.rail.title}</h2>
        <ul className="lg-rail-counts">
          {counts.map((c) => (
            <li key={c.label}>
              <a className="lg-rail-row" href={c.href}>
                <span>{c.label}</span>
                <span className="lg-rail-n">{c.n}</span>
              </a>
            </li>
          ))}
          <li>
            <a className="lg-rail-row" href={back.get("sequence")}>
              <span>{brief.rail.interactions(vm.back.interactions)}</span>
            </a>
          </li>
          <li className="lg-rail-row" data-not-yet>
            <span>{brief.rail.er}</span>
            <span className="lg-rail-not-yet">{brief.rail.notYet}</span>
          </li>
          <li className="lg-rail-row" data-not-yet>
            <span>{brief.rail.services}</span>
            <span className="lg-rail-not-yet">{brief.rail.notYet}</span>
          </li>
        </ul>
      </aside>
    </div>
  );
}
