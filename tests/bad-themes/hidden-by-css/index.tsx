// A deliberately broken theme (test code only — never registered): it renders the first required item of every page
// with display:none. The marker is there, the item is not visible — the check must fail on it (AC-13).
import type { ReactNode } from "react";
import type { PageId, PageVMs, RequiredItem, Theme } from "@/core/theme/contract";
import { requiredProps } from "@/core/theme/required";

function Root({ children }: { children: ReactNode }) {
  return <div data-theme-root="hidden-by-css">{children}</div>;
}

function List({ required }: { vm: PageVMs[PageId]; required: RequiredItem[] }) {
  return (
    <ul>
      {required.map((item, i) => (
        <li key={item.id}><span {...requiredProps(item)} style={i === 0 ? { display: "none" } : undefined}>{item.text}</span></li>
      ))}
    </ul>
  );
}

const pages = Object.fromEntries(
  ["overview", "workOrder", "flowchart", "sequence", "screens", "api", "web", "stuck", "history"].map((p) => [p, List]),
) as Theme["pages"];

export const theme: Theme = { id: "hidden-by-css", name: "hidden by css", Root, pages };
