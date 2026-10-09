"use client";

// The live preview in the new-project dialog: the worked example drawn the way this theme draws an overview —
// the journey as Ant Steps — small.
import { Steps } from "antd";
import type { PreviewVM } from "@/core/theme/contract";
import { Readiness } from "./Shell";
import s from "./pages/pages.module.css";

export function Preview({ sample }: { sample: PreviewVM }) {
  return (
    <div className={s.preview}>
      <div className={s.previewHead}>
        <h3 className={s.projectName}>{sample.project.name}</h3>
        <Readiness readiness={sample.readiness} required={[]} />
      </div>
      <Steps size="small" orientation="vertical" current={-1}
        items={sample.steps.map((st) => ({
          title: st.title,
          status: st.stuck ? "error" : "wait",
          // the same number tile as the overview — not Ant's own index, and never its ✕ for a stuck step
          icon: <span className={st.stuck ? `${s.num} ${s.numStuck}` : s.num}>{st.number}</span>,
        }))} />
    </div>
  );
}
