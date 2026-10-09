// The luxury gold theme entry (SPEC-B-001 contract v1.1). Never "use client": the core's server pages read
// theme.Root / shell / card / preview / state from this object. Interactive parts live in ./client/*.tsx.
// `pages`: the list pages (TASK-C-006) and the diagram pages (TASK-C-005) — all nine.
import type { Theme } from "@/core/theme/contract";
import { Card } from "./Card";
import { Api } from "./pages/Api";
import { Chat } from "./pages/Chat";
import { Flowchart } from "./pages/Flowchart";
import { History } from "./pages/History";
import { Sequence } from "./pages/Sequence";
import { Web } from "./pages/Web";
import { WorkOrder } from "./pages/WorkOrder";
import { Overview } from "./pages/Overview";
import { Ready } from "./pages/Ready";
import { Screens } from "./pages/Screens";
import { Stuck } from "./pages/Stuck";
import { Preview } from "./Preview";
import { Shell } from "./Shell";
import { State } from "./State";
import { ThemeRoot } from "./ThemeRoot";

export const theme: Theme = {
  id: "luxury-gold",
  name: "luxury gold",
  Root: ThemeRoot,
  shell: Shell,
  card: Card,
  preview: Preview,
  state: State,
  pages: {
    overview: Overview,
    workOrder: WorkOrder,
    flowchart: Flowchart,
    sequence: Sequence,
    screens: Screens,
    api: Api,
    web: Web,
    stuck: Stuck,
    history: History,
  },
  ready: Ready, // screen ④, `readyPage` (contract v1.10, TASK-C-012)
  chat: Chat, // screen ② (contract v1.9, TASK-C-013)
};
