// minimal mono — the theme entry (SPEC-B-001 core contract v1). No "use client" here: the core's server pages
// read this object; every interactive piece is in its own client file (MonoRoot, state/State).
import type { Theme } from "@/core/theme/contract";
import { MonoRoot } from "./MonoRoot";
import { Shell } from "./shell/Shell";
import { Card } from "./card/Card";
import { Preview } from "./preview/Preview";
import { State } from "./state/State";
import { Overview } from "./pages/Overview";
import { Stuck } from "./pages/Stuck";
import { Flowchart } from "./pages/Flowchart";
import { WorkOrder } from "./pages/WorkOrder";
import { Sequence } from "./pages/Sequence";
import { Web } from "./pages/Web";
import { Screens } from "./pages/Screens";
import { Api } from "./pages/Api";
import { History } from "./pages/History";
import { MonoChat } from "./chat/MonoChat";
import { MonoReady } from "./ready/MonoReady";

export const theme: Theme = {
  id: "minimal-mono",
  name: "minimal mono",
  Root: MonoRoot,
  shell: Shell,
  card: Card,
  preview: Preview,
  state: State,
  chat: MonoChat, // v1.9 — แชต (TASK-A-040)
  ready: MonoReady, // v1.10 — พร้อมสร้างหรือยัง (TASK-A-044)
  pages: { overview: Overview, stuck: Stuck, flowchart: Flowchart, workOrder: WorkOrder, sequence: Sequence, web: Web, screens: Screens, api: Api, history: History },
};
