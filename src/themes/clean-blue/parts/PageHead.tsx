"use client";

// Every page opens the same way: its tile and its name, then (optionally) a chooser row on the right.
import type { ReactNode } from "react";
import type { NavItemVM } from "@/core/theme/contract";
import { pageLabel } from "@/core/words";
import { PageTile } from "./Tile";
import { useEdges } from "./useEdges";
import s from "./parts.module.css";

export function PageHead({ page, children }: { page: NavItemVM["page"]; children?: ReactNode }) {
  return (
    <div className={s.pageHead}>
      <h2 className={s.pageTitle}>
        <PageTile page={page} tone="current" size="lg" />
        {pageLabel[page]}
      </h2>
      {children}
    </div>
  );
}

/** Links to choose one of several (works, steps, parts) — pills; the current one filled. Not printed. */
export function Choose({ items, current, label }: { items: { key: string; title: ReactNode; href: string }[]; current: string | null; label: string }) {
  const row = useEdges<HTMLElement>(true);
  return (
    <nav ref={row} className={s.choose} aria-label={label} data-print="screen-only">
      {items.map((it) => (
        <a key={it.key} href={it.href} className={s.pill} aria-current={it.key === current ? "page" : undefined}>{it.title}</a>
      ))}
    </nav>
  );
}
