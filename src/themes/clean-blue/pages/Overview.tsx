"use client";

// ภาพรวม — the memorable piece: each work drawn as one journey (Ant Steps), stuck steps in the warm error state, end
// steps marked จบงาน. Decisions sit below as a Collapse: the rule, cases and covers only after a click (AC-8).
import { Collapse, Grid, Steps } from "antd";
import type { PageVMs, RequiredItem } from "@/core/theme/contract";
import { requiredId } from "@/core/theme/required";
import { decisionPart, linkKind, showMore, stepEnds } from "@/core/words";
import { PageHead } from "../parts/PageHead";
import { Req } from "../parts/Req";
import { KindTile } from "../parts/Tile";
import { Refs } from "./Refs";
import s from "./pages.module.css";

export function Overview({ vm, required }: { vm: PageVMs["overview"]; required: RequiredItem[] }) {
  // a journey reads left to right on a wide screen; past 7 steps, or on a narrower one, it runs down the page
  const wide = Grid.useBreakpoint().xl ?? false;
  return (
    <>
      <PageHead page="overview" />
      {vm.works.map((w) => (
        <section key={w.key} className={`${s.panel} ${s.journey}`}>
          <div className={s.panelHead}>
            <KindTile kind="work" />
            <h3>{w.title}</h3>
          </div>
          <Steps
            current={-1}
            orientation={wide && w.steps.length <= 7 ? "horizontal" : "vertical"}
            titlePlacement={wide && w.steps.length <= 7 ? "vertical" : "horizontal"}
            items={w.steps.map((st) => ({
              status: st.stuck ? "error" : "wait",
              icon: <span className={st.stuck ? `${s.num} ${s.numStuck}` : s.num}>{st.number}</span>,
              title: (
                <a href={st.href} className={s.stepTitle}>
                  <Req required={required} id={requiredId.step(st.key)}>{st.title}</Req>
                </a>
              ),
              content: (
                <>
                  {st.ends && <span className={s.stepEnds}>{stepEnds}</span>}
                  {st.stuckWordings.map((t, i) => <div key={i} className={s.stuckText}>{t}</div>)}
                </>
              ),
            }))}
          />
        </section>
      ))}
      {vm.decisions.length > 0 && (
        <Collapse
          size="large"
          items={vm.decisions.map((d) => ({
            key: d.key,
            label: <span className={s.decisionHead}><KindTile kind="decision" size="sm" />{d.title}</span>,
            extra: <span className={s.more}>{showMore}</span>,
            children: (
              <dl className={s.decisionBody}>
                <div><dt>{decisionPart.rule}</dt><dd>{d.rule}</dd></div>
                {d.cases.length > 0 && <div><dt>{decisionPart.cases}</dt><dd><ul>{d.cases.map((c, i) => <li key={i}>{c}</li>)}</ul></dd></div>}
                {d.open && <div><dt>{decisionPart.open}</dt><dd>{d.open}</dd></div>}
                {d.covers.length > 0 && <div><dt>{linkKind.covers!.out}</dt><dd><Refs refs={d.covers} /></dd></div>}
              </dl>
            ),
          }))}
        />
      )}
    </>
  );
}
