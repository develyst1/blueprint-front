"use client";

// พร้อมสร้างหรือยัง in clean-blue (TASK-B-013, REQ-007 on Team C's contract). The picture first — the work as the
// overview's journey, three count tiles, what is stuck — then the quiz card, then the label card: the core's label
// section (REQ-103, in place of ยืนยัน 100%), every open note as an amber link, and Build, always a link.
// Words only from Team C's ready words and @/core/words; every action is Team C's.
import { MessageOutlined, WarningFilled } from "@ant-design/icons";
import { Button, Card, Input, Steps, Tag, Typography } from "antd";
import { useState, useTransition } from "react";
import { useEdges } from "../parts/useEdges";
import type { ReadyPageProps } from "@/core/theme/contract";
import type { ReadyActions, ReadyQuizItemVM } from "@/features/ready/contract";
import {
  ask as askWord, botFailed, build as buildWord, markRight, markWrong, notInSpec,
  partsUsed, quizHeading, quizHint, reasons, restartQuiz, retry as retryWord, score, scoreEarly, startQuiz as startWord, wrongNote,
} from "@/features/ready/words";
import { requiredId } from "@/core/theme/required";
import { pageLabel, participantKind, showMore } from "@/core/words";
import { PageHead } from "../parts/PageHead";
import { Req } from "../parts/Req";
import { KindTile } from "../parts/Tile";
import p from "./pages.module.css";
import s from "./ready.module.css";

function AskRow({ hasQuiz, restart, actions, why }: { hasQuiz: boolean; restart: boolean; actions: ReadyActions; why?: string }) {
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
      {/* one way to start (REVIEW-C-004 row 12): the first ถาม starts a quiz; the button is only for starting again */}
      {hasQuiz && restart && (
        <Button size="large" disabled={busy} onClick={() => start(async () => { await actions.startQuiz(); })}>
          {restartQuiz}
        </Button>
      )}
      <form className={s.askForm} onSubmit={(e) => { e.preventDefault(); send(); }}>
        <Input size="large" value={text} onChange={(e) => setText(e.target.value)} aria-labelledby="cb-quiz" aria-describedby={restart ? why : undefined} maxLength={1000} disabled={busy || restart} />
        <Button size="large" type="primary" htmlType="submit" aria-describedby={restart ? why : undefined} disabled={busy || restart || !text.trim()}>{askWord}</Button>
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

export function Ready({ vm, actions, required, labelSection }: ReadyPageProps) {
  const q = vm.quiz;
  const scoreLine = q ? (q.score !== null ? score(q.score, q.marked) : scoreEarly(q.marked)) : null;
  const stepsRow = useEdges<HTMLDivElement>();
  const buildOpen = vm.build.enabled && vm.build.href !== null; // REQ-103: always, once the core hands the href
  return (
    <>
      <PageHead page="ready" />

      {/* the picture first (R1) */}
      <section className={`${p.panel} ${s.summary}`}>
        {vm.steps.length > 0 && (
          // past 7 steps the row scrolls and each title keeps ~120 px, instead of squeezing to two short lines (row 16)
          <div ref={stepsRow} className={s.stepsRow} tabIndex={0} role="region" aria-label={pageLabel.overview}>
            {/* one scroll row at every width, never Ant's stacked phone form (row 3); its cut edge fades (row 11) */}
            <Steps size="small" current={-1} responsive={false} className={s.steps} style={{ minWidth: vm.steps.length * 120 }}
              items={vm.steps.map((st) => ({
                title: st.title,
                status: st.stuck ? "error" : "wait",
                icon: <span className={st.stuck ? `${p.num} ${p.numStuck}` : p.num}>{st.number}</span>,
              }))} />
          </div>
        )}
        <ul className={s.counts}>
          <li className={s.count}><KindTile kind="screen" size="lg" /><span className={s.countN}>{vm.counts.screens}</span><span className={s.countWord}>{pageLabel.screens}</span></li>
          <li className={s.count}><KindTile kind="api" size="lg" /><span className={s.countN}>{vm.counts.apis}</span><span className={s.countWord}>{pageLabel.api}</span></li>
          <li className={s.count}><KindTile kind="role" size="lg" /><span className={s.countN}>{vm.counts.people}</span><span className={s.countWord}>{participantKind.role}</span></li>
        </ul>
        <div className={p.tags}>
          {vm.stuck.count > 0 && <a href={vm.stuck.href} className={s.stuckChip}><WarningFilled aria-hidden />{reasons.stuck(vm.stuck.count)}</a>}
        </div>
      </section>

      {/* the quiz (R2) */}
      <Card id="quiz">
        <div className={s.quiz}>
          <h3 id="cb-quiz" className={s.h3}>{quizHeading}</h3>
          <p className={p.muted}>{quizHint}</p>
          {/* a stale score is history, not news: ink-2 and 500, the stale reason leads (row 2) */}
          {scoreLine && <p role="status" className={q?.stale ? `${s.score} ${s.scoreStale}` : s.score}><Req required={required} id={requiredId.readyScore}>{scoreLine}</Req></p>}
          <AskRow hasQuiz={q !== null} restart={q !== null && (q.stale || q.full)} actions={actions}
            why={vm.gate.reasons.some((r) => r.code === "stale") ? "cb-reason-stale" : undefined} />
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
                    <div className={s.failed}><span aria-live="polite">{botFailed}</span><Retry question={it.question} actions={actions} /></div>
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

      {/* the label (REQ-103), what is still open, and Build (R5) */}
      <Card>
        <div className={s.gate}>
          {labelSection}
          {vm.gate.reasons.length > 0 && (
            <ul id="cb-reasons" className={s.reasons}>
              {vm.gate.reasons.map((r) => (
                <li key={r.code} id={`cb-reason-${r.code}`}>
                  {/* `empty` is a next step — the chat (TASK-B-019, C-016): not stuck, so the blue tone and no ⚠; it keeps its link */}
                  <a href={r.href} className={r.code === "empty" ? `${s.reason} ${s.reasonDone}` : s.reason}>
                    {r.code === "empty" ? <MessageOutlined aria-hidden /> : <WarningFilled aria-hidden />}
                    <Req required={required} id={requiredId.readyReason(r.code)}>{r.text}</Req>
                  </a>
                </li>
              ))}
            </ul>
          )}
          <div className={s.build}>
            {/* Build opens CAW's start page for this project (+ the newest label's version, REQ-103): a real link to the core's `href`,
                its label the core's — the theme builds no URL. The off branch below is dead since REQ-103 (build is always on). */}
            {buildOpen
              ? <Button size="large" type="primary" href={vm.build.href!} data-build>{vm.build.label}</Button>
              : <><Button size="large" disabled data-build>{vm.build.label || buildWord}</Button><span className={p.muted}>{vm.build.reason}</span></>}
          </div>
        </div>
      </Card>
    </>
  );
}
