"use client";

// พร้อมสร้างหรือยัง (screen ④) in minimal mono (TASK-A-044, REQ-007). Reading order: the work as a picture (steps,
// three counts by shape, what is stuck) → the gate, which answers the page's question (ยืนยัน 100% · every reason as
// a link · the version · the build button off with its reason) → the quiz (score, start, ask, each answer to mark).
// From 64em the gate is a right column. Mono's rules: weight is the hierarchy (actions are ink outlines; solid black
// is only the stuck step / the shell's stuck strip), nothing under 14 px, 44 px targets, the root's focus ring.
// Score and gate come from the VM — never recomputed here. Words: @/core/words and @/features/ready/words only.
import "@mantine/core/styles/UnstyledButton.css";
import "@mantine/core/styles/Button.css";
import "@mantine/core/styles/Paper.css";
import { Button, Paper } from "@mantine/core";
import { IconCheck, IconX } from "@tabler/icons-react";
import { useLayoutEffect, useRef, useState, useTransition, type FormEvent, type ReactNode } from "react";
import type { ReadyActions, ReadyPageProps, ReadyVM } from "@/core/theme/contract";
import { pageLabel, participantKind, showMore } from "@/core/words";
import {
  ask as askWord, botFailed, build as buildWord, changedSince, confirm as confirmWord, confirmed, markRight, markWrong,
  notInSpec, partsUsed, quizHeading, quizHint, readyPage, reasons as reasonWords, restartQuiz, retry as retryWord, score,
  scoreEarly, startQuiz as startWord, wrongNote,
} from "@/features/ready/words";
import { KindMark } from "../parts/KindMark";
import { RequiredList, RequiredPicker } from "../parts/Required";
import { StepCard } from "../parts/StepCard";
import { StuckIcon } from "../parts/StuckIcon";
import s from "./ready.module.css";

type Item = NonNullable<ReadyVM["quiz"]>["items"][number];

/** Text clamped to 2 lines (AC-8); ดูรายละเอียด appears only when it is actually longer. */
function Clamp({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [long, setLong] = useState(false);
  const [open, setOpen] = useState(false);
  useLayoutEffect(() => {
    const el = ref.current;
    if (el && !open) setLong(el.scrollHeight > el.clientHeight + 1);
  }, [children, open]);
  return (
    <div className={className}>
      <div ref={ref} className={open ? undefined : s.clamp}>{children}</div>
      {long ? (
        <button type="button" className={s.textButton} aria-expanded={open} onClick={() => setOpen((v) => !v)}>
          {showMore}
        </button>
      ) : null}
    </div>
  );
}

/** ถูก · ผิดตรงไหน (ไม่บังคับ) + ผิด — or, once marked, the mark (final, SPEC-A-004 rule 5) with its note. */
function Mark({ item, actions }: { item: Item; actions: ReadyActions }) {
  const [busy, start] = useTransition();
  const [note, setNote] = useState("");
  const noteId = `mono-note-${item.id}`;
  if (item.mark) {
    return (
      <p className={item.mark === "right" ? s.markedRight : s.markedWrong}>
        {item.mark === "right" ? <IconCheck size={18} aria-hidden="true" /> : <IconX size={18} aria-hidden="true" />}
        <span>{item.mark === "right" ? markRight : markWrong}</span>
        {item.note ? <span className={s.note}>{item.note}</span> : null}
      </p>
    );
  }
  return (
    <div className={s.markRow}>
      <Button variant="default" radius="md" h={44} className={s.outline} disabled={busy} onClick={() => start(async () => { await actions.mark(item.id, "right"); })}>
        {markRight}
      </Button>
      {/* the note belongs to ผิด: the two wrap together, never split across lines */}
      <div className={s.wrongGroup}>
        <label htmlFor={noteId} className={s.srOnly}>{wrongNote}</label>
        <input id={noteId} className={s.input} placeholder={wrongNote} value={note} maxLength={2000} disabled={busy} onChange={(e) => setNote(e.target.value)} />
        <Button variant="default" radius="md" h={44} className={s.outline} disabled={busy} onClick={() => start(async () => { await actions.mark(item.id, "wrong", note.trim() || undefined); })}>
          {markWrong}
        </Button>
      </div>
    </div>
  );
}

/** A failed answer: never markable; ลองใหม่ asks the same question again (REQ-007 l.54). */
function Retry({ question, actions }: { question: string; actions: ReadyActions }) {
  const [busy, start] = useTransition();
  return (
    <Button variant="default" radius="md" h={44} className={s.outline} disabled={busy} onClick={() => start(async () => { await actions.ask(question); })}>
      {retryWord}
    </Button>
  );
}

/** เริ่มทดสอบ / เริ่มทดสอบใหม่ and the question box (ถาม). The first question with no quiz starts one first. */
function AskBox({ hasQuiz, restart, actions }: { hasQuiz: boolean; restart: boolean; actions: ReadyActions }) {
  const [text, setText] = useState("");
  const [busy, start] = useTransition();
  const send = (e?: FormEvent) => {
    e?.preventDefault();
    const q = text.trim();
    if (!q || busy) return;
    start(async () => {
      if (!hasQuiz) {
        const r0 = await actions.startQuiz();
        if (!r0.ok) return;
      }
      const r = await actions.ask(q);
      if (r.ok) setText("");
    });
  };
  return (
    <div className={s.askRow}>
      {!hasQuiz || restart ? (
        <Button variant="default" radius="md" h={44} className={s.strong} disabled={busy} onClick={() => start(async () => { await actions.startQuiz(); })}>
          {hasQuiz ? restartQuiz : startWord}
        </Button>
      ) : null}
      <form className={s.askForm} onSubmit={send}>
        <input
          className={s.input}
          value={text}
          onChange={(e) => setText(e.target.value)}
          aria-labelledby="mono-ready-quiz"
          aria-describedby="mono-ready-hint"
          maxLength={1000}
          disabled={busy || restart}
        />
        <Button type="submit" variant="default" radius="md" h={44} className={s.strong} disabled={busy || restart || !text.trim()}>
          {askWord}
        </Button>
      </form>
    </div>
  );
}

/** ยืนยัน 100% — or, when the newest version is confirmed and nothing has changed (gate code `confirmed`, D-030), the same
 *  button off and reading that state's words. A confirm that comes back `already_confirmed` (another tab got there
 *  first) shows the same words until the page refreshes. `attrs` = the state's required-item marks, on its words. */
function Confirm({ enabled, done, alreadyWords, attrs, actions }: {
  enabled: boolean; done: string | null; alreadyWords: string | null; attrs: Record<string, string>; actions: ReadyActions;
}) {
  const [busy, start] = useTransition();
  const [already, setAlready] = useState<string | null>(null);
  const words = done ?? already;
  return (
    <Button
      variant="default"
      radius="md"
      className={s.confirm}
      disabled={!enabled || busy || words !== null}
      onClick={() => start(async () => {
        const r = await actions.confirm();
        if (!r.ok && r.code === "already_confirmed" && done === null) setAlready(alreadyWords);
      })}
    >
      {words ? <span {...(done ? attrs : {})}>{words}</span> : confirmWord}
    </Button>
  );
}

export function MonoReady({ vm, actions, required }: ReadyPageProps) {
  // required items are paired by their text (the ids are the ready core's, outside this theme's imports): the score line
  // and each gate reason claim theirs here, before the leftovers are listed at the end
  const picker = new RequiredPicker(required);
  const q = vm.quiz;
  const scoreLine = q ? (q.score !== null ? score(q.score, q.marked) : scoreEarly(q.marked)) : null;
  const scoreAttrs = scoreLine ? picker.take(scoreLine) : {};
  const reasonAttrs = new Map(vm.gate.reasons.map((r) => [r.code, picker.take(r.text)]));
  // C-016 states: `confirmed` is drawn as the Confirm button's own words (not a link under it); `empty` is the only
  // reason and leads to the chat, so the quiz is not offered beside it (D-032)
  const done = vm.gate.reasons.find((r) => r.code === "confirmed")?.text ?? null;
  const empty = vm.gate.reasons.some((r) => r.code === "empty");
  const links = vm.gate.reasons.filter((r) => r.code !== "confirmed");
  const leftover = picker.rest();
  const counts = [
    { kind: "screen" as const, n: vm.counts.screens, word: pageLabel.screens },
    { kind: "api" as const, n: vm.counts.apis, word: pageLabel.api },
    { kind: "role" as const, n: vm.counts.people, word: participantKind.role },
  ];

  return (
    <div className={s.page}>
      <h2 id="mono-ready-title" className={s.title}>{readyPage}</h2>

      {/* the work as a picture (R1) */}
      <section className={s.summary}>
        {vm.steps.length ? (
          // a grid from 48em; on a phone one row that scrolls inside itself (a keyboard stop, named by the page title)
          <ol className={s.steps} tabIndex={0} role="region" aria-labelledby="mono-ready-title">
            {vm.steps.map((st) => (
              <li key={st.key}>
                <StepCard step={st} size="sm" />
              </li>
            ))}
          </ol>
        ) : null}
        <ul className={s.counts} data-counts="">
          {counts.map((c) => (
            <li key={c.kind}>
              <KindMark kind={c.kind} size={18} />
              <span className={s.countN}>{c.n}</span>
              <span className={s.countWord}>{c.word}</span>
            </li>
          ))}
        </ul>
        {vm.stuck.count > 0 ? (
          <a className={s.stuckLink} href={vm.stuck.href}>
            <StuckIcon />
            <span>{reasonWords.stuck(vm.stuck.count)}</span>
          </a>
        ) : null}
      </section>

      {/* the gate (R3) and Build (R5): the page's answer */}
      <Paper radius="lg" p="lg" className={s.gate} component="section">
        <Confirm
          enabled={vm.gate.ok}
          done={done}
          alreadyWords={vm.version ? reasonWords.confirmed(vm.version.n) : null}
          attrs={reasonAttrs.get("confirmed") ?? {}}
          actions={actions}
        />
        {links.length ? (
          <ul className={s.reasons}>
            {links.map((r) => (
              <li key={r.code}>
                <a href={r.href} className={s.reason} {...(reasonAttrs.get(r.code) ?? {})}>
                  {r.text}
                </a>
              </li>
            ))}
          </ul>
        ) : null}
        {vm.version ? <p className={s.version}>{confirmed(vm.version.n, vm.version.dateLabel)}</p> : null}
        {vm.version?.changedSince ? <p className={s.changed}>{changedSince(vm.version.n)}</p> : null}
        <div className={s.build}>
          <Button variant="default" radius="md" h={44} className={s.outline} disabled>
            {buildWord}
          </Button>
          <p className={s.buildReason}>{vm.build.reason}</p>
        </div>
      </Paper>

      {/* the quiz (R2) — not on an empty project: its one way on is the chat (D-032) */}
      {empty ? null : (
      <section id="quiz" className={s.quiz} aria-labelledby="mono-ready-quiz">
        <h3 id="mono-ready-quiz" className={s.h3}>{quizHeading}</h3>
        <p id="mono-ready-hint" className={s.hint}>{quizHint}</p>
        {/* a stale quiz's score is history: quiet, so the gate's stale reason leads (REVIEW-A-003 row 2) */}
        {scoreLine ? <p className={q?.stale ? s.scoreStale : s.score} {...scoreAttrs}>{scoreLine}</p> : null}
        <AskBox hasQuiz={q !== null} restart={q !== null && (q.stale || q.full)} actions={actions} />
        {q && q.items.length ? (
          <ol className={s.items}>
            {q.items.map((it) => (
              <li key={it.id} className={s.item} data-status={it.status}>
                <Clamp className={s.question}>{it.question}</Clamp>
                {it.answer ? <Clamp className={s.answer}>{it.answer}</Clamp> : null}
                {it.status === "failed" ? (
                  <div className={s.failed}>
                    <p className={s.failedWord}>{botFailed}</p>
                    <Retry question={it.question} actions={actions} />
                  </div>
                ) : null}
                {it.notInSpec ? <p className={s.notInSpec}>{notInSpec}</p> : null}
                {it.parts.length ? (
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
                ) : null}
                {it.status === "answered" ? <Mark item={it} actions={actions} /> : null}
              </li>
            ))}
          </ol>
        ) : null}
      </section>
      )}

      <RequiredList items={leftover} />
    </div>
  );
}
