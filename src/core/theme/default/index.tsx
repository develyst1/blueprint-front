// The default theme: library-free, used for an unknown Project.theme and for any page a theme does not draw.
// No "use client" here: the core's server pages read this object (getTheme(id).Root …); the interactive state
// component lives in its own client file (SPEC-B-001 § "Server/client split").
import type { ReactNode } from "react";
import type { Theme } from "../contract";
import { Card } from "./Card";
import { defaultPages } from "./pages";
import { Preview } from "./Preview";
import { Shell } from "./Shell";
import { State } from "./State";
import s from "./default.module.css";

function Root({ children }: { children: ReactNode }) {
  return (
    <div data-theme-root="default" className={s.root}>
      {children}
    </div>
  );
}

export const defaultTheme: Theme = {
  id: "default",
  name: "Blueprint",
  Root,
  shell: Shell,
  card: Card,
  preview: Preview,
  pages: defaultPages,
  state: State,
};
