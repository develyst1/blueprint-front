// What each page must show (R8), from its own view model only (contract v1.1): the frame's readiness label goes to
// the shell; a page never repeats it. Every id comes from requiredId (v1.3), the helper themes use to pair them.
// TASK-B-007's check proves every theme renders each item.
import type { FrameVM, PageId, PageVMs, RequiredItem } from "@/core/theme/contract";
import { requiredId } from "@/core/theme/required";

export function shellRequired(frame: FrameVM): RequiredItem[] {
  return [{ id: requiredId.readiness, text: frame.readiness.label }];
}

const steps = (s: { key: string; title: string }[]) => s.map((x) => ({ id: requiredId.step(x.key), text: x.title }));

export function pageRequired<P extends PageId>(page: P, vm: PageVMs[P]): RequiredItem[] {
  switch (page) {
    case "overview": {
      const v = vm as PageVMs["overview"];
      return v.works.flatMap((w) => steps(w.steps));
    }
    case "workOrder": {
      const v = vm as PageVMs["workOrder"];
      return [...steps(v.work.steps), ...v.layout.lanes.map((l) => ({ id: requiredId.lane(l.key), text: l.title }))];
    }
    case "flowchart": {
      const v = vm as PageVMs["flowchart"];
      const labels = v.layouts.LR.edges.filter((e) => e.label).map((e) => ({ id: requiredId.branch(e.from, e.to), text: e.label! }));
      return [...steps(v.work.steps), ...labels];
    }
    case "sequence": {
      const v = vm as PageVMs["sequence"];
      return v.layout.messages.map((m) => ({ id: requiredId.message(m.key), text: m.text }));
    }
    case "screens": {
      const v = vm as PageVMs["screens"];
      return v.screens.map((s) => ({ id: requiredId.screen(s.key), text: s.title }));
    }
    case "api": {
      const v = vm as PageVMs["api"];
      return v.apis.map((a) => ({ id: requiredId.api(a.key), text: a.title }));
    }
    case "web": {
      const v = vm as PageVMs["web"];
      return v.layout.nodes.filter((n) => n.stuck).map((n) => ({ id: requiredId.part(n.key), text: n.title }));
    }
    case "stuck": {
      const v = vm as PageVMs["stuck"];
      return v.items.map((i) => ({ id: requiredId.stuck(i), text: i.wording }));
    }
    case "history": {
      const v = vm as PageVMs["history"];
      return v.part ? [{ id: requiredId.part(v.part.key), text: v.part.title }] : [];
    }
  }
  return [];
}
