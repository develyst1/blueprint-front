// The participant-kind legend: mark + word for each kind. Words from @/core/words (REQ-002 § wording, Q3b);
// no title — none is in the wording.
import { participantKind } from "@/core/words";
import { kindOrder, type Kind } from "../tokens";
import { KindMark } from "./KindMark";

export function Legend({ only }: { only?: readonly Kind[] }) {
  const shown = only ? kindOrder.filter((k) => only.includes(k)) : kindOrder;
  return (
    <ul className="lg-legend">
      {shown.map((k) => (
        <li key={k}>
          <KindMark kind={k} />
          {participantKind[k]}
        </li>
      ))}
    </ul>
  );
}
