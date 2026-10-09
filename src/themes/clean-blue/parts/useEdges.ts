"use client";

// A sideways row (page dock, choosers): marks which ends have more to scroll to — data-more="start|end|both" — so the
// CSS fades that edge (REVIEW-A-004 row 7). With `current`, the row also scrolls its aria-current item into view on
// load, sideways only (never the page).
import { useEffect, useRef } from "react";

export function useEdges<T extends HTMLElement>(current = false) {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (current) {
      const item = el.querySelector<HTMLElement>('[aria-current="page"]');
      if (item) el.scrollLeft = Math.max(0, item.offsetLeft - (el.clientWidth - item.offsetWidth) / 2);
    }
    const mark = () => {
      const start = el.scrollLeft > 2;
      const end = el.scrollLeft + el.clientWidth < el.scrollWidth - 2;
      el.dataset.more = start && end ? "both" : start ? "start" : end ? "end" : "";
    };
    mark();
    el.addEventListener("scroll", mark, { passive: true });
    const ro = new ResizeObserver(mark);
    ro.observe(el);
    return () => { el.removeEventListener("scroll", mark); ro.disconnect(); };
  }, [current]);
  return ref;
}
