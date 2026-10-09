// A deliberately broken theme (test code only — never registered): the first required item of every page gets its
// marker on an element with no text (the text sits beside it, unmarked). The check must fail on it (AC-13).
import type { ReactNode } from "react";
import type { PageId, PageVMs, RequiredItem, Theme } from "@/core/theme/contract";
import { requiredProps } from "@/core/theme/required";

function Root({ children }: { children: ReactNode }) {
  return <div data-theme-root="marker-without-text">{children}</div>;
}

function List({ required }: { vm: PageVMs[PageId]; required: RequiredItem[] }) {
  return (
    <ul>
      {required.map((item, i) => (
        <li key={item.id}>
          {i === 0
            ? <><span {...requiredProps(item)} style={{ display: "inline-block", width: 8, height: 8, background: "#888" }} /> {item.text}</>
            : <span {...requiredProps(item)}>{item.text}</span>}
        </li>
      ))}
    </ul>
  );
}

const pages = Object.fromEntries(
  ["overview", "workOrder", "flowchart", "sequence", "screens", "api", "web", "stuck", "history"].map((p) => [p, List]),
) as Theme["pages"];

export const theme: Theme = { id: "marker-without-text", name: "marker without text", Root, pages };
