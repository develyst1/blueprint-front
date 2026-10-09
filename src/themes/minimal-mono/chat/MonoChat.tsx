"use client";

// แชต in minimal mono (TASK-A-040, REQ-004 R1–R8). The chat box is the one focus and the first stop after the skip
// link; under it, in reading order: what the bot is doing, the question pack, what the last answer changed, the edge
// (ดู spec, sources, model, creativity — a right column from 64em) and the conversation, newest first. Mono's rules
// hold: weight is the hierarchy (actions are ink outlines; the stuck strip in the shell stays the only solid block),
// nothing under 14 px, 44 px targets, the theme's focus ring. Words only from @/core/words and @/features/chat/words.
// Mantine stays inside our root: the model Select renders its list inline (withinPortal false), never on body.
import "@mantine/core/styles/UnstyledButton.css";
import "@mantine/core/styles/Button.css";
import "@mantine/core/styles/Paper.css";
import "@mantine/core/styles/Input.css";
import "@mantine/core/styles/Combobox.css";
import "@mantine/core/styles/Popover.css";
import "@mantine/core/styles/ScrollArea.css";
import { Button, Paper, Select } from "@mantine/core";
import { useEffect, useId, useLayoutEffect, useRef, useState, useTransition, type FormEvent, type KeyboardEvent, type ReactNode } from "react";
import type { ChatActions, ChatPageProps, ChatVM } from "@/core/theme/contract";
import { requiredId } from "@/core/theme/required";
import { proposedAnswer as proposedAnswerWord, showMore } from "@/core/words";
import {
  acceptAll, acceptPack, actionError, answerOwn, botFailed, botSuggests, changeCard, chatPlaceholder, chooseFile, creativityLabel,
  enterHint, logName, modelLabel, notNeeded, originChoices, packName, reasonOptional, send as sendWord, sourceFailed,
  sourceState, speaker, thinking, toSpec, tryAgain, undoRefused, uploadAsks,
} from "@/features/chat/words";
import { RequiredList, RequiredPicker } from "../parts/Required";
import s from "./chat.module.css";

// the contract's own types, derived — the theme imports only what the core re-exports
type ActionResult = Awaited<ReturnType<ChatActions["send"]>>;
type ActionCode = Extract<ActionResult, { ok: false }>["code"];
type Question = ChatVM["pack"][number];
type Source = ChatVM["sources"][number];
type Run = (fn: () => Promise<ActionResult>, after?: (r: ActionResult) => void) => void;

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

/** A question with no proposed answer: answer it (ส่ง), or park it with an optional reason (ไม่ต้องใช้ข้อนี้, quiet). */
function OwnAnswer({ q, titleId, actions, run, busy }: { q: Question; titleId: string; actions: ChatActions; run: Run; busy: boolean }) {
  const [answer, setAnswer] = useState("");
  const [reason, setReason] = useState("");
  const ids = { answer: useId(), reason: useId() };
  return (
    <div className={s.own}>
      <form
        className={s.ownRow}
        onSubmit={(e) => {
          e.preventDefault();
          const said = answer.trim();
          if (said) run(() => actions.answer(q.key, said), (r) => { if (r.ok) setAnswer(""); });
        }}
      >
        <label htmlFor={ids.answer} className={s.srOnly}>{answerOwn}</label>
        <input id={ids.answer} className={s.input} placeholder={answerOwn} value={answer} aria-describedby={titleId} onChange={(e) => setAnswer(e.target.value)} />
        <Button type="submit" variant="default" radius="md" h={44} className={s.outline} disabled={busy || !answer.trim()} aria-describedby={titleId}>
          {sendWord}
        </Button>
      </form>
      <form
        className={s.ownRow}
        onSubmit={(e) => {
          e.preventDefault();
          const why = reason.trim();
          run(() => actions.park(q.key, why || undefined), (r) => { if (r.ok) setReason(""); });
        }}
      >
        <label htmlFor={ids.reason} className={s.srOnly}>{reasonOptional}</label>
        <input id={ids.reason} className={`${s.input} ${s.inputQuiet}`} placeholder={reasonOptional} value={reason} aria-describedby={titleId} onChange={(e) => setReason(e.target.value)} />
        <button type="submit" className={s.textButton} disabled={busy} aria-describedby={titleId}>{notNeeded}</button>
      </form>
    </div>
  );
}

function Pack({ pack, focus, marks, actions, run, busy }: {
  pack: Question[]; focus: string | null; marks: Map<string, Record<string, string>>; actions: ChatActions; run: Run; busy: boolean;
}) {
  const box = useRef<HTMLDivElement>(null);
  // ?q=<key> (R7, AC-8): that card scrolled into the box (its own scrollTop, never scrollIntoView) and focused
  useEffect(() => {
    const el = box.current;
    const card = focus ? el?.querySelector<HTMLElement>(`[data-key="${CSS.escape(focus)}"]`) : null;
    if (!el || !card) return;
    el.scrollTop = card.offsetTop - el.offsetTop - 8;
    card.focus({ preventScroll: true });
  }, [focus]);
  // the pack's ตามนั้น: questions with a proposed answer, never a bot suggestion (accepted only on its own card)
  const answerable = pack.filter((q) => q.proposedAnswer !== null && !q.suggested).map((q) => q.key);
  return (
    <section className={s.pack}>
      <div ref={box} className={s.packBox} tabIndex={0} role="region" aria-label={packName}>
        {pack.map((q) => {
          const titleId = `mono-q-${q.key}`;
          return (
            <article key={q.key} data-key={q.key} tabIndex={-1} className={s.card} aria-labelledby={titleId}>
              <Clamp className={s.question}>
                <span id={titleId} {...(marks.get(q.key) ?? {})}>{q.text}</span>
              </Clamp>
              {q.proposedAnswer !== null && q.suggested ? (
                <div className={s.suggestion}>
                  <Clamp>{botSuggests(q.proposedAnswer)}</Clamp>
                  <Button variant="default" radius="md" h={44} className={s.outline} disabled={busy} aria-describedby={titleId} onClick={() => run(() => actions.accept([q.key]))}>
                    {acceptPack}
                  </Button>
                </div>
              ) : q.proposedAnswer !== null ? (
                <div className={s.answer}>
                  <span className={s.label}>{proposedAnswerWord}</span>
                  <Clamp>{q.proposedAnswer}</Clamp>
                </div>
              ) : (
                <OwnAnswer q={q} titleId={titleId} actions={actions} run={run} busy={busy} />
              )}
              {q.cases.length ? (
                <ul className={s.cases}>
                  {q.cases.map((c) => <li key={c}><Clamp>{c}</Clamp></li>)}
                </ul>
              ) : null}
            </article>
          );
        })}
      </div>
      {answerable.length ? (
        <Button variant="default" radius="md" h={44} className={s.strong} onClick={() => run(() => actions.accept(answerable))} disabled={busy}>
          {acceptAll(answerable.length)}
        </Button>
      ) : null}
    </section>
  );
}

function SourceLine({ source }: { source: Source }) {
  return (
    <li className={source.state === "failed" ? s.sourceFailed : undefined}>
      <span className={s.sourceName}>{source.name}</span>
      <span className={s.sourceState}>{source.state === "read" ? sourceState.read : sourceFailed(source.reason)}</span>
    </li>
  );
}

const errorWord = (code: ActionCode) => (code in actionError ? actionError[code as keyof typeof actionError] : null);

export function MonoChat({ vm, actions, required }: ChatPageProps) {
  // each pack question claims its required item here, before the leftovers are listed at the end (a child component
  // renders after this body has already read picker.rest())
  const picker = new RequiredPicker(required);
  const marks = new Map(vm.pack.map((q) => [q.key, picker.takeId(requiredId.part(q.key))]));
  const leftover = picker.rest();
  const [text, setText] = useState("");
  const [pending, start] = useTransition();
  const [refused, setRefused] = useState<string[] | null>(null);
  const [failure, setFailure] = useState<{ word: string; again: (() => void) | null } | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [reading, setReading] = useState<string | null>(null);
  const [creativity, setCreativity] = useState(vm.creativity);
  const [dragging, setDragging] = useState(false);
  const model = useRef<HTMLInputElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const ids = { creativity: useId(), origin: useId(), hint: useId() };

  useEffect(() => setCreativity(vm.creativity), [vm.creativity]);

  const run: Run = (fn, after) =>
    start(async () => {
      const r = await fn();
      after?.(r);
    });

  const send = (e?: FormEvent) => {
    e?.preventDefault();
    if (!text.trim() || pending) return;
    const said = text;
    run(() => actions.send(said), (r) => { if (r.ok) setText(""); });
  };
  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) send(e as unknown as FormEvent);
  };
  const upload = (stamp: string, f: File) => {
    const form = new FormData();
    form.set("file", f);
    form.set("origin", stamp);
    setReading(f.name);
    setFile(null);
    setFailure(null);
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
  const commitCreativity = () => {
    if (creativity !== vm.creativity) run(() => actions.setCreativity(creativity));
  };

  const newestFirst = [...vm.messages].reverse().filter((m) => m.text.trim() !== "");

  return (
    <div className={s.page}>
      {/* the one focus (R1) */}
      <form className={s.composer} onSubmit={send}>
        <textarea
          className={dragging ? `${s.box} ${s.boxDrop}` : s.box}
          rows={3}
          value={text}
          placeholder={chatPlaceholder}
          aria-label={chatPlaceholder}
          aria-describedby={ids.hint}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKey}
          onDragOver={(e) => e.preventDefault()}
          onDragEnter={(e) => { if (e.dataTransfer.types.includes("Files")) setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            setDragging(false);
            const f = e.dataTransfer.files[0];
            if (f) { e.preventDefault(); setFile(f); }
          }}
        />
        <div className={s.composerRow}>
          <span id={ids.hint} className={s.hint}>{enterHint}</span>
          <div className={s.row}>
            {/* the native picker: out of sight and out of the accessibility tree; เลือกไฟล์ opens it (TASK-A-035 Q1) */}
            <input
              ref={fileInput}
              type="file"
              className={s.srOnly}
              tabIndex={-1}
              aria-hidden="true"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) setFile(f); e.target.value = ""; }}
            />
            <Button variant="default" radius="md" h={44} className={s.outline} onClick={() => fileInput.current?.click()}>{chooseFile}</Button>
            <Button type="submit" variant="default" radius="md" h={44} className={s.strong} disabled={pending || !text.trim()}>{sendWord}</Button>
          </div>
        </div>
      </form>

      {file ? (
        <Paper radius="lg" p="lg" className={s.panelStrong} role="group" aria-labelledby={ids.origin} onKeyDown={(e) => { if (e.key === "Escape") setFile(null); }}>
          <p id={ids.origin} className={s.originAsk}>{uploadAsks}</p>
          <p className={s.originFile}>{file.name}</p>
          <div className={s.row}>
            {originChoices.map((o) => (
              <Button key={o.stamp} variant="default" radius="md" h={44} className={s.outline} onClick={() => upload(o.stamp, file)} autoFocus={o.stamp === "operator"}>
                {o.label}
              </Button>
            ))}
          </div>
        </Paper>
      ) : null}

      <div role="status" aria-live="polite" className={s.status}>
        {pending ? <span className={s.thinking}>{thinking}</span> : null}
      </div>

      {failure ? (
        <Paper radius="lg" p="lg" className={s.panelStrong} role="alert">
          <p className={s.alertWord}>{failure.word}</p>
          {failure.again ? <Button variant="default" radius="md" h={44} className={s.outline} onClick={failure.again}>{tryAgain}</Button> : null}
        </Paper>
      ) : null}

      {vm.failed && !pending ? (
        <Paper radius="lg" p="lg" className={s.panelStrong} role="alert">
          <p className={s.alertWord}>{botFailed.message}</p>
          <div className={s.row}>
            <Button variant="default" radius="md" h={44} className={s.strong} onClick={() => run(() => actions.retry())}>{botFailed.retry}</Button>
            {vm.model ? (
              <Button variant="default" radius="md" h={44} className={s.outline} onClick={() => model.current?.focus()}>{botFailed.changeModel}</Button>
            ) : null}
          </div>
        </Paper>
      ) : null}

      {vm.pack.length ? <Pack pack={vm.pack} focus={vm.focus} marks={marks} actions={actions} run={run} busy={pending} /> : null}

      {vm.lastChange ? (
        <div className={s.change}>
          <span>
            {changeCard.added(vm.lastChange.added)} · {changeCard.updated(vm.lastChange.updated)} · {changeCard.removed(vm.lastChange.removed)}
          </span>
          <Button variant="default" radius="md" h={44} className={s.outline} disabled={pending} onClick={() => undo(vm.lastChange!.changeSetId)}>
            {changeCard.undo}
          </Button>
        </div>
      ) : null}
      {refused ? (
        <Paper radius="lg" p="lg" className={s.panelStrong} role="alert">
          {refused.map((p) => <p key={p} className={s.alertWord}>{undoRefused(p)}</p>)}
        </Paper>
      ) : null}

      <aside className={s.edge}>
        <a href={vm.specHref} className={s.spec}>{toSpec}</a>
        {vm.sources.length || reading ? (
          <ul className={s.sources}>
            {reading ? (
              <li>
                <span className={s.sourceName}>{reading}</span>
                <span className={s.sourceState}>{sourceState.reading}</span>
              </li>
            ) : null}
            {vm.sources.map((src) => <SourceLine key={src.id} source={src} />)}
          </ul>
        ) : null}
        {vm.model ? (
          <Select
            ref={model}
            label={modelLabel}
            data={vm.model.options}
            value={vm.model.current}
            allowDeselect={false}
            disabled={pending}
            radius="md"
            size="md"
            classNames={{ label: s.fieldLabel, input: s.select, option: s.option }}
            comboboxProps={{ withinPortal: false }}
            onChange={(v) => { if (v && v !== vm.model!.current) run(() => actions.setModel(v)); }}
          />
        ) : null}
        <div className={s.field}>
          <label htmlFor={ids.creativity} className={s.fieldLabel}>{creativityLabel}</label>
          <div className={s.row}>
            <input
              id={ids.creativity}
              type="range"
              className={s.range}
              min={0}
              max={2}
              step={0.1}
              value={creativity}
              disabled={pending}
              onChange={(e) => setCreativity(Number(e.target.value))}
              onPointerUp={commitCreativity}
              onKeyUp={commitCreativity}
            />
            <output htmlFor={ids.creativity} className={s.value}>{creativity.toFixed(1)}</output>
          </div>
        </div>
      </aside>

      {newestFirst.length ? (
        <ol className={s.messages} reversed aria-label={logName}>
          {newestFirst.map((m, i) => (
            <li key={m.id} className={m.role === "user" ? s.user : m.role === "caw" ? s.caw : s.bot}>
              <span className={s.srOnly}>{speaker[m.role]}</span>
              <Clamp>{m.text}</Clamp>
              {i === 0 || newestFirst[i - 1]!.atLabel !== m.atLabel ? <time dateTime={m.at} className={s.at}>{m.atLabel}</time> : null}
            </li>
          ))}
        </ol>
      ) : null}

      <RequiredList items={leftover} />
    </div>
  );
}
