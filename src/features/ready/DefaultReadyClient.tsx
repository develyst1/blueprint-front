"use client";

// The default screen ④ page's interactive parts: the question box, the mark buttons, Confirm. Each calls a server
// action (which refreshes the page) inside a transition; a button is off while its action runs. A failed action leaves
// what the user typed in place — the refreshed page shows why through the gate reasons (REQ-007 has no error words).
import { useState, useTransition, type FormEvent } from "react";
import type { ReadyActions } from "./contract";
import {
  ask as askWord, confirm as confirmWord, markRight, markWrong, restartQuiz, retry as retryWord, wrongNote,
} from "./words";
import s from "./ready.module.css";

export function AskBox({ hasQuiz, restart, startQuiz, ask }: {
  hasQuiz: boolean; restart: boolean; startQuiz: ReadyActions["startQuiz"]; ask: ReadyActions["ask"];
}) {
  const [text, setText] = useState("");
  const [busy, start] = useTransition();
  const send = (e?: FormEvent) => {
    e?.preventDefault();
    const q = text.trim();
    if (!q || busy) return;
    start(async () => {
      // the first question with no quiz starts one (TASK-C-011 item 6)
      if (!hasQuiz) {
        const s0 = await startQuiz();
        if (!s0.ok) return;
      }
      const r = await ask(q);
      if (r.ok) setText("");
    });
  };
  return (
    <div className={s.askRow}>
      {/* one next step (REVIEW-A-003 row 7): before the first quiz the box + ask is the step (the first question starts
          the quiz); restarting is offered only when the quiz is stale or full */}
      {restart && (
        <button type="button" className={s.button} disabled={busy} onClick={() => start(async () => { await startQuiz(); })}>
          {restartQuiz}
        </button>
      )}
      <form className={s.askForm} onSubmit={send}>
        {/* Enter sends (an <input>), and `askWord` beside it; labelled by the quiz heading */}
        <input
          className={s.input}
          value={text}
          onChange={(e) => setText(e.target.value)}
          aria-labelledby="ready-quiz"
          maxLength={1000}
          disabled={busy || restart}
        />
        <button type="submit" className={s.button} disabled={busy || restart || !text.trim()}>
          {askWord}
        </button>
      </form>
    </div>
  );
}

export function MarkButtons({ itemId, mark, note, onMark }: {
  itemId: string; mark: "right" | "wrong" | null; note: string | null; onMark: ReadyActions["mark"];
}) {
  const [busy, start] = useTransition();
  const [wrongNoteText, setWrongNoteText] = useState("");
  if (mark) {
    // a mark is final (SPEC-A-004 rule 5): show it, with the note when there is one
    return (
      <p className={s.marked} data-mark={mark}>
        {mark === "right" ? markRight : markWrong}
        {note ? <span className={s.note}>{note}</span> : null}
      </p>
    );
  }
  return (
    <div className={s.markRow}>
      <button type="button" className={s.button} disabled={busy} onClick={() => start(async () => { await onMark(itemId, "right"); })}>
        {markRight}
      </button>
      <label className={s.noteField}>
        <span className={s.label}>{wrongNote}</span>
        <input className={s.input} value={wrongNoteText} onChange={(e) => setWrongNoteText(e.target.value)} maxLength={2000} disabled={busy} />
      </label>
      <button
        type="button"
        className={s.button}
        disabled={busy}
        onClick={() => start(async () => { await onMark(itemId, "wrong", wrongNoteText); })}
      >
        {markWrong}
      </button>
    </div>
  );
}

/** A `failed` item's `retry` button: the same question asked again (REQ-007 l.54). The failed item stays; it never counts. */
export function RetryButton({ question, ask }: { question: string; ask: ReadyActions["ask"] }) {
  const [busy, start] = useTransition();
  return (
    <button type="button" className={s.button} disabled={busy} onClick={() => start(async () => { await ask(question); })}>
      {retryWord}
    </button>
  );
}

export function ConfirmButton({ enabled, confirm }: { enabled: boolean; confirm: ReadyActions["confirm"] }) {
  const [busy, start] = useTransition();
  return (
    <button type="button" className={`${s.button} ${s.primary}`} disabled={!enabled || busy} onClick={() => start(async () => { await confirm(); })}>
      {confirmWord}
    </button>
  );
}
