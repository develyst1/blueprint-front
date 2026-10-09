"use client";

// The page list: links from frame.nav (labels and hrefs from the view model — never typed here).
// 1440: a vertical list in the spine. 390: one horizontal strip in a ScrollShadow; every link is a normal
// tab stop, and the current page is scrolled into view when the strip overflows.
import { ScrollShadow } from "@heroui/react";
import { useEffect, useRef } from "react";
import type { NavItemVM } from "@/core/theme/contract";
import { keepRingInView } from "./ringInView";

export function NavStrip({ nav }: { nav: NavItemVM[] }) {
  const current = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    // scrollLeft on the strip only — scrollIntoView would move the browser's focus starting point past the skip link.
    const a = current.current;
    const strip = a?.closest(".lg-nav-scroll");
    if (a && strip instanceof HTMLElement && strip.scrollWidth > strip.clientWidth) {
      const ar = a.getBoundingClientRect(), sr = strip.getBoundingClientRect();
      strip.scrollLeft += ar.left - sr.left - (sr.width - ar.width) / 2;
    }
  }, []);
  return (
    <nav
      className="lg-nav"
      onFocus={(e) => {
        const strip = (e.target as HTMLElement).closest(".lg-nav-scroll");
        if (strip instanceof HTMLElement) keepRingInView(strip, e.target as HTMLElement);
      }}
    >
      {/* A wide fade (64 px) so the cut-off page names read as "more this way" at 390. */}
      <ScrollShadow className="lg-nav-scroll" orientation="horizontal" hideScrollBar size={64}>
        <ul className="lg-nav-list">
          {nav.map((n) => (
            <li key={n.page}>
              <a
                ref={n.current ? current : undefined}
                className="lg-nav-link"
                href={n.href}
                aria-current={n.current ? "page" : undefined}
              >
                {n.label}
              </a>
            </li>
          ))}
        </ul>
      </ScrollShadow>
    </nav>
  );
}
