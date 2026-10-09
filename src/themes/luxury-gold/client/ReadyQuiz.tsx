"use client";

// Screen ④'s interactive parts in luxury gold, on HeroUI: the question box (TextField + Input + Button; Enter sends,
// the first question with no quiz starts one), the right / wrong row with the optional note, a failed answer (Alert +
// `retry`), and Confirm. Each calls a server action handed down by the core (it refreshes the page) inside a
// transition; a control is off while its action runs. Words only from @/features/ready/words.
import { Alert, Button, Input, Label, TextField } from "@heroui/react";
import { useState, useTransition, type FormEvent } from "react";
import type { ReadyActions } from "@/core/theme/contract";
import {
  ask as askWord, confirm as confirmWord, markRight, markWrong, restartQuiz, retry as retryWord, startQuiz as startWord, wrongNote,
} from "@/features/ready/words";

export function QuizAsk({ hasQuiz, restart, startQuiz, ask }: {
  hasQuiz: boolean; restart: boolean; startQuiz: ReadyActions["startQuiz"]; ask: ReadyActions["ask"];
}) {
  const [text, setText] = useState("");
  const [busy, start] = useTransition();
  const send = (e?: FormEvent) => {
    e?.preventDefault();
    const q = text.trim();
    if (!q || busy) return;
    start(async () => {
      if (!hasQuiz) {
        const s = await startQuiz();
        if (!s.ok) return;
      }
      if ((await ask(q)).ok) setText("");
    });
  };
  return (
    <div className="lg-ready-ask">
      {(!hasQuiz || restart) && (
        // when the quiz is stale or full, (re)starting is the one way on — the page's primary action then
        <Button variant={restart ? "primary" : "secondary"} isDisabled={busy} onPress={() => start(async () => { await startQuiz(); })}>
          {hasQuiz ? restartQuiz : startWord}
        </Button>
      )}
      <form className="lg-ready-ask-form" onSubmit={send}>
        {/* labelled by the quiz heading; Enter sends */}
        <TextField className="lg-ready-field" value={text} onChange={setText} isDisabled={busy || restart} aria-labelledby="lg-ready-quiz">
          <Input maxLength={1000} />
        </TextField>
        <Button type="submit" variant="primary" isDisabled={busy || restart || !text.trim()}>
          {askWord}
        </Button>
      </form>
    </div>
  );
}

export function QuizMark({ itemId, mark, note, onMark }: {
  itemId: string; mark: "right" | "wrong" | null; note: string | null; onMark: ReadyActions["mark"];
}) {
  const [busy, start] = useTransition();
  const [noteText, setNoteText] = useState("");
  if (mark) {
    // a mark is final (SPEC-A-004 rule 5): a stamp, with the note when there is one
    return (
      <p className="lg-ledger-mark" data-mark={mark}>
        <span className="lg-ledger-stamp">{mark === "right" ? markRight : markWrong}</span>
        {note && <span className="lg-ledger-note">{note}</span>}
      </p>
    );
  }
  // right and wrong side by side, then the note under them — it goes with wrong (critique C-012 rows 1–2)
  return (
    <div className="lg-ledger-actions">
      <Button variant="secondary" isDisabled={busy} onPress={() => start(async () => { await onMark(itemId, "right"); })}>
        {markRight}
      </Button>
      <Button variant="secondary" isDisabled={busy} onPress={() => start(async () => { await onMark(itemId, "wrong", noteText); })}>
        {markWrong}
      </Button>
      <TextField className="lg-ready-field lg-ledger-notefield" value={noteText} onChange={setNoteText} isDisabled={busy}>
        <Label className="lg-group-title">{wrongNote}</Label>
        <Input maxLength={2000} />
      </TextField>
    </div>
  );
}

/** A `failed` item: REQ-007 l.54's words + the `retry` button = the same question asked again. It never counts. */
export function QuizRetry({ text, question, ask }: { text: string; question: string; ask: ReadyActions["ask"] }) {
  const [busy, start] = useTransition();
  return (
    <Alert className="lg-ledger-failed" status="warning">
      <Alert.Content>
        <Alert.Title>{text}</Alert.Title>
      </Alert.Content>
      <Button variant="secondary" isDisabled={busy} onPress={() => start(async () => { await ask(question); })}>
        {retryWord}
      </Button>
    </Alert>
  );
}

export function GateConfirm({ enabled, confirm }: { enabled: boolean; confirm: ReadyActions["confirm"] }) {
  const [busy, start] = useTransition();
  return (
    <Button className="lg-ready-confirm" variant="primary" isDisabled={!enabled || busy} onPress={() => start(async () => { await confirm(); })}>
      {confirmWord}
    </Button>
  );
}
