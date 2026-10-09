// Sequence layout: participants left→right in the order they first take part, `x` = the centre of each lifeline;
// messages top→bottom in their order, evenly spaced. A message with a missing end still gets its row.
import type { ParticipantVM, SeqLayout } from "@/core/theme/contract";
import type { ApiSequence } from "@/core/model/build/types";
import { estimateLabel } from "./text";

export const SEQ = { titlePx: 15, minCol: 140, colPad: 40, head: 72, step: 52, pad: 24 };

export function sequenceLayout(participants: ParticipantVM[], messages: ApiSequence["messages"]): SeqLayout {
  const byKey = new Map(participants.map((p) => [p.key, p]));
  const order: string[] = [];
  for (const m of messages) for (const k of [m.from, m.to]) if (k && byKey.has(k) && !order.includes(k)) order.push(k);
  for (const p of participants) if (!order.includes(p.key)) order.push(p.key); // takes no part in a message: last
  const col = Math.max(SEQ.minCol, ...participants.map((p) => estimateLabel(p.title, SEQ.titlePx).w + SEQ.colPad));
  return {
    width: SEQ.pad * 2 + order.length * col,
    height: SEQ.head + (messages.length + 1) * SEQ.step + SEQ.pad,
    participants: order.map((k, i) => ({ ...byKey.get(k)!, x: SEQ.pad + col / 2 + i * col })),
    messages: messages.map((m, i) => ({
      key: m.key, order: i + 1, y: SEQ.head + (i + 1) * SEQ.step, from: m.from, to: m.to, text: m.text, reply: m.reply,
    })),
  };
}
