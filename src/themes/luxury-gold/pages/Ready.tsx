// Screen ④ (`readyPage`, REQ-007) in luxury gold — stage + plaque (direction § 1).
// Stage: the work as a row of medallions (stuck ones sealed) with the counts beside it, then the quiz as a ledger —
// question → answer → the parts it used (links) → `markRight` / `markWrong`. Plaque: the gate — the score, Confirm, every reason as a
// link to where it is fixed, the confirmed version, and Build (off, with why). In reading order the plaque comes right
// after the summary, so on a phone the reason Confirm is off is seen before the long quiz.
// Words only from @/core/words, @/features/ready/words (PM 2026-10-09) or the view model; never typed here.
import type { ReadyPageProps } from "@/core/theme/contract";
import { findRequired, requiredProps } from "@/core/theme/required";
import { pageLabel, participantKind } from "@/core/words";
import {
  botFailed, build as buildWord, changedSince, confirmed, notInSpec, partsUsed, quizHeading, quizHint, readyPage, score, scoreEarly,
} from "@/features/ready/words";
import { GateConfirm, QuizAsk, QuizMark, QuizRetry } from "../client/ReadyQuiz";
import { Medallion } from "../primitives/Medallion";
import { Seal } from "../primitives/Seal";

/** The ready page's required ids. The core builds them in features/ready (readyRequired) and does not export them to
 *  themes yet — TASK-C-012 Q1; a drift here fails `test:required` at once. */
const req = { reason: (code: string) => `ready:reason:${code}`, score: "ready:score" };

export function Ready({ vm, actions, required }: ReadyPageProps) {
  const props = (id: string) => {
    const item = findRequired(required, id);
    return item ? requiredProps(item) : {};
  };
  const q = vm.quiz;
  const scoreLine = q ? (q.score !== null ? score(q.score, q.marked) : scoreEarly(q.marked)) : null;
  return (
    <div className="lg-page lg-page-split lg-ready">
      {/* the summary: the work first (R1) */}
      <section className="lg-page-stage lg-ready-summary" aria-labelledby="lg-ready-title">
        <h1 id="lg-ready-title" className="lg-page-title">{readyPage}</h1>
        <ol className="lg-ready-steps">
          {vm.steps.map((s) => (
            <li key={s.key}>
              <a className="lg-ready-step" href={s.href} data-stuck={s.stuck || undefined}>
                <Medallion small number={s.number} title={s.title} end={s.ends} stuck={s.stuck ? s.stuckWordings : undefined} />
              </a>
            </li>
          ))}
        </ol>
        <dl className="lg-ready-counts">
          <div><dt>{pageLabel.screens}</dt><dd>{vm.counts.screens}</dd></div>
          <div><dt>{pageLabel.api}</dt><dd>{vm.counts.apis}</dd></div>
          <div><dt>{participantKind.role}</dt><dd>{vm.counts.people}</dd></div>
        </dl>
      </section>

      {/* the gate (R3–R5) */}
      <aside className="lg-plaque lg-ready-gate">
        {scoreLine && (
          <p className="lg-ready-score" {...props(req.score)}>
            {scoreLine}
          </p>
        )}
        <GateConfirm enabled={vm.gate.ok} confirm={actions.confirm} />
        {vm.gate.reasons.length > 0 && (
          <ul className="lg-ready-reasons">
            {vm.gate.reasons.map((r) => (
              <li key={r.code}>
                {r.code === "stuck" && <Seal size={18} />}
                <a href={r.href} {...props(req.reason(r.code))}>
                  {r.text}
                </a>
              </li>
            ))}
          </ul>
        )}
        {vm.version && <p className="lg-ready-version">{confirmed(vm.version.n, vm.version.dateLabel)}</p>}
        {vm.version?.changedSince && <p className="lg-ready-changed">{changedSince(vm.version.n)}</p>}
        <div className="lg-ready-build">
          <button type="button" className="lg-ready-build-button" disabled>
            {buildWord}
          </button>
          <p>{vm.build.reason}</p>
        </div>
      </aside>

      {/* the quiz as a ledger (R2) */}
      <section id="quiz" className="lg-page-stage lg-ready-quiz" aria-labelledby="lg-ready-quiz">
        <h2 id="lg-ready-quiz" className="lg-work-title">{quizHeading}</h2>
        <p className="lg-ready-hint">{quizHint}</p>
        <QuizAsk hasQuiz={q !== null} restart={q !== null && (q.stale || q.full)} startQuiz={actions.startQuiz} ask={actions.ask} />
        {q && q.items.length > 0 && (
          <ol className="lg-ledger">
            {q.items.map((it) => (
              <li key={it.id} className="lg-ledger-row" data-status={it.status} data-mark={it.mark ?? undefined}>
                <span className="lg-ledger-n" aria-hidden="true">{String(it.position).padStart(2, "0")}</span>
                <div className="lg-ledger-body">
                  <p className="lg-ledger-question">{it.question}</p>
                  {it.answer && <p className="lg-ledger-answer">{it.answer}</p>}
                  {it.notInSpec && <p className="lg-ledger-notin">{notInSpec}</p>}
                  {it.status === "failed" && <QuizRetry text={botFailed} question={it.question} ask={actions.ask} />}
                  {it.parts.length > 0 && (
                    <div className="lg-ledger-parts">
                      <span className="lg-group-title">{partsUsed}</span>
                      <ul className="lg-chip-links">
                        {it.parts.map((p) => (
                          <li key={p.key}>
                            <a className="lg-chip-link" href={p.href}>{p.title}</a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {it.status === "answered" && <QuizMark itemId={it.id} mark={it.mark} note={it.note} onMark={actions.mark} />}
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
