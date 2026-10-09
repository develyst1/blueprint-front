// A part kind's shape — participants keep their kind colour; every other kind is ink, told apart by shape alone.
// Used by ใยโหนด (nodes, legend, plaque) and ประวัติ's part chooser (v1.8 `parts[].kind`). Always decorative: the word
// for the kind sits beside it where it is needed.
import type { PartKind } from "@/core/theme/contract";
import { kinds } from "../tokens";

export function PartMark({ kind }: { kind: PartKind }) {
  const c = kind in kinds ? kinds[kind as keyof typeof kinds].color : "var(--lg-navy)";
  return (
    <svg className="lg-partmark" width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
      {kind === "work" && <circle cx="11" cy="11" r="10" fill="var(--lg-navy)" stroke="var(--lg-gold-line)" strokeWidth="2" />}
      {kind === "step" && <circle cx="11" cy="11" r="9" fill="var(--lg-navy)" />}
      {kind === "role" && <circle cx="11" cy="11" r="8" fill={c} />}
      {kind === "screen" && <rect x="3" y="3" width="16" height="16" rx="3" fill={c} />}
      {kind === "api" && <path d="M11 2 20 11 11 20 2 11Z" fill={c} />}
      {kind === "system" && <path d="M11 2 20 19 2 19Z" fill={c} />}
      {kind === "interaction" && <circle cx="11" cy="11" r="4" fill="var(--lg-ink-2)" />}
      {kind === "data" && <rect x="4" y="4" width="14" height="14" fill="none" stroke="var(--lg-ink)" strokeWidth="2" />}
      {kind === "decision" && <path d="M11 3 19 11 11 19 3 11Z" fill="none" stroke="var(--lg-ink)" strokeWidth="2" />}
      {kind === "question" && (
        <>
          <circle cx="11" cy="11" r="9" fill="none" stroke="var(--lg-ink)" strokeWidth="2" />
          <path d="M8.5 8.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .8-1 1.5M11 15.5v.5" fill="none" stroke="var(--lg-ink)" strokeWidth="1.8" />
        </>
      )}
    </svg>
  );
}
