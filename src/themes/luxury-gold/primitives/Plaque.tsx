// The plaque: the side panel beside a page's one picture. What is stuck here comes first, then the content.
import type { ReactNode } from "react";
import { Seal } from "./Seal";

export type PlaqueStuck = { wording: string; title: string };

export function Plaque({
  title,
  stuck = [],
  children,
}: {
  /** The part's own title (no invented heading words). */
  title?: string;
  stuck?: readonly PlaqueStuck[];
  children?: ReactNode;
}) {
  return (
    <aside className="lg-plaque">
      {stuck.map((s) => (
        <div className="lg-plaque-stuck" key={s.wording + s.title}>
          <Seal size={22} />
          <div>
            <div className="lg-plaque-stuck-kind">{s.wording}</div>
            <div>{s.title}</div>
          </div>
        </div>
      ))}
      {title && <h2 className="lg-plaque-title">{title}</h2>}
      {children}
    </aside>
  );
}
