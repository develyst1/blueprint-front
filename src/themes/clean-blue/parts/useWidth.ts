"use client";

// The width an element actually has (ResizeObserver). 0 until measured — callers keep their server default until then.
import { useEffect, useRef, useState } from "react";

export function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(Math.round(e!.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

/** An SVG of natural width `w` shown in a box `box` px wide: shrink to fit, but never below `min` × — scroll past that. */
export function fitStyle(w: number, box: number, min: number) {
  return box > 0 && w > box ? { width: Math.max(box, w * min), height: "auto" } : undefined;
}
