"use client";

// The default chat page (SPEC-A-006, TASK-A-031, TASK-A-035) — every theme's fallback until it has its own `chat`,
// like the core's default theme: plain HTML + one CSS module, no theme library. The chat box is the one focus and the
// first stop after the skip link; under it, in order: what the bot is doing, the question pack, what the last answer
// changed, the edge (sources, ดู spec, model), and the conversation (newest first, so the reply sits under the box).
// Words only from ./words and @/core/words; a word REQ-004 lacks is a question in the TASK, never typed here.
import { useEffect, useId, useLayoutEffect, useRef, useState, useTransition, type FormEvent, type KeyboardEvent, type ReactNode } from "react";
import { requiredProps } from "@/core/theme/required";
import { proposedAnswer as proposedAnswerWord, showMore } from "@/core/words";
import type { ActionCode, ActionResult, ChatPageProps, ChatQuestionVM, ChatSourceVM } from "./contract";
import {
  acceptAll, cancel, acceptPack, actionError, answerOwn, botFailed, botSuggests, changeCard, chatPlaceholder, chooseFile, creativityLabel,
  enterHint, logName, modelLabel, notNeeded, originChoices, packName, reasonOptional, send as sendWord, sourceFailed,
  sourceState, speaker, thinking, toSpec, tryAgain, undoRefused, uploadAsks,
} from "./words";
import s from "./chat.module.css";

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

/** A question with no proposed answer (REQ-003 Addendum A): answer it in your own words (ส่ง), or park it with an
 *  optional reason (ไม่ต้องใช้ข้อนี้). Each is its own small form, so Enter submits the one you are typing in. */
function OwnAnswer({ q, titleId, actions, run, busy }: { q: ChatQuestionVM; titleId: string; actions: ChatPageProps["actions"]; run: Run; busy: boolean }) {
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
        <button type="submit" className={s.secondary} disabled={busy || !answer.trim()} aria-describedby={titleId}>{sendWord}</button>
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

function Pack({ pack, focus, required, actions, run, busy }: {
  pack: ChatQuestionVM[]; focus: string | null; required: ChatPageProps["required"]; actions: ChatPageProps["actions"]; run: Run; busy: boolean;
}) {
  const box = useRef<HTMLDivElement>(null);
  // ?q=<key> (AC-8): that card scrolled into the box (its own scrollTop, never scrollIntoView) and focused
  useEffect(() => {
    const el = box.current;
    const card = focus ? el?.querySelector<HTMLElement>(`[data-key="${CSS.escape(focus)}"]`) : null;
    if (!el || !card) return;
    el.scrollTop = card.offsetTop - el.offsetTop - 8;
    card.focus({ preventScroll: true });
  }, [focus]);
  const req = new Map(required.map((r) => [r.id, r]));
  // ตามนั้น for the pack: the questions that carry a proposed answer (the server refuses any other key) — never a bot
  // suggestion, which is accepted only on its own card, after it has been read
  const answerable = pack.filter((q) => q.proposedAnswer !== null && !q.suggested).map((q) => q.key);
  return (
    <section className={s.pack}>
      {/* a Tab stop (A-043): when the box scrolls and holds no control (only cards with answers), the keyboard still
          reaches it — Tab focuses it, arrows / PageDown scroll it; the ring is .page :focus-visible */}
      <div ref={box} className={s.packBox} tabIndex={0} role="region" aria-label={packName}>
        {pack.map((q) => {
          const item = req.get(`part:${q.key}`);
          const titleId = `q-${q.key}`;
          return (
            <article key={q.key} data-key={q.key} tabIndex={-1} className={s.card} aria-labelledby={titleId}>
              <Clamp className={s.question}>
                <span id={titleId} {...(item ? requiredProps(item) : {})}>{q.text}</span>
              </Clamp>
              {q.proposedAnswer !== null && q.suggested ? (
                // the bot's suggestion — dashed, worded as a suggestion, with its own ตามนั้น (A-R4)
                <div className={s.suggestion}>
                  <Clamp>{botSuggests(q.proposedAnswer)}</Clamp>
                  <button type="button" className={s.secondary} disabled={busy} aria-describedby={titleId} onClick={() => run(() => actions.accept([q.key]))}>
                    {acceptPack}
                  </button>
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
        <button type="button" className={s.primary} onClick={() => run(() => actions.accept(answerable))} disabled={busy}>
          {acceptAll(answerable.length)}
        </button>
      ) : null}
    </section>
  );
}

function SourceLine({ source }: { source: ChatSourceVM }) {
  // the Thai reason for a known code; an unknown code → อ่านไม่ได้ alone — a code is never shown
  const word = source.state === "read" ? sourceState.read : sourceFailed(source.reason);
  return (
    <li className={source.state === "failed" ? s.sourceFailed : undefined}>
      <span className={s.sourceName}>{source.name}</span>
      <span className={s.sourceState}>{word}</span>
    </li>
  );
}

/** An action's failure in words (D-020): the four codes that have one. `invalid` / `undo_refused` are shown elsewhere
 *  or not at all (the page itself prevents an invalid send). */
const errorWord = (code: ActionCode) => (code in actionError ? actionError[code as keyof typeof actionError] : null);

export function DefaultChat({ vm, actions, required }: ChatPageProps) {
  const [text, setText] = useState("");
  const [pending, start] = useTransition();
  const [refused, setRefused] = useState<string[] | null>(null);
  const [failure, setFailure] = useState<{ word: string; again: (() => void) | null } | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [reading, setReading] = useState<string | null>(null);
  const [creativity, setCreativity] = useState(vm.creativity);
  const box = useRef<HTMLTextAreaElement>(null);
  const model = useRef<HTMLSelectElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const fileButton = useRef<HTMLButtonElement>(null);
  const ids = { model: useId(), creativity: useId(), origin: useId(), hint: useId() };

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
      // only a connection failure is worth trying again as is; the others need a different file
      setFailure(word ? { word, again: !r.ok && r.code === "unreachable" ? () => upload(stamp, f) : null } : null);
    });
  };
  // ยกเลิก / Escape on "ไฟล์นี้มาจากใคร" (D-034): the question closes, nothing is uploaded, focus goes back to เลือกไฟล์
  const cancelUpload = () => {
    setFile(null);
    fileButton.current?.focus();
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

  // A-034 already leaves empty rows out; a row with no words never gets a bubble here either
  const newestFirst = [...vm.messages].reverse().filter((m) => m.text.trim() !== "");

  return (
    <div className={s.page}>
      <form className={s.composer} onSubmit={send}>
        <textarea
          ref={box}
          className={s.box}
          rows={3}
          value={text}
          placeholder={chatPlaceholder}
          aria-label={chatPlaceholder}
          aria-describedby={ids.hint}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKey}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            const f = e.dataTransfer.files[0];
            if (f) { e.preventDefault(); setFile(f); }
          }}
        />
        <div className={s.composerRow}>
          <span id={ids.hint} className={s.hint}>{enterHint}</span>
          <div className={s.row}>
            {/* the native picker stays in the page but out of sight, and out of the accessibility tree too: labelled, it
                was a second, unfocusable "เลือกไฟล์" button to a screen reader. The visible button is the control. */}
            <input
              ref={fileInput}
              type="file"
              className={s.srOnly}
              tabIndex={-1}
              aria-hidden="true"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) setFile(f); e.target.value = ""; }}
            />
            <button ref={fileButton} type="button" className={s.secondary} onClick={() => fileInput.current?.click()}>{chooseFile}</button>
            <button type="submit" className={s.primary} disabled={pending || !text.trim()}>{sendWord}</button>
          </div>
        </div>
      </form>

      {file ? (
        <div role="group" aria-labelledby={ids.origin} className={s.origin} onKeyDown={(e) => { if (e.key === "Escape") cancelUpload(); }}>
          <p id={ids.origin} className={s.originAsk}>{uploadAsks}</p>
          <p className={s.originFile}>{file.name}</p>
          <div className={s.row}>
            {originChoices.map((o) => (
              <button key={o.stamp} type="button" className={s.secondary} onClick={() => upload(o.stamp, file)} autoFocus={o.stamp === "operator"}>
                {o.label}
              </button>
            ))}
            <button type="button" className={`${s.textButton} ${s.cancel}`} onClick={cancelUpload}>{cancel}</button>
          </div>
        </div>
      ) : null}

      <div role="status" aria-live="polite" className={s.status}>
        {pending ? <span className={s.thinking}>{thinking}</span> : null}
      </div>

      {failure ? (
        <div role="alert" className={s.refused}>
          <p>{failure.word}</p>
          {failure.again ? <button type="button" className={s.secondary} onClick={failure.again}>{tryAgain}</button> : null}
        </div>
      ) : null}

      {vm.failed && !pending ? (
        <div role="alert" className={s.failed}>
          <p>{botFailed.message}</p>
          <div className={s.row}>
            <button type="button" className={s.primary} onClick={() => run(() => actions.retry())}>{botFailed.retry}</button>
            {vm.model ? (
              <button type="button" className={s.secondary} onClick={() => model.current?.focus()}>{botFailed.changeModel}</button>
            ) : null}
          </div>
        </div>
      ) : null}

      {vm.pack.length ? <Pack pack={vm.pack} focus={vm.focus} required={required} actions={actions} run={run} busy={pending} /> : null}

      {vm.lastChange ? (
        <div className={s.change}>
          <span>
            {changeCard.added(vm.lastChange.added)} · {changeCard.updated(vm.lastChange.updated)} · {changeCard.removed(vm.lastChange.removed)}
          </span>
          <button type="button" className={s.secondary} disabled={pending} onClick={() => undo(vm.lastChange!.changeSetId)}>
            {changeCard.undo}
          </button>
        </div>
      ) : null}
      {refused ? (
        <div role="alert" className={s.refused}>
          {refused.map((p) => <p key={p}>{undoRefused(p)}</p>)}
        </div>
      ) : null}

      {/* the edge: before the conversation in reading order (on a phone it would otherwise sit under the whole log);
          from 64em the grid puts it in the right column */}
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
          <div className={s.field}>
            <label htmlFor={ids.model}>{modelLabel}</label>
            <select ref={model} id={ids.model} value={vm.model.current} disabled={pending} onChange={(e) => run(() => actions.setModel(e.target.value))}>
              {vm.model.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        ) : null}
        <div className={s.field}>
          <label htmlFor={ids.creativity}>{creativityLabel}</label>
          <div className={s.row}>
            <input
              id={ids.creativity}
              type="range"
              min={0}
              max={2}
              step={0.1}
              value={creativity}
              disabled={pending}
              onChange={(e) => setCreativity(Number(e.target.value))}
              onPointerUp={commitCreativity}
              onKeyUp={commitCreativity}
            />
            <output htmlFor={ids.creativity}>{creativity.toFixed(1)}</output>
          </div>
        </div>
      </aside>

      {newestFirst.length ? (
        <ol className={s.messages} reversed aria-label={logName}>
          {newestFirst.map((m, i) => (
            <li key={m.id} className={m.role === "user" ? s.user : m.role === "caw" ? s.caw : s.bot}>
              {/* who wrote it, for a screen reader (side and fill show it to the eye) */}
              <span className={s.srOnly}>{speaker[m.role]}</span>
              <Clamp>{m.text}</Clamp>
              {/* the day once per day, on its newest message — every bubble repeating it is noise */}
              {i === 0 || newestFirst[i - 1]!.atLabel !== m.atLabel ? <time dateTime={m.at} className={s.at}>{m.atLabel}</time> : null}
            </li>
          ))}
        </ol>
      ) : null}
    </div>
  );
}
