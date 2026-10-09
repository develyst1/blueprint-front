"use client";

// Screen ④'s interactive parts in luxury gold, on HeroUI: the question box (TextField + Input + Button; Enter sends,
// the first question with no quiz starts one — the only way to start, REVIEW-A-003 row 7), the right / wrong row with
// the optional note, a failed answer (a ledger line + `retry`, row 11), and Confirm (a Tab stop even when off, row 5).
// Each calls a server action handed down by the core (it refreshes the page) inside a transition; a control is off
// while its action runs. Words only from @/features/ready/words.
import { Button, Input, Label, ScrollShadow, TextField } from "@heroui/react";
import { useEffect, useRef, useState, useTransition, type FormEvent, type ReactNode } from "react";
import type { ReadyActions } from "@/core/theme/contract";
import {
  ask as askWord, confirm as confirmWord, markRight, markWrong, restartQuiz, retry as retryWord, wrongNote,
} from "@/features/ready/words";

/** `off`: nothing to ask about yet (an empty project — critique C-016 P2-a); the page's lead leads to the chat. */
export function QuizAsk({ hasQuiz, restart, startQuiz, ask, labelledBy, describedBy, off = false }: {
  hasQuiz: boolean; restart: boolean; startQuiz: ReadyActions["startQuiz"]; ask: ReadyActions["ask"]; labelledBy: string; describedBy: string; off?: boolean;
}) {
  const [text, setText] = useState("");
  const [busy, start] = useTransition();
  const send = (e?: FormEvent) => {
    e?.preventDefault();
    const q = text.trim();
    if (!q || busy || off) return;
    start(async () => {
      if (!hasQuiz) {
        const s = await startQuiz();
        if (!s.ok) return;
      }
      if ((await ask(q)).ok) setText("");
    });
  };
  return (
    <div className="lg-ready-ask" data-print="screen-only">
      {restart && (
        // when the quiz is stale or full, restarting is the one way on — the page's primary action then
        <Button variant="primary" isDisabled={busy} onPress={() => start(async () => { await startQuiz(); })}>
          {restartQuiz}
        </Button>
      )}
      <form className="lg-ready-ask-form" onSubmit={send}>
        {/* named by the quiz heading, described by the hint (row 9); Enter sends */}
        <TextField className="lg-ready-field" value={text} onChange={setText} isDisabled={busy || restart || off} aria-labelledby={labelledBy} aria-describedby={describedBy}>
          <Input maxLength={1000} />
        </TextField>
        <Button type="submit" variant="primary" className="lg-ready-ask-button" isDisabled={busy || restart || off || !text.trim()}>
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
    <div className="lg-ledger-actions" data-print="screen-only">
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

/** A `failed` item: REQ-007 l.54's words + the `retry` button = the same question asked again. It never counts.
 *  A line of the ledger, with `retry` inline — not a card inside the ledger (row 11). */
export function QuizRetry({ text, question, ask }: { text: string; question: string; ask: ReadyActions["ask"] }) {
  const [busy, start] = useTransition();
  return (
    <p className="lg-ledger-failed">
      <span>{text}</span>
      <Button variant="secondary" isDisabled={busy} onPress={() => start(async () => { await ask(question); })} data-print="screen-only">
        {retryWord}
      </Button>
    </p>
  );
}

/** Confirm. Off, it stays a Tab stop (`aria-disabled`, the press guarded) and is described by the reasons — a
 *  screen-reader user who meets it hears why (row 5). Off look: `data-off`. */
export function GateConfirm({ enabled, confirm, describedBy }: { enabled: boolean; confirm: ReadyActions["confirm"]; describedBy?: string }) {
  const [busy, start] = useTransition();
  const off = !enabled || busy;
  return (
    <Button
      className="lg-ready-confirm"
      data-print="screen-only"
      variant="primary"
      aria-disabled={off || undefined}
      data-off={off || undefined}
      aria-describedby={describedBy}
      onPress={() => { if (!off) start(async () => { await confirm(); }); }}
    >
      {confirmWord}
    </Button>
  );
}

/** The row of steps in a HeroUI ScrollShadow. At 1440 the row wraps and nothing scrolls. On a phone it is one line that
 *  scrolls inside itself: the shadow says there is more, and on open the first stuck step is centred (critique C-016
 *  P1 — a stuck medallion was cut at the edge with no cue). By scrollLeft only, never scrollIntoView (it would move the
 *  browser's focus starting point past the skip link — TASK-C-006 lesson). */
export function ReadySteps({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const box = ref.current;
    const stuck = box?.querySelector<HTMLElement>("[data-stuck]");
    if (!box || !stuck || box.scrollWidth <= box.clientWidth) return;
    const s = stuck.getBoundingClientRect(), b = box.getBoundingClientRect();
    box.scrollLeft += s.left - b.left - (b.width - s.width) / 2;
  }, []);
  return (
    <ScrollShadow ref={ref} className="lg-ready-steps-scroll" orientation="horizontal" hideScrollBar size={48} data-print="expand">
      {children}
    </ScrollShadow>
  );
}
