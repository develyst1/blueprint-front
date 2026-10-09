// clean-blue — Team B's theme on Ant Design (TASK-B-008). Never "use client": the core's server pages read this
// object; every piece it names is its own client file. Chat and ready fall back to the core's until TASK-B-013.
import type { Theme } from "@/core/theme/contract";
import { Root } from "./Root";
import { Shell } from "./Shell";
import { Card } from "./Card";
import { Preview } from "./Preview";
import { State } from "./State";
import { Overview } from "./pages/Overview";
import { WorkOrder } from "./pages/WorkOrder";
import { Flowchart } from "./pages/Flowchart";
import { Sequence } from "./pages/Sequence";
import { Screens } from "./pages/Screens";
import { Api } from "./pages/Api";
import { Web } from "./pages/Web";
import { Stuck } from "./pages/Stuck";
import { History } from "./pages/History";

export const theme: Theme = {
  id: "clean-blue",
  name: "clean blue",
  Root,
  shell: Shell,
  card: Card,
  preview: Preview,
  state: State,
  pages: { overview: Overview, workOrder: WorkOrder, flowchart: Flowchart, sequence: Sequence, screens: Screens, api: Api, web: Web, stuck: Stuck, history: History },
};
