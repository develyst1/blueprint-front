"use client";

// Screen ② (REQ-004) in luxury gold — the dictated brief. DOM order = reading order at every width: the composer (the
// one focus, first stop after the skip link) · the open-question pack · the conversation set as minutes (speaker in a
// serif column, words beside it, newest first so the reply sits under the box, the day once per day, the card of what
// the last answer changed right after the newest bot line that answered) · the quiet edge (sources, model, creativity).
// At 1440 the pack and the edge share the right column (grid areas); at ≤ 900 px one column in DOM order, so on a phone
// the reply is never below the settings (critique C-013 P1-c).
// One transition for every action: `thinking` while any runs, every control off. Words only from
// @/core/words, @/features/chat/words and the view model; never typed here.
import { Alert, Button, TextArea, TextField } from "@heroui/react";
import { Fragment, useId, useRef, useState, useTransition, type FormEvent, type KeyboardEvent } from "react";
import type { ChatActions, ChatPageProps } from "@/core/theme/contract";
import {
  actionError, botFailed, changeCard, chatPlaceholder, chooseFile, enterHint, logName, navChat, originChoices, send as sendWord,
  speaker, thinking, tryAgain, undoRefused, uploadAsks,
} from "@/features/chat/words";
import { ChatEdge } from "./ChatEdge";
import { ChatPack } from "./ChatPack";

type Result = Awaited<ReturnType<ChatActions["send"]>>;
export type Run = (fn: () => Promise<Result>, after?: (r: Result) => void) => void;

/** An action's failure in words (D-020): the codes that have one; the others are prevented or shown elsewhere. */
const errorWord = (r: Result) => (!r.ok && r.code in actionError ? actionError[r.code as keyof typeof actionError] : null);

export function ChatDesk({ vm, actions, required }: ChatPageProps) {
  const [text, setText] = useState("");
  const [pending, start] = useTransition();
  const [refused, setRefused] = useState<string[] | null>(null);
  const [failure, setFailure] = useState<{ word: string; again: (() => void) | null } | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [reading, setReading] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const modelRef = useRef<HTMLButtonElement>(null);
  const ids = { hint: useId(), origin: useId() };

  // fn first, then after: `after?.(await fn())` would skip fn whenever after is absent (optional call short-circuits)
  const run: Run = (fn, after) => start(async () => {
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
      const word = errorWord(r);
      // only a connection failure is worth trying again as is; the others need a different file
      setFailure(word ? { word, again: !r.ok && r.code === "unreachable" ? () => upload(stamp, f) : null } : null);
    });
  };
  const undo = (changeSetId: string) => {
    setFailure(null);
    run(() => actions.undo(changeSetId), (r) => {
      setRefused(!r.ok && r.code === "undo_refused" ? r.parts ?? [] : null);
      const word = !r.ok && r.code !== "undo_refused" ? errorWord(r) : null;
      setFailure(word ? { word, again: !r.ok && r.code === "unreachable" ? () => undo(changeSetId) : null } : null);
    });
  };

  const isFailed = (m: { roundStatus: string | null }) => m.roundStatus === "bot_could_not_answer";
  const newestBot = [...vm.messages].reverse().find((m) => m.role === "bot");
  // empty rows (a park-only turn) never get a line; nor does the newest failed reply while its alert says the same
  const minutes = [...vm.messages].reverse().filter((m) => m.text.trim() !== "" && !(vm.failed && !pending && m.id === newestBot?.id));
  // the change card goes under the newest bot line that answered — never under a failed one (critique C-013 P1-b)
  const changeAfter = vm.lastChange ? minutes.find((m) => m.role === "bot" && !isFailed(m))?.id ?? null : null;
  const change = vm.lastChange && (
    <div className="lg-chat-change">
      <p className="lg-chat-change-counts">
        <span>{changeCard.added(vm.lastChange.added)}</span>
        <span>{changeCard.updated(vm.lastChange.updated)}</span>
        <span>{changeCard.removed(vm.lastChange.removed)}</span>
      </p>
      <Button variant="secondary" isDisabled={pending} onPress={() => undo(vm.lastChange!.changeSetId)}>{changeCard.undo}</Button>
      {refused && (
        <div role="alert" className="lg-chat-refused">
          {refused.map((p) => <p key={p}>{undoRefused(p)}</p>)}
        </div>
      )}
    </div>
  );

  return (
    <div className="lg-page lg-page-split lg-chat">
      <h1 className="lg-sr-only">{navChat}</h1>

      <section className="lg-chat-composer">
        <form className="lg-chat-form" onSubmit={send}>
          <TextField className="lg-chat-box" value={text} onChange={setText} aria-label={chatPlaceholder} aria-describedby={ids.hint}>
            <TextArea
              rows={4}
              placeholder={chatPlaceholder}
              onKeyDown={onKey}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                const f = e.dataTransfer.files[0];
                if (f) { e.preventDefault(); setFile(f); }
              }}
            />
          </TextField>
          <div className="lg-chat-form-row">
            <span id={ids.hint} className="lg-chat-hint">{enterHint}</span>
            {/* the native picker stays out of sight and out of the accessibility tree; our own button opens it */}
            <input
              ref={fileInput}
              type="file"
              className="lg-sr-only"
              tabIndex={-1}
              aria-hidden="true"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) setFile(f); e.target.value = ""; }}
            />
            <Button variant="secondary" isDisabled={pending} onPress={() => fileInput.current?.click()}>{chooseFile}</Button>
            <Button type="submit" variant="primary" isDisabled={pending || !text.trim()}>{sendWord}</Button>
          </div>
        </form>

        {file && (
          <div role="group" aria-labelledby={ids.origin} className="lg-chat-origin" onKeyDown={(e) => { if (e.key === "Escape") setFile(null); }}>
            <p id={ids.origin} className="lg-chat-origin-ask">{uploadAsks}</p>
            <p className="lg-chat-origin-file">{file.name}</p>
            <div className="lg-chat-origin-row">
              {originChoices.map((o) => (
                <Button key={o.stamp} variant="secondary" onPress={() => upload(o.stamp, file)} autoFocus={o.stamp === "operator"}>
                  {o.label}
                </Button>
              ))}
            </div>
          </div>
        )}

        <div role="status" aria-live="polite" className="lg-chat-status">
          {pending && <p className="lg-chat-thinking"><span className="lg-chat-speaker">{speaker.bot}</span><span>{thinking}</span></p>}
        </div>

        {failure && (
          <Alert status="danger" className="lg-chat-alert" role="alert">
            <Alert.Content><Alert.Title>{failure.word}</Alert.Title></Alert.Content>
            {failure.again && <Button variant="secondary" onPress={failure.again}>{tryAgain}</Button>}
          </Alert>
        )}

        {vm.failed && !pending && (
          <Alert status="warning" className="lg-chat-alert" role="alert">
            <Alert.Content><Alert.Title>{botFailed.message}</Alert.Title></Alert.Content>
            <div className="lg-chat-alert-row">
              <Button variant="primary" onPress={() => run(() => actions.retry())}>{botFailed.retry}</Button>
              {vm.model && <Button variant="secondary" onPress={() => modelRef.current?.focus()}>{botFailed.changeModel}</Button>}
            </div>
          </Alert>
        )}
      </section>

      {vm.pack.length > 0 && <ChatPack pack={vm.pack} focus={vm.focus} required={required} actions={actions} run={run} busy={pending} />}

      <section className="lg-chat-log">
        {change && !changeAfter && change}
        {minutes.length > 0 && (
          <ol className="lg-minutes" aria-label={logName}>
            {minutes.map((m, i) => (
              <Fragment key={m.id}>
                {/* the day once per day, above its newest line */}
                {(i === 0 || minutes[i - 1]!.atLabel !== m.atLabel) && (
                  <li className="lg-minutes-day"><time dateTime={m.at}>{m.atLabel}</time></li>
                )}
                <li className="lg-minutes-row" data-role={m.role} data-failed={isFailed(m) || undefined}>
                  <span className="lg-chat-speaker">{speaker[m.role]}</span>
                  <p className="lg-minutes-text">{m.text}</p>
                </li>
                {m.id === changeAfter && <li className="lg-minutes-change">{change}</li>}
              </Fragment>
            ))}
          </ol>
        )}
      </section>

      <ChatEdge vm={vm} actions={actions} run={run} busy={pending} reading={reading} modelRef={modelRef} />
    </div>
  );
}
