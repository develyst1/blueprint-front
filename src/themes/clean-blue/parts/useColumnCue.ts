"use client";

// What a sideways scroller shows of its columns (REQ-017 back room, comp C, TASK-C-047 / C-048): the heads matching
// `selector` that are `hidden` past its right edge (left edge at or beyond it), and the ones `seen` — at least half
// inside the visible part, between the right edge of the sticky column (`stickySelector`, if any) and the scroller's
// right edge, so heads scrolled away on the left are not counted. Updated on load, scroll and resize; `hidden` is 0 once
// scrolled to the end. The scroller is the caller's ref (useEdges marks its fades on the same element).
import { useEffect, useState, type RefObject } from "react";

export function useColumnCue(box: RefObject<HTMLElement | null>, selector: string, stickySelector?: string) {
  const [cue, setCue] = useState({ hidden: 0, seen: 0, total: 0 });
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const count = () => {
      const heads = [...el.querySelectorAll<HTMLElement>(selector)].map((h) => h.getBoundingClientRect());
      const view = el.getBoundingClientRect();
      const sticky = stickySelector ? el.querySelector<HTMLElement>(stickySelector)?.getBoundingClientRect().right : undefined;
      const from = sticky ?? view.left, to = view.right;
      const hidden = heads.filter((h) => h.left >= to - 1).length;
      const seen = heads.filter((h) => Math.min(h.right, to) - Math.max(h.left, from) >= h.width / 2).length;
      setCue((c) => (c.hidden === hidden && c.seen === seen && c.total === heads.length ? c : { hidden, seen, total: heads.length }));
    };
    count();
    el.addEventListener("scroll", count, { passive: true });
    const ro = new ResizeObserver(count);
    ro.observe(el);
    return () => { el.removeEventListener("scroll", count); ro.disconnect(); };
  }, [box, selector, stickySelector]);
  return cue;
}
