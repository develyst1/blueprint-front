"use client";

// แชต in clean-blue (TASK-B-013, REQ-004 on Team A's contract). A working desk: on the left the composer, the question
// pack, what the last answer changed and the conversation (newest first, so a reply sits under the box); on the right
// the edge — ดู spec, sources, model, creativity. One column on a narrow screen, the edge after the pack.
// Words only from Team A's chat words and @/core/words; the page never calls the API — every action is Team A's.
import { Alert, Button, Card, Input, Select, Slider, Tag, Typography, type RefSelectProps } from "antd";
import { useEffect, useId, useRef, useState, useTransition, type KeyboardEvent, type ReactNode } from "react";
import type { ChatPageProps } from "@/core/theme/contract";
import type { ActionCode, ActionResult, ChatQuestionVM, ChatSourceVM } from "@/features/chat/contract";
import {
  acceptAll, acceptPack, actionError, answerOwn, botFailed, botSuggests, changeCard, chatPlaceholder, chooseFile, creativityLabel,
  enterHint, logName, modelLabel, notNeeded, originChoices, packName, reasonOptional, send as sendWord, sourceFailed, sourceState,
  speaker, thinking, toSpec, tryAgain, undoRefused, uploadAsks,
} from "@/features/chat/words";
import { requiredId } from "@/core/theme/required";
import { proposedAnswer as proposedWord, showMore } from "@/core/words";
import { PageHead } from "../parts/PageHead";
import { Req } from "../parts/Req";
import { KindTile } from "../parts/Tile";
import s from "./chat.module.css";

type Run = (fn: () => Promise<ActionResult>, after?: (r: ActionResult) => void) => void;

/** Long text: two lines, then ดูรายละเอียด (AC-8). */
function Clamp({ children }: { children: ReactNode }) {
  return <Typography.Paragraph className={s.clamp} ellipsis={{ rows: 2, expandable: true, symbol: showMore }}>{children}</Typography.Paragraph>;
}

const errorWord = (code: ActionCode) => (code in actionError ? actionError[code as keyof typeof actionError] : null);

/** A question with no proposed answer: answer it yourself, or park it with an optional reason (REQ-003 Addendum A). */
function OwnAnswer({ q, titleId, actions, run, busy }: { q: ChatQuestionVM; titleId: string; actions: ChatPageProps["actions"]; run: Run; busy: boolean }) {
  const [answer, setAnswer] = useState("");
  const [reason, setReason] = useState("");
  return (
    <div className={s.own}>
      <form className={s.ownRow} onSubmit={(e) => { e.preventDefault(); const t = answer.trim(); if (t) run(() => actions.answer(q.key, t), (r) => { if (r.ok) setAnswer(""); }); }}>
        <Input size="large" placeholder={answerOwn} aria-label={answerOwn} aria-describedby={titleId} value={answer} onChange={(e) => setAnswer(e.target.value)} />
        <Button size="large" htmlType="submit" disabled={busy || !answer.trim()} aria-describedby={titleId}>{sendWord}</Button>
      </form>
      <form className={s.ownRow} onSubmit={(e) => { e.preventDefault(); const why = reason.trim(); run(() => actions.park(q.key, why || undefined), (r) => { if (r.ok) setReason(""); }); }}>
        <Input size="large" variant="filled" placeholder={reasonOptional} aria-label={reasonOptional} aria-describedby={titleId} value={reason} onChange={(e) => setReason(e.target.value)} />
        <Button size="large" type="text" htmlType="submit" disabled={busy} aria-describedby={titleId}>{notNeeded}</Button>
      </form>
    </div>
  );
}

function Pack({ vm, required, actions, run, busy }: Omit<ChatPageProps, "vm"> & { vm: ChatPageProps["vm"]; run: Run; busy: boolean }) {
  const box = useRef<HTMLElement>(null);
  // ?q=<key> (REQ-004 R7): that card brought into view and focused
  useEffect(() => {
    const card = vm.focus ? box.current?.querySelector<HTMLElement>(`[data-key="${CSS.escape(vm.focus)}"]`) : null;
    card?.scrollIntoView({ block: "center" });
    card?.focus({ preventScroll: true });
  }, [vm.focus]);
  // the pack-wide ตามนั้น takes the questions with a proposed answer that is not a bot suggestion (D-026); a suggestion
  // is accepted on its own card, after it has been read
  const answerable = vm.pack.filter((q) => q.proposedAnswer !== null && !q.suggested).map((q) => q.key);
  return (
    <section ref={box} className={s.pack} aria-label={packName}>
      {vm.pack.map((q) => {
        const titleId = `q-${q.key}`;
        return (
          <Card key={q.key} data-key={q.key} tabIndex={-1} className={s.card} aria-labelledby={titleId}>
            <div className={s.cardBody}>
              <div className={s.question}>
                <KindTile kind="question" />
                <h3 id={titleId} className={s.questionText}><Req required={required} id={requiredId.part(q.key)}>{q.text}</Req></h3>
              </div>
              {q.proposedAnswer !== null ? (
                <div className={q.suggested ? `${s.answer} ${s.suggested}` : s.answer}>
                  {!q.suggested && <span className={s.label}>{proposedWord}</span>}
                  <Clamp>{q.suggested ? botSuggests(q.proposedAnswer) : q.proposedAnswer}</Clamp>
                  <Button size="large" disabled={busy} aria-describedby={titleId} onClick={() => run(() => actions.accept([q.key]))}>{acceptPack}</Button>
                </div>
              ) : (
                <OwnAnswer q={q} titleId={titleId} actions={actions} run={run} busy={busy} />
              )}
              {q.cases.length > 0 && <ul className={s.cases}>{q.cases.map((c) => <li key={c}><Clamp>{c}</Clamp></li>)}</ul>}
            </div>
          </Card>
        );
      })}
      {answerable.length > 0 && (
        <Button type="primary" size="large" className={s.acceptAll} disabled={busy} onClick={() => run(() => actions.accept(answerable))}>
          {acceptAll(answerable.length)}
        </Button>
      )}
    </section>
  );
}

function SourceRow({ source }: { source: ChatSourceVM }) {
  return (
    <li className={s.source}>
      <span className={s.sourceName}>{source.name}</span>
      <Tag className={source.state === "failed" ? s.tagStuck : undefined}>{source.state === "read" ? sourceState.read : sourceFailed(source.reason)}</Tag>
    </li>
  );
}

export function Chat({ vm, actions, required }: ChatPageProps) {
  const [text, setText] = useState("");
  const [pending, start] = useTransition();
  const [refused, setRefused] = useState<string[] | null>(null);
  const [failure, setFailure] = useState<{ word: string; again: (() => void) | null } | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [reading, setReading] = useState<string | null>(null);
  const [creativity, setCreativity] = useState(vm.creativity);
  const fileInput = useRef<HTMLInputElement>(null);
  const model = useRef<RefSelectProps>(null);
  const ids = { hint: useId(), origin: useId(), model: useId(), creativity: useId() };

  useEffect(() => setCreativity(vm.creativity), [vm.creativity]);

  const run: Run = (fn, after) => start(async () => { const r = await fn(); after?.(r); });
  const send = () => {
    if (!text.trim() || pending) return;
    const said = text;
    run(() => actions.send(said), (r) => { if (r.ok) setText(""); });
  };
  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send(); }
  };
  const upload = (stamp: string, f: File) => {
    const form = new FormData();
    form.set("file", f);
    form.set("origin", stamp);
    setReading(f.name); setFile(null); setFailure(null);
    run(() => actions.upload(form), (r) => {
      setReading(null);
      const word = r.ok ? null : errorWord(r.code);
      setFailure(word ? { word, again: !r.ok && r.code === "unreachable" ? () => upload(stamp, f) : null } : null);
    });
  };
  const undo = (changeSetId: string) => {
    setFailure(null);
    run(() => actions.undo(changeSetId), (r) => {
      setRefused(!r.ok && r.code === "undo_refused" ? r.parts ?? [] : null);
      const word = !r.ok && r.code !== "undo_refused" ? errorWord(r.code) : null;
      setFailure(word ? { word, again: !r.ok && r.code === "unreachable" ? () => undo(changeSetId) : null } : null);
    });
  };
  const newestFirst = [...vm.messages].reverse().filter((m) => m.text.trim() !== "");

  // ChatScreen wraps this page in a div of its own, so the shell's gap does not reach it: the page keeps its own
  return (
    <div className={s.page}>
      <PageHead page="chat" />
      <div className={s.desk}>
        <div className={s.work}>
          <Card className={s.composer}>
            <form onSubmit={(e) => { e.preventDefault(); send(); }} className={s.composerForm}>
              <Input.TextArea
                size="large"
                autoSize={{ minRows: 3, maxRows: 10 }}
                value={text}
                placeholder={chatPlaceholder}
                aria-label={chatPlaceholder}
                aria-describedby={ids.hint}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={onKey}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { const f = e.dataTransfer.files[0]; if (f) { e.preventDefault(); setFile(f); } }}
              />
              <div className={s.composerRow}>
                <span id={ids.hint} className={s.hint}>{enterHint}</span>
                <div className={s.row}>
                  <input ref={fileInput} type="file" className={s.srOnly} tabIndex={-1} aria-hidden="true"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) setFile(f); e.target.value = ""; }} />
                  <Button size="large" onClick={() => fileInput.current?.click()}>{chooseFile}</Button>
                  <Button size="large" type="primary" htmlType="submit" disabled={pending || !text.trim()}>{sendWord}</Button>
                </div>
              </div>
            </form>
          </Card>

          {file && (
            <Card className={s.origin}>
              <div role="group" aria-labelledby={ids.origin} onKeyDown={(e) => { if (e.key === "Escape") setFile(null); }} className={s.originBody}>
                <p id={ids.origin} className={s.originAsk}>{uploadAsks}</p>
                <p className={s.muted}>{file.name}</p>
                <div className={s.row}>
                  {originChoices.map((o) => (
                    <Button key={o.stamp} size="large" autoFocus={o.stamp === "operator"} onClick={() => upload(o.stamp, file)}>{o.label}</Button>
                  ))}
                </div>
              </div>
            </Card>
          )}

          <div role="status" aria-live="polite" className={s.status}>{pending ? <span>{thinking}</span> : null}</div>

          {failure && (
            <Alert type="warning" showIcon role="alert" message={failure.word}
              action={failure.again ? <Button size="large" onClick={failure.again}>{tryAgain}</Button> : undefined} />
          )}

          {vm.failed && !pending && (
            <Alert type="warning" showIcon role="alert" message={botFailed.message}
              action={
                <div className={s.row}>
                  <Button size="large" type="primary" onClick={() => run(() => actions.retry())}>{botFailed.retry}</Button>
                  {vm.model && <Button size="large" onClick={() => model.current?.focus()}>{botFailed.changeModel}</Button>}
                </div>
              } />
          )}

          {vm.pack.length > 0 && <Pack vm={vm} actions={actions} required={required} run={run} busy={pending} />}

          {vm.lastChange && (
            <Card className={s.change}>
              <div className={s.changeBody}>
                <span className={s.row}>
                  <Tag>{changeCard.added(vm.lastChange.added)}</Tag>
                  <Tag>{changeCard.updated(vm.lastChange.updated)}</Tag>
                  <Tag>{changeCard.removed(vm.lastChange.removed)}</Tag>
                </span>
                <Button size="large" disabled={pending} onClick={() => undo(vm.lastChange!.changeSetId)}>{changeCard.undo}</Button>
              </div>
            </Card>
          )}
          {refused && <Alert type="warning" showIcon role="alert" message={<>{refused.map((p) => <p key={p}>{undoRefused(p)}</p>)}</>} />}

          {newestFirst.length > 0 && (
            <ol className={s.messages} reversed aria-label={logName}>
              {newestFirst.map((m, i) => (
                <li key={m.id} className={`${s.bubble} ${s[m.role]}`}>
                  <span className={s.srOnly}>{speaker[m.role]}</span>
                  <Clamp>{m.text}</Clamp>
                  {i === 0 || newestFirst[i - 1]!.atLabel !== m.atLabel ? <time dateTime={m.at} className={s.at}>{m.atLabel}</time> : null}
                </li>
              ))}
            </ol>
          )}
        </div>

        <aside className={s.edge}>
          <Card>
            <div className={s.edgeBody}>
              <Button size="large" href={vm.specHref} block>{toSpec}</Button>
              {(vm.sources.length > 0 || reading) && (
                <ul className={s.sources}>
                  {reading && <li className={s.source}><span className={s.sourceName}>{reading}</span><Tag>{sourceState.reading}</Tag></li>}
                  {vm.sources.map((src) => <SourceRow key={src.id} source={src} />)}
                </ul>
              )}
              {vm.model && (
                <div className={s.field}>
                  <label htmlFor={ids.model}>{modelLabel}</label>
                  <Select id={ids.model} ref={model} size="large" value={vm.model.current} disabled={pending} options={vm.model.options}
                    onChange={(v: string) => run(() => actions.setModel(v))} />
                </div>
              )}
              <div className={s.field}>
                <label id={ids.creativity}>{creativityLabel}</label>
                <div className={s.row}>
                  <Slider className={s.slider} min={0} max={2} step={0.1} value={creativity} disabled={pending}
                    ariaLabelledByForHandle={ids.creativity}
                    onChange={(v: number) => setCreativity(v)}
                    onChangeComplete={(v: number) => { if (v !== vm.creativity) run(() => actions.setCreativity(v)); }} />
                  <output aria-labelledby={ids.creativity}>{creativity.toFixed(1)}</output>
                </div>
              </div>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}
