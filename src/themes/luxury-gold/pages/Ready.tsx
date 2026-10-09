// Screen ④ (`readyPage`, REQ-007) in luxury gold — stage + plaque (direction § 1).
// Stage: the work as a row of medallions (stuck ones sealed) with the counts beside it — or, for a project with no
// parts, the core's `emptyProject` line — then the quiz as a ledger: question → answer → the parts it used (links) →
// `markRight` / `markWrong`. Plaque: the gate. Its bold slot holds what is true now: the `confirmed` state (D-030), or
// the `stale` reason while the quiz is stale (the old score goes quiet), or else the score; then Confirm, the other
// reasons as links to where each is fixed, the confirmed version, and Build (off, with why). In reading order the
// plaque comes right after the summary, so on a phone the reason Confirm is off is seen before the long quiz.
// TASK-C-016 = REVIEW-A-003 rows 1, 2, 4–11. Words only from @/core/words, @/features/ready/words (PM 2026-10-09) or
// the view model; never typed here.
import type { ReadyPageProps } from "@/core/theme/contract";
import { findRequired, requiredId, requiredProps } from "@/core/theme/required";
import { emptyProject, pageLabel, participantKind } from "@/core/words";
import {
  botFailed, build as buildWord, changedSince, confirmed, notInSpec, partsUsed, quizHeading, quizHint, readyPage, score, scoreEarly,
} from "@/features/ready/words";
import { GateConfirm, QuizAsk, QuizMark, QuizRetry, ReadySteps } from "../client/ReadyQuiz";
import { Medallion } from "../primitives/Medallion";
import { Seal } from "../primitives/Seal";

const ids = { lead: "lg-ready-lead", reasons: "lg-ready-reasons", hint: "lg-ready-hint", quiz: "lg-ready-quiz", build: "lg-ready-build-why" };

export function Ready({ vm, actions, required }: ReadyPageProps) {
  const props = (id: string) => {
    const item = findRequired(required, id);
    return item ? requiredProps(item) : {};
  };
  const q = vm.quiz;
  const empty = vm.gate.reasons.some((r) => r.code === "empty");
  // the plaque's bold slot: what is true now — an empty project (its way to the chat), a confirmed state, or the reason
  // a stale quiz no longer counts (critique C-016 P2-a: an empty plaque opened with the off Confirm)
  const lead = vm.gate.reasons.find((r) => r.code === "empty" || r.code === "confirmed")
    ?? (q?.stale ? vm.gate.reasons.find((r) => r.code === "stale") : undefined);
  const rest = vm.gate.reasons.filter((r) => r !== lead);
  const scoreLine = q ? (q.score !== null ? score(q.score, q.marked) : scoreEarly(q.marked)) : null;
  // the score is quiet when it is not the news: before 5 marks (row 4), on a stale quiz (row 2), or under `confirmed`
  const scoreTone = q?.score === null ? "early" : q?.stale || lead ? "quiet" : undefined;
  const describedBy = [lead && ids.lead, rest.length > 0 && ids.reasons].filter(Boolean).join(" ") || undefined;
  const lastFailed = q?.items.at(-1)?.status === "failed";
  return (
    <div className="lg-page lg-page-split lg-ready">
      {/* the summary: the work first (R1) */}
      <section className="lg-page-stage lg-ready-summary" aria-labelledby="lg-ready-title">
        <h1 id="lg-ready-title" className="lg-page-title">{readyPage}</h1>
        {empty ? (
          // row 8: a project with nothing in it says so here; its one gate reason leads to the chat
          <p className="lg-empty-list">{emptyProject}</p>
        ) : (
          <>
            {vm.steps.length > 0 && (
              <ReadySteps>
                <ol className="lg-ready-steps">
                  {vm.steps.map((s) => (
                    <li key={s.key}>
                      <a className="lg-ready-step" href={s.href} data-stuck={s.stuck || undefined}>
                        <Medallion small number={s.number} title={s.title} end={s.ends} stuck={s.stuck ? s.stuckWordings : undefined} />
                      </a>
                    </li>
                  ))}
                </ol>
              </ReadySteps>
            )}
            <dl className="lg-ready-counts">
              <div><dt>{pageLabel.screens}</dt><dd>{vm.counts.screens}</dd></div>
              <div><dt>{pageLabel.api}</dt><dd>{vm.counts.apis}</dd></div>
              <div><dt>{participantKind.role}</dt><dd>{vm.counts.people}</dd></div>
            </dl>
          </>
        )}
      </section>

      {/* the gate (R3–R5) */}
      <aside className="lg-plaque lg-ready-gate">
        {lead && (
          <p id={ids.lead} className="lg-ready-lead" data-code={lead.code} {...props(requiredId.readyReason(lead.code))}>
            {/* confirmed is a state, not something to go and fix: text, no link */}
            {lead.code === "confirmed" ? lead.text : <a href={lead.href}>{lead.text}</a>}
          </p>
        )}
        {scoreLine && (
          <p className="lg-ready-score" role="status" data-tone={scoreTone} {...props(requiredId.readyScore)}>
            {scoreLine}
          </p>
        )}
        <GateConfirm enabled={vm.gate.ok} confirm={actions.confirm} describedBy={describedBy} />
        {rest.length > 0 && (
          <ul id={ids.reasons} className="lg-ready-reasons">
            {rest.map((r) => (
              <li key={r.code}>
                {r.code === "stuck" && <Seal size={18} />}
                <a href={r.href} {...props(requiredId.readyReason(r.code))}>
                  {r.text}
                </a>
              </li>
            ))}
          </ul>
        )}
        {/* under a lead the version lines are a footnote — the lead already says it (critique C-016 P2-b) */}
        {vm.version && <p className="lg-ready-version" data-quiet={lead ? true : undefined}>{confirmed(vm.version.n, vm.version.dateLabel)}</p>}
        {vm.version?.changedSince && <p className="lg-ready-changed" data-quiet={lead ? true : undefined}>{changedSince(vm.version.n)}</p>}
        <div className="lg-ready-build">
          <button type="button" className="lg-ready-build-button" disabled aria-describedby={ids.build}>
            {buildWord}
          </button>
          <p id={ids.build}>{vm.build.reason}</p>
        </div>
      </aside>

      {/* the quiz as a ledger (R2) */}
      <section id="quiz" className="lg-page-stage lg-ready-quiz" aria-labelledby={ids.quiz}>
        <h2 id={ids.quiz} className="lg-work-title">{quizHeading}</h2>
        <p id={ids.hint} className="lg-ready-hint">{quizHint}</p>
        <QuizAsk
          hasQuiz={q !== null}
          restart={q !== null && (q.stale || q.full)}
          startQuiz={actions.startQuiz}
          ask={actions.ask}
          labelledBy={ids.quiz}
          describedBy={ids.hint}
          off={empty}
        />
        {/* row 6: a polite region that is always present, so a newly failed answer is announced */}
        <p className="lg-sr-only" role="status">{lastFailed ? botFailed : ""}</p>
        {q && q.items.length > 0 && (
          <ol className="lg-ledger" data-stale={q.stale || undefined}>
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
