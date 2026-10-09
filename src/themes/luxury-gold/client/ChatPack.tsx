"use client";

// The open-question pack in luxury gold (REQ-004 R2, D-021, D-026): one HeroUI Card per question on the plaque.
// A card shows its question (serif, the required item), then one of: the proposed answer · the bot's suggestion with its
// own `acceptPack` · for a question with no proposed answer, `answerOwn` (send) and `notNeeded` with `reasonOptional`.
// Under the cards, `acceptAll(n)` takes every card that has a proposed answer — never a bot suggestion, which is
// accepted on its own card after it has been read. ?q=<key> (AC-8) focuses that card.
import { Button, Card, Input, ScrollShadow, TextField } from "@heroui/react";
import { useEffect, useRef, useState } from "react";
import type { ChatActions, ChatVM, RequiredItem } from "@/core/theme/contract";
import { findRequired, requiredId, requiredProps } from "@/core/theme/required";
import { proposedAnswer as proposedAnswerWord } from "@/core/words";
import { acceptAll, acceptPack, answerOwn, botSuggests, notNeeded, packName, reasonOptional, send as sendWord } from "@/features/chat/words";
import type { Run } from "./ChatDesk";

type Question = ChatVM["pack"][number];

/** A question with no proposed answer: answer it in your own words, or park it with an optional reason. Two small
 *  forms, so Enter submits the one you are typing in. */
function OwnAnswer({ q, titleId, actions, run, busy }: { q: Question; titleId: string; actions: ChatActions; run: Run; busy: boolean }) {
  const [answer, setAnswer] = useState("");
  const [reason, setReason] = useState("");
  return (
    <div className="lg-pack-own">
      <form
        className="lg-pack-own-row"
        onSubmit={(e) => {
          e.preventDefault();
          const said = answer.trim();
          if (said) run(() => actions.answer(q.key, said), (r) => { if (r.ok) setAnswer(""); });
        }}
      >
        <TextField className="lg-chat-field" value={answer} onChange={setAnswer} isDisabled={busy} aria-label={answerOwn} aria-describedby={titleId}>
          <Input placeholder={answerOwn} />
        </TextField>
        <Button type="submit" variant="secondary" isDisabled={busy || !answer.trim()} aria-describedby={titleId}>{sendWord}</Button>
      </form>
      <form
        className="lg-pack-own-row"
        onSubmit={(e) => {
          e.preventDefault();
          const why = reason.trim();
          run(() => actions.park(q.key, why || undefined), (r) => { if (r.ok) setReason(""); });
        }}
      >
        <TextField className="lg-chat-field lg-chat-field-quiet" value={reason} onChange={setReason} isDisabled={busy} aria-label={reasonOptional} aria-describedby={titleId}>
          <Input placeholder={reasonOptional} />
        </TextField>
        <Button type="submit" variant="tertiary" isDisabled={busy} aria-describedby={titleId}>{notNeeded}</Button>
      </form>
    </div>
  );
}

export function ChatPack({ pack, focus, required, actions, run, busy }: {
  pack: ChatVM["pack"]; focus: string | null; required: RequiredItem[]; actions: ChatActions; run: Run; busy: boolean;
}) {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const card = focus ? box.current?.querySelector<HTMLElement>(`[data-key="${CSS.escape(focus)}"]`) : null;
    card?.focus();
  }, [focus]);
  const answerable = pack.filter((q) => q.proposedAnswer !== null && !q.suggested).map((q) => q.key);
  return (
    <section className="lg-pack">
      {/* a Tab stop: at 1440 the list scrolls inside its column and may hold no control (cards with answers only); the
          shadow says there is more below (critique C-013) */}
      <ScrollShadow ref={box} className="lg-pack-list" size={48} tabIndex={0} role="region" aria-label={packName}>
        {pack.map((q) => {
          const item = findRequired(required, requiredId.part(q.key));
          const titleId = `lg-q-${q.key}`;
          return (
            <Card key={q.key} data-key={q.key} tabIndex={-1} className="lg-pack-card" role="group" aria-labelledby={titleId}>
              <p id={titleId} className="lg-pack-question" {...(item ? requiredProps(item) : {})}>{q.text}</p>
              {q.proposedAnswer !== null && q.suggested ? (
                <div className="lg-pack-suggestion">
                  <p>{botSuggests(q.proposedAnswer)}</p>
                  <Button variant="secondary" isDisabled={busy} aria-describedby={titleId} onPress={() => run(() => actions.accept([q.key]))}>
                    {acceptPack}
                  </Button>
                </div>
              ) : q.proposedAnswer !== null ? (
                <div className="lg-pack-answer">
                  <span className="lg-group-title">{proposedAnswerWord}</span>
                  <p>{q.proposedAnswer}</p>
                </div>
              ) : (
                <OwnAnswer q={q} titleId={titleId} actions={actions} run={run} busy={busy} />
              )}
              {q.cases.length > 0 && (
                <ul className="lg-pack-cases">
                  {q.cases.map((c) => <li key={c}>{c}</li>)}
                </ul>
              )}
            </Card>
          );
        })}
      </ScrollShadow>
      {answerable.length > 0 && (
        <Button className="lg-pack-accept" variant="primary" isDisabled={busy} onPress={() => run(() => actions.accept(answerable))}>
          {acceptAll(answerable.length)}
        </Button>
      )}
    </section>
  );
}
