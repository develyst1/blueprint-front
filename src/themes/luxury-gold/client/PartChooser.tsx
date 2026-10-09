"use client";

// The history part chooser: links from the VM, in the VM's order, each with its kind's mark (v1.8 `parts[].kind`),
// under the heading `words.historyPick` (v1.8). It scrolls inside its own box, and the current part is scrolled into
// view on open, so it is never buried below the fold (critique C-006 A P1). Before a part is chosen it is the page's
// main content (History.tsx), so the page is never empty: then each kind starts its own row, under a mark + word legend.
// The kind word is also in each link for screen readers — two parts may share a title (an API and a step).
import { useEffect, useRef } from "react";
import type { PartKind } from "@/core/theme/contract";
import { historyPick, partKind } from "@/core/words";
import { PartMark } from "../primitives/PartMark";
import { keepRingInView } from "./ringInView";

type Part = { key: string; kind: PartKind; title: string; href: string };

export function PartChooser({ parts, current, main = false }: { parts: Part[]; current: string | null; main?: boolean }) {
  const cur = useRef<HTMLAnchorElement>(null);
  const box = useRef<HTMLUListElement>(null);
  useEffect(() => {
    // Scroll only this box, by scrollTop — not scrollIntoView, which moves the browser's focus starting point and
    // made the first Tab skip the skip link (TASK-C-006 rework, measured).
    const a = cur.current, b = box.current;
    if (a && b && b.scrollHeight > b.clientHeight) b.scrollTop = Math.max(0, a.offsetTop - b.offsetTop - b.clientHeight / 2 + a.offsetHeight / 2);
  }, []);
  const present = [...new Set(parts.map((p) => p.kind))];
  return (
    <nav className={main ? "lg-plaque lg-part-chooser lg-part-chooser-main" : "lg-plaque lg-part-chooser"} aria-labelledby="lg-part-pick">
      <h2 id="lg-part-pick" className="lg-part-pick">{historyPick}</h2>
      {main && (
        <ul className="lg-legend" aria-hidden="true">
          {present.map((k) => (
            <li key={k}>
              <PartMark kind={k} />
              {partKind[k]}
            </li>
          ))}
        </ul>
      )}
      <ul className="lg-part-scroll" ref={box} onFocus={(e) => box.current && keepRingInView(box.current, e.target as HTMLElement)}>
        {parts.map((p, i) => (
          <li key={p.key} data-kind-start={i === 0 || parts[i - 1]!.kind !== p.kind || undefined}>
            <a
              ref={p.key === current ? cur : undefined}
              className="lg-part-link"
              href={p.href}
              aria-current={p.key === current ? "page" : undefined}
            >
              <PartMark kind={p.kind} />
              <span>{p.title}</span>
              <span className="lg-sr-only">; {partKind[p.kind]}</span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
