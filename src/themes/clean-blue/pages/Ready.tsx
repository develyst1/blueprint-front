"use client";

// พร้อมสร้างหรือยัง in clean-blue (TASK-B-013, REQ-007 on Team C's contract). The picture first — the work as the
// overview's journey, three count tiles, what is stuck, the confirmed version — then the quiz card, then the gate card:
// ยืนยัน 100% as the one primary button, every reason it is off as an amber link (`confirmed` in the done tone), and
// Build, off, with its reason.
// Words only from Team C's ready words and @/core/words; every action is Team C's.
import { CheckCircleFilled, MessageOutlined, WarningFilled } from "@ant-design/icons";
import { Button, Card, Input, Steps, Tag, Typography } from "antd";
import { useState, useTransition } from "react";
import type { ReadyPageProps } from "@/core/theme/contract";
import type { ReadyActions, ReadyQuizItemVM } from "@/features/ready/contract";
import {
  ask as askWord, botFailed, build as buildWord, changedSince, confirm as confirmWord, confirmed, markRight, markWrong, notInSpec,
  partsUsed, quizHeading, quizHint, reasons, restartQuiz, retry as retryWord, score, scoreEarly, startQuiz as startWord, wrongNote,
} from "@/features/ready/words";
import { requiredId } from "@/core/theme/required";
import { pageLabel, participantKind, showMore } from "@/core/words";
import { PageHead } from "../parts/PageHead";
import { Req } from "../parts/Req";
import { KindTile } from "../parts/Tile";
import p from "./pages.module.css";
import s from "./ready.module.css";

function AskRow({ hasQuiz, restart, actions }: { hasQuiz: boolean; restart: boolean; actions: ReadyActions }) {
  const [text, setText] = useState("");
  const [busy, start] = useTransition();
  const send = () => {
    const q = text.trim();
    if (!q || busy) return;
    start(async () => {
      if (!hasQuiz && !(await actions.startQuiz()).ok) return; // the first question starts a quiz (TASK-C-011 item 6)
      if ((await actions.ask(q)).ok) setText("");
    });
  };
  return (
    <div className={s.askRow}>
      {(!hasQuiz || restart) && (
        <Button size="large" disabled={busy} onClick={() => start(async () => { await actions.startQuiz(); })}>
          {hasQuiz ? restartQuiz : startWord}
        </Button>
      )}
      <form className={s.askForm} onSubmit={(e) => { e.preventDefault(); send(); }}>
        <Input size="large" value={text} onChange={(e) => setText(e.target.value)} aria-labelledby="cb-quiz" maxLength={1000} disabled={busy || restart} />
        <Button size="large" type="primary" htmlType="submit" disabled={busy || restart || !text.trim()}>{askWord}</Button>
      </form>
    </div>
  );
}

function Marks({ it, actions }: { it: ReadyQuizItemVM; actions: ReadyActions }) {
  const [busy, start] = useTransition();
  const [note, setNote] = useState("");
  if (it.mark) {
    // a mark is final (SPEC-A-004 rule 5)
    return (
      <div className={s.marked}>
        <Tag className={it.mark === "right" ? s.tagRight : s.tagWrong}>{it.mark === "right" ? markRight : markWrong}</Tag>
        {it.note && <span className={p.muted}>{it.note}</span>}
      </div>
    );
  }
  return (
    <div className={s.markRow}>
      <Button size="large" disabled={busy} onClick={() => start(async () => { await actions.mark(it.id, "right"); })}>{markRight}</Button>
      <Input size="large" variant="filled" placeholder={wrongNote} aria-label={wrongNote} value={note} maxLength={2000} disabled={busy} onChange={(e) => setNote(e.target.value)} />
      <Button size="large" disabled={busy} onClick={() => start(async () => { await actions.mark(it.id, "wrong", note); })}>{markWrong}</Button>
    </div>
  );
}

function Retry({ question, actions }: { question: string; actions: ReadyActions }) {
  const [busy, start] = useTransition();
  return <Button size="large" disabled={busy} onClick={() => start(async () => { await actions.ask(question); })}>{retryWord}</Button>;
}

function Confirm({ enabled, actions }: { enabled: boolean; actions: ReadyActions }) {
  const [busy, start] = useTransition();
  return (
    <Button type="primary" size="large" disabled={!enabled || busy} onClick={() => start(async () => { await actions.confirm(); })}>
      {confirmWord}
    </Button>
  );
}

export function Ready({ vm, actions, required }: ReadyPageProps) {
  const q = vm.quiz;
  const scoreLine = q ? (q.score !== null ? score(q.score, q.marked) : scoreEarly(q.marked)) : null;
  return (
    <>
      <PageHead page="ready" />

      {/* the picture first (R1) */}
      <section className={`${p.panel} ${s.summary}`}>
        {vm.steps.length > 0 && (
          // past 7 steps the row scrolls and each title keeps ~120 px, instead of squeezing to two short lines (row 16)
          <div className={s.stepsRow} tabIndex={vm.steps.length > 7 ? 0 : undefined} role={vm.steps.length > 7 ? "region" : undefined}
            aria-label={vm.steps.length > 7 ? pageLabel.overview : undefined}>
            <Steps size="small" current={-1} className={s.steps} style={vm.steps.length > 7 ? { minWidth: vm.steps.length * 120 } : undefined}
              items={vm.steps.map((st) => ({
                title: st.title,
                status: st.stuck ? "error" : "wait",
                icon: <span className={st.stuck ? `${p.num} ${p.numStuck}` : p.num}>{st.number}</span>,
              }))} />
          </div>
        )}
        <ul className={s.counts}>
          <li className={s.count}><KindTile kind="screen" size="lg" /><span className={s.countN}>{vm.counts.screens}</span><span>{pageLabel.screens}</span></li>
          <li className={s.count}><KindTile kind="api" size="lg" /><span className={s.countN}>{vm.counts.apis}</span><span>{pageLabel.api}</span></li>
          <li className={s.count}><KindTile kind="role" size="lg" /><span className={s.countN}>{vm.counts.people}</span><span>{participantKind.role}</span></li>
        </ul>
        <div className={p.tags}>
          {vm.stuck.count > 0 && <a href={vm.stuck.href} className={s.stuckChip}><WarningFilled aria-hidden />{reasons.stuck(vm.stuck.count)}</a>}
          {vm.version && <Tag color="blue">{confirmed(vm.version.n, vm.version.dateLabel)}</Tag>}
          {vm.version?.changedSince && <Tag className={s.tagWrong}>{changedSince(vm.version.n)}</Tag>}
        </div>
      </section>

      {/* the quiz (R2) */}
      <Card id="quiz">
        <div className={s.quiz}>
          <h3 id="cb-quiz" className={s.h3}>{quizHeading}</h3>
          <p className={p.muted}>{quizHint}</p>
          {scoreLine && <p className={s.score}><Req required={required} id={requiredId.readyScore}>{scoreLine}</Req></p>}
          <AskRow hasQuiz={q !== null} restart={q !== null && (q.stale || q.full)} actions={actions} />
          {q && q.items.length > 0 && (
            <ol className={s.items}>
              {q.items.map((it) => (
                <li key={it.id} className={s.item}>
                  <div className={s.itemHead}>
                    <span className={p.num}>{it.position}</span>
                    <h4 className={s.itemQuestion}>{it.question}</h4>
                  </div>
                  {it.answer && (
                    <Typography.Paragraph className={s.answer} ellipsis={{ rows: 2, expandable: true, symbol: showMore }}>{it.answer}</Typography.Paragraph>
                  )}
                  {it.status === "failed" && (
                    <div className={s.failed}><span>{botFailed}</span><Retry question={it.question} actions={actions} /></div>
                  )}
                  {it.notInSpec && <Tag className={s.tagWrong}>{notInSpec}</Tag>}
                  {it.parts.length > 0 && (
                    <div className={s.parts}>
                      <span className={p.muted}>{partsUsed}</span>
                      <span className={p.tags}>{it.parts.map((pt) => <a key={pt.key} href={pt.href} className={p.linkTag}>{pt.title}</a>)}</span>
                    </div>
                  )}
                  {it.status === "answered" && <Marks it={it} actions={actions} />}
                </li>
              ))}
            </ol>
          )}
        </div>
      </Card>

      {/* the gate (R3) and Build (R5) */}
      <Card>
        <div className={s.gate}>
          <Confirm enabled={vm.gate.ok} actions={actions} />
          {vm.gate.reasons.length > 0 && (
            <ul className={s.reasons}>
              {vm.gate.reasons.map((r) => (
                <li key={r.code}>
                  {/* `confirmed` is a state (TASK-B-020 Q1) and `empty` a next step — the chat (TASK-B-019, C-016): neither is
                      stuck, so the blue tone and no ⚠; each keeps its link */}
                  <a href={r.href} className={r.code === "confirmed" || r.code === "empty" ? `${s.reason} ${s.reasonDone}` : s.reason}>
                    {r.code === "confirmed" ? <CheckCircleFilled aria-hidden /> : r.code === "empty" ? <MessageOutlined aria-hidden /> : <WarningFilled aria-hidden />}
                    <Req required={required} id={requiredId.readyReason(r.code)}>{r.text}</Req>
                  </a>
                </li>
              ))}
            </ul>
          )}
          <div className={s.build}>
            <Button size="large" disabled>{buildWord}</Button>
            <span className={p.muted}>{vm.build.reason}</span>
          </div>
        </div>
      </Card>
    </>
  );
}
