"use client";

// ภาพรวม — the brief (REQ-017, comp A), top-down as an analyst hands it back: what we understood (each work's goal, with
// its source line) → ใครเกี่ยวข้อง → เส้นทางของงาน (the memorable piece: each work drawn as one journey with Ant Steps,
// stuck steps in the warm error state; the endings under it) → กติกาที่ตกลงกันแล้ว (a Collapse: the rule, cases and covers
// only after a click, AC-8) → ยังรอคำตอบจากคุณ. Beside it, a panel: the readiness and what the system needs behind it,
// each count a link into the back room.
import { Collapse, Grid, Steps } from "antd";
import type { PageVMs, RequiredItem } from "@/core/theme/contract";
import { requiredId } from "@/core/theme/required";
import { brief, decisionPart, linkKind, requirementsSection, showMore } from "@/core/words";
import { PageHead } from "../parts/PageHead";
import { Req } from "../parts/Req";
import { KindTile } from "../parts/Tile";
import { Refs } from "./Refs";
import s from "./pages.module.css";

export function Overview({ vm, required }: { vm: PageVMs["overview"]; required: RequiredItem[] }) {
  // a journey reads left to right on a wide screen; past 7 steps, or on a narrower one, it runs down the page
  const wide = Grid.useBreakpoint().xl ?? false;
  const back = new Map((vm.frame.rooms.find((r) => r.id === "back")?.pages ?? []).map((p) => [p.page, p.href]));
  const counts = [
    { kind: "screen", label: brief.rail.screens, n: vm.back.screens, href: back.get("screens") },
    { kind: "api", label: brief.rail.apis, n: vm.back.apis, href: back.get("api") },
    { kind: "system", label: brief.rail.systems, n: vm.back.systems, href: back.get("web") },
    { kind: "data", label: brief.rail.data, n: vm.back.data, href: back.get("web") },
  ] as const;
  const stuck = vm.frame.readiness.stuckCount > 0;
  return (
    <>
      <PageHead page="overview" />
      <div className={s.brief}>
        <div className={s.briefMain}>
          {vm.works.filter((w) => w.goal).map((w) => (
            <section key={w.key} className={`${s.panel} ${s.goal}`}>
              <p className={s.goalText}><Req required={required} id={requiredId.goal(w.key)}>{w.goal}</Req></p>
              <p className={s.muted}>{brief.source(vm.version)}</p>
            </section>
          ))}

          <section className={s.panel}>
            <div className={s.panelHead}><KindTile kind="role" /><h3>{brief.roles}</h3></div>
            <ul className={s.roles}>
              {vm.roles.map((r) => (
                <li key={r.key} className={s.role}>
                  <strong><Req required={required} id={requiredId.role(r.key)}>{r.title}</Req></strong>
                  {r.duty && <span className={s.muted}>{r.duty}</span>}
                </li>
              ))}
            </ul>
          </section>

          {vm.requirements.length > 0 && (
            <section className={s.panel}>
              <div className={s.panelHead}><KindTile kind="requirement" /><h3><Req required={required} id={requiredId.requirementsSection}>{requirementsSection}</Req></h3></div>
              <ul className={s.roles}>
                {vm.requirements.map((r) => (
                  <li key={r.key} className={s.role}>
                    <strong><Req required={required} id={requiredId.part(r.key)}>{r.title}</Req></strong>
                    {r.text && <span className={s.muted}>{r.text}</span>}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className={`${s.panel} ${s.journey}`}>
            <div className={s.panelHead}><KindTile kind="work" /><h3>{brief.path}</h3></div>
            {vm.works.map((w) => {
              const path = w.steps.filter((st) => !st.ends);
              const endings = w.steps.filter((st) => st.ends);
              const across = wide && path.length <= 7;
              return (
                <div key={w.key} className={s.briefPath}>
                  {vm.works.length > 1 && <h4 className={s.briefPathWork}>{w.title}</h4>}
                  <Steps
                    current={-1}
                    orientation={across ? "horizontal" : "vertical"}
                    titlePlacement={across ? "vertical" : "horizontal"}
                    items={path.map((st) => ({
                      status: st.stuck ? "error" : "wait",
                      icon: <span className={st.stuck ? `${s.num} ${s.numStuck}` : s.num}>{st.number}</span>,
                      title: (
                        <a href={st.href} className={s.stepTitle}>
                          <Req required={required} id={requiredId.step(st.key)}>{st.title}</Req>
                        </a>
                      ),
                      content: st.stuckWordings.length > 0 ? st.stuckWordings.map((t, i) => <div key={i} className={s.stuckText}>{t}</div>) : undefined,
                    }))}
                  />
                  {endings.length > 0 && (
                    <ul className={s.endings}>
                      {endings.map((st, i) => (
                        <li key={st.key}>
                          <span className={s.endingN}>{brief.ending(i + 1, "")}</span>
                          <a href={st.href} className={s.endingLink}><Req required={required} id={requiredId.step(st.key)}>{st.title}</Req></a>
                          {st.stuckWordings.map((t, j) => <span key={j} className={s.stuckText}>{t}</span>)}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </section>

          {vm.decisions.length > 0 && (
            <section className={s.briefSection}>
              <div className={s.panelHead}><KindTile kind="decision" /><h3>{brief.rules}</h3></div>
              <Collapse
                size="large"
                items={vm.decisions.map((d) => ({
                  key: d.key,
                  label: <span className={s.decisionHead}>{d.title}</span>,
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
            </section>
          )}

          <section className={s.panel}>
            <div className={s.panelHead}><KindTile kind="question" /><h3>{brief.waiting}</h3></div>
            {vm.questions.length > 0 ? (
              <ul className={s.questions}>
                {vm.questions.map((q) => <li key={q.key}><a href={q.target.href} className={s.question}>{q.title}</a></li>)}
              </ul>
            ) : (
              <p className={s.muted}>{brief.noQuestions}</p>
            )}
          </section>
        </div>

        <aside className={`${s.panel} ${s.rail}`}>
          <p className={stuck ? `${s.railReady} ${s.railReadyStuck}` : s.railReady}>{vm.frame.readiness.label}</p>
          <h3 className={s.railTitle}>{brief.rail.title}</h3>
          <ul className={s.counts}>
            {counts.map((c) => (
              <li key={c.label}>
                <a href={c.href} className={s.railRow}><KindTile kind={c.kind} size="sm" /><span>{c.label}</span><b>{c.n}</b></a>
              </li>
            ))}
            <li>
              <a href={back.get("sequence")} className={s.railRow}><KindTile kind="interaction" size="sm" /><span>{brief.rail.interactions(vm.back.interactions)}</span></a>
            </li>
            <li className={s.railRow}><KindTile kind="data" size="sm" /><span>{brief.rail.er}</span><span className={s.notYet}>{brief.rail.notYet}</span></li>
            <li className={s.railRow}><KindTile kind="system" size="sm" /><span>{brief.rail.services}</span><span className={s.notYet}>{brief.rail.notYet}</span></li>
          </ul>
        </aside>
      </div>
    </>
  );
}
