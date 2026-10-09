"use client";

// The work order's step headings, kept in sight while a long swimlane scrolls past (REVIEW-A-002 row 8, TASK-C-010 Q1
// option (a)). The band heads live inside the frame, whose overflow-x makes it the sticky scrollport, so they cannot
// stick to the page. This strip is a zero-height sticky row of .lg-swim — so it unsticks by itself where the swimlane
// ends — shown only once the real heads have scrolled under the top edge, and moved sideways with the frame.
// A visual copy only: aria-hidden, no links, no tab stops (the real heads keep the names, seals and required markers).
// At ≤ 640 px it sits under the sticky top bar.
import { useEffect, useRef, useState } from "react";
import { Seal } from "../primitives/Seal";

type Head = { key: string; number: string; title: string; stuck: boolean; x: number; w: number };

export function SwimHeads({ heads, width, headHeight }: { heads: Head[]; width: number; headHeight: number }) {
  const strip = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const [top, setTop] = useState(0);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const frame = strip.current?.closest(".lg-swim")?.querySelector<HTMLElement>(".lg-swim-scroll");
    if (!frame) return;
    const phone = window.matchMedia("(max-width: 640px)");
    const update = () => {
      const bar = phone.matches ? document.querySelector(".lg-spine")?.getBoundingClientRect().height ?? 0 : 0;
      const r = frame.getBoundingClientRect();
      setTop(bar);
      setShown(r.top + headHeight < bar && r.bottom > bar + headHeight);
      if (track.current) track.current.style.transform = `translateX(${-frame.scrollLeft}px)`;
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    frame.addEventListener("scroll", update, { passive: true });
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      frame.removeEventListener("scroll", update);
    };
  }, [headHeight]);

  return (
    <div ref={strip} className="lg-swim-heads" style={{ top }} data-shown={shown || undefined} aria-hidden="true">
      <div className="lg-swim-heads-bar">
        <span />
        <div className="lg-swim-heads-view">
          <div ref={track} className="lg-swim-heads-track" style={{ width }}>
            {heads.map((h) => (
              <span key={h.key} className="lg-swim-head" data-stuck={h.stuck || undefined} style={{ left: h.x, width: h.w }}>
                <span className="lg-band-num">{h.number}</span>
                <span className="lg-swim-head-title">{h.title}</span>
                {h.stuck && <Seal size={16} />}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
