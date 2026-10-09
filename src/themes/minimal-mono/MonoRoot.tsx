"use client";

// The minimal mono theme root: every Mantine variable and style lives on this element, none on html/body
// (recipe: SPEC-B-001 § Round 2 "How a theme scopes its library", proven by TASK-B-002).
// Only the component sheets the theme uses are imported, in Mantine's dependency order — never Mantine's
// whole-app sheet, its global classes, its page reset or its default variables (all of them target :root).
import "@mantine/core/styles/UnstyledButton.css";
import "@mantine/core/styles/VisuallyHidden.css";
import "@mantine/core/styles/Paper.css";
import "@mantine/core/styles/Card.css";
import "@mantine/core/styles/SimpleGrid.css";
import "@mantine/core/styles/Stack.css";
import "@mantine/core/styles/Group.css";
import "@mantine/core/styles/Text.css";
import { MantineProvider } from "@mantine/core";
import { useCallback, useRef, type ReactNode } from "react";
import { monoFont } from "./font";
import { monoTheme } from "./theme";
import s from "./mono.module.css";

export const MONO_ID = "minimal-mono";
const ROOT = `[data-theme-root="${MONO_ID}"]`;

export function MonoRoot({ children }: { children: ReactNode }) {
  // Several mono roots can share a page (project cards on the home), so the provider is pointed at its
  // own element, not at the first match in the document.
  const root = useRef<HTMLDivElement>(null);
  const getRootElement = useCallback(() => root.current ?? undefined, []);

  return (
    <div
      ref={root}
      data-theme-root={MONO_ID}
      data-mantine-color-scheme="light"
      className={`${monoFont.className} ${s.root}`}
    >
      <MantineProvider
        theme={monoTheme}
        cssVariablesSelector={ROOT}
        deduplicateCssVariables={false}
        withGlobalClasses={false}
        forceColorScheme="light"
        getRootElement={getRootElement}
      >
        {children}
      </MantineProvider>
    </div>
  );
}
