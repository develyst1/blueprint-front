// A deliberately broken theme (test code only — never registered): it leaves the first required item of every page
// out. The required-content check must fail on it (AC-13).
import type { ReactNode } from "react";
import type { PageId, PageVMs, RequiredItem, Theme } from "@/core/theme/contract";
import { requiredProps } from "@/core/theme/required";

function Root({ children }: { children: ReactNode }) {
  return <div data-theme-root="omitted">{children}</div>;
}

function List({ required }: { vm: PageVMs[PageId]; required: RequiredItem[] }) {
  return <ul>{required.slice(1).map((item) => <li key={item.id}><span {...requiredProps(item)}>{item.text}</span></li>)}</ul>;
}

const pages = Object.fromEntries(
  ["overview", "workOrder", "flowchart", "sequence", "screens", "api", "web", "stuck", "history"].map((p) => [p, List]),
) as Theme["pages"];

export const theme: Theme = { id: "omitted", name: "omitted", Root, pages };
