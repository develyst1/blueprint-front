// The default screen ④ page (SPEC-C-002, TASK-C-011) — every theme's fallback until it has its own `ready`, like the
// core's default theme: plain HTML + one CSS module, no theme library. Picture first: the steps as a small numbered
// row, the counts and what is stuck; then the quiz (#quiz); then the gate (Confirm + why not) and Build.
// Words only from ./words and @/core/words; a word REQ-007 lacks is a question in the TASK, never typed here.
import { pageLabel, participantKind } from "@/core/words";
import { requiredProps } from "@/core/theme/required";
import type { ReadyPageProps } from "./contract";
import { AskBox, ConfirmButton, MarkButtons, RetryButton } from "./DefaultReadyClient";
import { readyRequiredId } from "./load";
import {
  botFailed, build as buildWord, changedSince, confirmed, notInSpec, partsUsed, quizHeading, quizHint, readyPage, reasons, score, scoreEarly,
} from "./words";
import s from "./ready.module.css";

export function DefaultReady({ vm, actions, required }: ReadyPageProps) {
  const req = new Map(required.map((r) => [r.id, r]));
  const props = (id: string) => {
    const item = req.get(id);
    return item ? requiredProps(item) : {};
  };
  const q = vm.quiz;
  return (
    <div className={s.page}>
      <h1 className={s.title}>{readyPage}</h1>

      {/* the summary — the work as a picture first (R1) */}
      <section className={s.summary}>
        <ol className={s.steps}>
          {vm.steps.map((st) => (
            <li key={st.key} className={s.step} data-stuck={st.stuck || undefined}>
              <span className={s.stepNum}>{st.number}</span>
              <span>{st.title}</span>
            </li>
          ))}
        </ol>
        <ul className={s.counts}>
          <li><span className={s.countN}>{vm.counts.screens}</span> {pageLabel.screens}</li>
          <li><span className={s.countN}>{vm.counts.apis}</span> {pageLabel.api}</li>
          <li><span className={s.countN}>{vm.counts.people}</span> {participantKind.role}</li>
        </ul>
        {vm.stuck.count > 0 && (
          <a className={s.stuckLink} href={vm.stuck.href}>
            {reasons.stuck(vm.stuck.count)}
          </a>
        )}
        {vm.version && <p className={s.version}>{confirmed(vm.version.n, vm.version.dateLabel)}</p>}
        {vm.version?.changedSince && <p className={s.changed}>{changedSince(vm.version.n)}</p>}
      </section>

      {/* the quiz (R2) */}
      <section id="quiz" className={s.quiz} aria-labelledby="ready-quiz">
        <h2 id="ready-quiz" className={s.h2}>{quizHeading}</h2>
        <p className={s.hint}>{quizHint}</p>
        {q && (
          <p className={s.score} {...props(readyRequiredId.score)}>
            {q.score !== null ? score(q.score, q.marked) : scoreEarly(q.marked)}
          </p>
        )}
        <AskBox
          hasQuiz={q !== null}
          restart={q !== null && (q.stale || q.full)}
          startQuiz={actions.startQuiz}
          ask={actions.ask}
        />
        {q && q.items.length > 0 && (
          <ol className={s.items}>
            {q.items.map((it) => (
              <li key={it.id} className={s.item} data-status={it.status}>
                <p className={s.question}>{it.question}</p>
                {it.answer && <p className={s.answer}>{it.answer}</p>}
                {/* a `failed` item has no answer and is never markable (SPEC-A-004 rule 3): `botFailed` + the `retry` button (REQ-007 l.54) */}
                {it.status === "failed" && (
                  <div className={s.failed}>
                    <p className={s.answer}>{botFailed}</p>
                    <RetryButton question={it.question} ask={actions.ask} />
                  </div>
                )}
                {it.notInSpec && <p className={s.notInSpec}>{notInSpec}</p>}
                {it.parts.length > 0 && (
                  <div className={s.parts}>
                    <span className={s.label}>{partsUsed}</span>
                    <ul className={s.partLinks}>
                      {it.parts.map((p) => (
                        <li key={p.key}>
                          <a href={p.href}>{p.title}</a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {it.status === "answered" && <MarkButtons itemId={it.id} mark={it.mark} note={it.note} onMark={actions.mark} />}
              </li>
            ))}
          </ol>
        )}
      </section>

      {/* the gate (R3) and Build (R5) */}
      <section className={s.gate}>
        <ConfirmButton enabled={vm.gate.ok} confirm={actions.confirm} />
        {vm.gate.reasons.length > 0 && (
          <ul className={s.reasons}>
            {vm.gate.reasons.map((r) => (
              <li key={r.code}>
                <a href={r.href} {...props(readyRequiredId.reason(r.code))}>
                  {r.text}
                </a>
              </li>
            ))}
          </ul>
        )}
        <div className={s.build}>
          <button type="button" className={s.button} disabled>
            {buildWord}
          </button>
          <p className={s.buildReason}>{vm.build.reason}</p>
        </div>
      </section>
    </div>
  );
}
