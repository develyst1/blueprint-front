"use client";

// Scrolls a diagram's own frame on open so a point (the stuck step, the chosen part) is in view — centred on an axis
// only when it lies outside the frame on that axis. By scrollLeft / scrollTop only (never scrollIntoView, which moves
// the browser's focus starting point past the skip link — TASK-C-006 lesson). `display: contents` keeps this wrapper
// out of the page's grid.
import { useEffect, useRef, type ReactNode } from "react";

const MARGIN = 120;

// `nearest`: scroll only as far as needed (a flow keeps its start in view); otherwise centre the point.
export function CenterOn({ x, y, nearest, children }: { x: number; y: number; nearest?: boolean; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const frame = ref.current?.querySelector<HTMLElement>(".lg-diagram");
    if (!frame) return;
    const to = (p: number, size: number) => Math.max(0, nearest ? p + MARGIN - size : p - size / 2);
    const fit = (p: number, size: number) => p > MARGIN && p < size - MARGIN;
    if (!fit(x, frame.clientWidth)) frame.scrollLeft = to(x, frame.clientWidth);
    if (!fit(y, frame.clientHeight)) frame.scrollTop = to(y, frame.clientHeight);
  }, [x, y, nearest]);
  return (
    <div ref={ref} style={{ display: "contents" }}>
      {children}
    </div>
  );
}
