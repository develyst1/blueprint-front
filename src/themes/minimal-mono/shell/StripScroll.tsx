"use client";

// A scroll box opened with its current item ([aria-current="page"]) in view — the phone's page-name strip
// (REVIEW-C-002 row 12) and the history part list (row 21). It moves only its own scrollLeft / scrollTop — never
// scrollIntoView, which also moves the browser's focus start past the skip link (Team C's C-006 lesson). A box
// that is hidden (width 0) or does not scroll is left alone. `edge` keeps the item clear of an edge fade.
import { useLayoutEffect, useRef, type ReactNode } from "react";

export function StripScroll({ className, edge = 0, children }: { className: string; edge?: number; children: ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = box.current;
    const cur = el?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!el || !cur || el.clientWidth === 0) return;
    const b = el.getBoundingClientRect(), c = cur.getBoundingClientRect();
    // positions inside the scrolled content, whatever the offsetParent
    const left = c.left - b.left + el.scrollLeft, right = c.right - b.left + el.scrollLeft;
    const top = c.top - b.top + el.scrollTop, bottom = c.bottom - b.top + el.scrollTop;
    if (right > el.scrollLeft + el.clientWidth - edge) el.scrollLeft = right - el.clientWidth + edge;
    else if (left < el.scrollLeft) el.scrollLeft = Math.max(0, left - 16);
    if (bottom > el.scrollTop + el.clientHeight) el.scrollTop = bottom - el.clientHeight + 8;
    else if (top < el.scrollTop) el.scrollTop = Math.max(0, top - 8);
  }, []);
  return (
    <div ref={box} className={className}>
      {children}
    </div>
  );
}
