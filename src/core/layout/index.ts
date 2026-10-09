// The shared diagram layouts (TASK-B-006): API drawing data → positions in px, origin top-left. Every theme draws
// from these; none computes its own. Plugged into the builders through the Layouts interface.
import type { Layouts } from "@/core/model/build/types";
import { flowLayout } from "./flow";
import { sequenceLayout } from "./sequence";
import { swimLanes } from "./swim";
import { webLayout } from "./web";

export const realLayouts: Layouts = {
  flow: flowLayout,
  swimLanes,
  sequence: sequenceLayout,
  web: webLayout,
};

export { estimateLabel } from "./text";
