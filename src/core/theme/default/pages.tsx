// The default theme's pages — one plain, library-free component per page. Each draws its view model honestly
// (lists, tables and simple SVG from the core's layouts) and marks every required item. They are the fallback for any
// page a theme does not draw, and the reference the required-content check runs first.
import type { PageVMs, RequiredItem } from "../contract";
import { requiredId } from "../required";
import {
  apiDetail, apiGroup, decisionPart, emptyList, historyPick, linkKind, pageLabel, partKind, participantKind, proposedAnswer,
  screenGroup, showMore, stepEnds,
} from "@/core/words";
import { estimateLabel } from "@/core/layout/text";
import { Mark, markAttrs } from "./Mark";
import s from "./default.module.css";

type P<K extends keyof PageVMs> = { vm: PageVMs[K]; required: RequiredItem[] };

/** Other parts, each a link to it on the web page. */
function Refs({ refs }: { refs: { key: string; title: string; href: string }[] }) {
  return <>{refs.map((r, i) => <span key={r.key}>{i > 0 && " · "}<a href={r.href}>{r.title}</a></span>)}</>;
}

function WorkLinks({ works, current }: { works: { key: string; title: string; href: string }[]; current: string }) {
  if (works.length < 2) return null;
  return (
    <ul className={s.pills} data-print="screen-only">
      {works.map((w) => <li key={w.key}><a href={w.href} aria-current={w.key === current ? "page" : undefined}>{w.title}</a></li>)}
    </ul>
  );
}

// ---------- ภาพรวม ----------
export function Overview({ vm, required }: P<"overview">) {
  return (
    <>
      <h2>{pageLabel.overview}</h2>
      {vm.works.map((w) => (
        <section key={w.key}>
          <h3>{w.title}</h3>
          <ol className={s.list}>
            {w.steps.map((st) => (
              <li key={st.key}>
                {st.number} <a href={st.href}><Mark required={required} id={requiredId.step(st.key)}>{st.title}</Mark></a>
                {st.ends && <span className={s.muted}> · {stepEnds}</span>}
                {st.stuckWordings.map((w2, i) => <span key={i} className={s.stuckNote}> · {w2}</span>)}
              </li>
            ))}
          </ol>
        </section>
      ))}
      {vm.decisions.map((d) => (
        <details key={d.key} className={s.detail}>
          <summary>{d.title} — {showMore}</summary>
          <p><strong>{decisionPart.rule}</strong> {d.rule}</p>
          <p><strong>{decisionPart.cases}</strong></p>
          <ul className={s.list}>{d.cases.map((c, i) => <li key={i}>{c}</li>)}</ul>
          {d.open && <p><strong>{decisionPart.open}</strong> {d.open}</p>}
          {d.covers.length > 0 && <p className={s.muted}>{linkKind.covers!.out} <Refs refs={d.covers} /></p>}
        </details>
      ))}
    </>
  );
}

// ---------- ลำดับงาน ----------
export function WorkOrder({ vm, required }: P<"workOrder">) {
  const title = (k: string | null) => vm.layout.lanes.find((l) => l.key === k)?.title ?? "—";
  return (
    <>
      <h2>{pageLabel.workOrder}</h2>
      <WorkLinks works={vm.works} current={vm.work.key} />
      <div className={s.scroll} tabIndex={0} role="region" aria-label={pageLabel.workOrder} data-print="expand">
        <table className={s.table}>
          <thead>
            <tr>
              <th />
              {vm.layout.lanes.map((l) => (
                <th key={l.key} scope="col">
                  <Mark required={required} id={requiredId.lane(l.key)}>{l.title}</Mark>
                  <br /><span className={s.muted}>{participantKind[l.kind]}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {vm.layout.rows.map((r) => (
              <tr key={r.step.key}>
                <th scope="row">{r.step.number} <Mark required={required} id={requiredId.step(r.step.key)}>{r.step.title}</Mark></th>
                {vm.layout.lanes.map((l) => (
                  <td key={l.key} className={s.on}>{r.lanes.includes(l.key) ? <span title={`${l.title} · ${r.step.title}`}>●</span> : ""}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {vm.layout.rows.map((r) => (
        <section key={r.step.key}>
          <h3>{r.step.number} {r.step.title}</h3>
          <ol className={s.list}>
            {r.handoffs.map((h) => <li key={h.key}>{title(h.from)} → {title(h.to)} · {h.text}</li>)}
          </ol>
        </section>
      ))}
    </>
  );
}

// ---------- ผังการทำงาน ----------
export function Flowchart({ vm, required }: P<"flowchart">) {
  const lay = vm.layouts.LR;
  const titles = new Map(vm.work.steps.map((st) => [st.key, st]));
  return (
    <>
      <h2>{pageLabel.flowchart}</h2>
      <WorkLinks works={vm.works} current={vm.work.key} />
      <div className={s.scroll} tabIndex={0} role="region" aria-label={pageLabel.flowchart} data-print="expand">
        <svg width={lay.width} height={lay.height} viewBox={`0 0 ${lay.width} ${lay.height}`}>
          {lay.edges.map((e, i) => (
            <polyline key={i} points={e.points.map((p) => `${p.x},${p.y}`).join(" ")} fill="none" stroke="#5b6573" strokeWidth={2} />
          ))}
          {lay.nodes.map((n) => {
            const st = titles.get(n.key);
            return (
              <g key={n.key}>
                <rect x={n.x} y={n.y} width={n.w} height={n.h} rx={n.ends ? n.h / 2 : 6} fill={st?.stuck ? "#fff3e8" : "#ffffff"} stroke={st?.stuck ? "#a6460a" : "#1b1f24"} />
                <text x={n.x + n.w / 2} y={n.y + n.h / 2 + 5} textAnchor="middle" fontSize={15} fill="#1b1f24" {...markAttrs(required, requiredId.step(n.key))}>
                  {st ? `${st.number} ${st.title}` : n.key}
                </text>
              </g>
            );
          })}
          {lay.edges.filter((e) => e.labelAnchor && e.label).map((e, i) => (
            <text key={`l${i}`} x={e.labelAnchor!.x} y={e.labelAnchor!.y + 5} textAnchor="middle" fontSize={14} fill="#1b1f24"
              paintOrder="stroke" stroke="#ffffff" strokeWidth={5} {...markAttrs(required, requiredId.branch(e.from, e.to))}>
              {e.label}
            </text>
          ))}
        </svg>
      </div>
    </>
  );
}

// ---------- ลำดับการโต้ตอบ ----------
export function Sequence({ vm, required }: P<"sequence">) {
  const l = vm.layout;
  const x = (k: string | null) => l.participants.find((p) => p.key === k)?.x ?? null;
  return (
    <>
      <h2>{pageLabel.sequence}</h2>
      <ul className={s.pills} data-print="screen-only">
        {vm.steps.map((st) => <li key={st.key}><a href={st.href} aria-current={st.key === vm.step.key ? "page" : undefined}>{st.number} {st.title}</a></li>)}
      </ul>
      <h3>{vm.step.number} {vm.step.title}</h3>
      <div className={s.scroll} tabIndex={0} role="region" aria-label={pageLabel.sequence} data-print="expand">
        <svg width={l.width} height={l.height} viewBox={`0 0 ${l.width} ${l.height}`}>
          {l.participants.map((p) => (
            <g key={p.key}>
              <line x1={p.x} x2={p.x} y1={44} y2={l.height - 8} stroke="#b3bac4" />
              <text x={p.x} y={30} textAnchor="middle" fontSize={15} fill="#1b1f24">{p.title}</text>
            </g>
          ))}
          {l.messages.map((m) => {
            const a = x(m.from), b = x(m.to);
            const mid = ((a ?? b ?? 0) + (b ?? a ?? 0)) / 2;
            return (
              <g key={m.key}>
                {a !== null && b !== null && <line x1={a} x2={b} y1={m.y} y2={m.y} stroke="#1b1f24" strokeWidth={2} />}
                <text x={mid} y={m.y - 8} textAnchor="middle" fontSize={14} fill="#1b1f24" paintOrder="stroke" stroke="#ffffff" strokeWidth={4}
                  {...markAttrs(required, requiredId.message(m.key))}>
                  {m.order}. {m.text}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </>
  );
}

// ---------- หน้าจอ ----------
export function Screens({ vm, required }: P<"screens">) {
  return (
    <>
      <h2>{pageLabel.screens}</h2>
      {vm.screens.length === 0 && <p className={s.muted}>{emptyList.screens}</p>}
      {vm.screens.map((sc) => (
        <section key={sc.key} id={sc.key} className={s.detail}>
          <h3><Mark required={required} id={requiredId.screen(sc.key)}>{sc.title}</Mark></h3>
          {sc.stuckWordings.map((w, i) => <p key={i} className={s.stuckNote}>{w}</p>)}
          {sc.fields.length > 0 && <><h4>{screenGroup.fields}</h4><ul className={s.list}>{sc.fields.map((f) => <li key={f.name}>{f.label ?? f.name}{f.type ? ` · ${f.type}` : ""}</li>)}</ul></>}
          {sc.actions.length > 0 && <><h4>{screenGroup.actions}</h4><ul className={s.list}>{sc.actions.map((a) => <li key={a.name}>{a.label ?? a.name}</li>)}</ul></>}
          {sc.states.length > 0 && <><h4>{screenGroup.states}</h4><ul className={s.list}>{sc.states.map((st) => <li key={st.name}>{st.name}{st.note ? ` · ${st.note}` : ""}</li>)}</ul></>}
          {sc.shows.length > 0 && <p className={s.muted}>{linkKind.shows!.out} <Refs refs={sc.shows} /></p>}
        </section>
      ))}
    </>
  );
}

// ---------- API ----------
export function Api({ vm, required }: P<"api">) {
  return (
    <>
      <h2>{pageLabel.api}</h2>
      {vm.apis.length === 0 && <p className={s.muted}>{emptyList.api}</p>}
      {vm.apis.map((a) => (
        <section key={a.key} id={a.key} className={s.detail}>
          <h3><Mark required={required} id={requiredId.api(a.key)}>{a.title}</Mark></h3>
          <p><code>{a.method} {a.path}</code></p>
          {a.stuckWordings.map((w, i) => <p key={i} className={s.stuckNote}>{w}</p>)}
          {a.reads.length > 0 && <><h4>{apiGroup.reads}</h4><p><Refs refs={a.reads} /></p></>}
          {a.writes.length > 0 && <><h4>{apiGroup.writes}</h4><p><Refs refs={a.writes} /></p></>}
          {a.request != null && <><h4>{apiDetail.request}</h4><pre className={s.scroll} data-print="expand">{JSON.stringify(a.request, null, 2)}</pre></>}
          {a.responses.length > 0 && <><h4>{apiDetail.response}</h4><ul className={s.list}>{a.responses.map((r, i) => <li key={i}>{r.status}{r.note ? ` · ${r.note}` : ""}{r.body != null && <pre className={s.scroll} data-print="expand">{JSON.stringify(r.body, null, 2)}</pre>}</li>)}</ul></>}
        </section>
      ))}
    </>
  );
}

// ---------- ใยโหนด ----------
// Each node a white tile on the canvas with its kind's mark (a shape, named in the legend by the core's kind words);
// the chosen node filled blue and its edges drawn blue; a stuck node amber with ⚠ (TASK-B-024). Tiles are 44 px tall
// (the target floor) and sized for 14 px text (TASK-B-025).
const WEB_PX = 14;
const MARK = 10, MARK_GAP = 6, PAD_X = 10, TILE_H = 44; // the large web's closest tiles clear each other at these
const markOf = (k: string) => (k === "work" || k === "step" || k === "interaction" ? k : ["role", "screen", "api", "system"].includes(k) ? "actor" : "other");
function KindMark({ kind, x, y, fill }: { kind: string; x: number; y: number; fill: string }) {
  const h = MARK / 2, m = markOf(kind);
  if (m === "step") return <circle cx={x} cy={y} r={h} fill={fill} />;
  if (m === "interaction") return <path d={`M${x} ${y - h - 1}L${x + h + 1} ${y}L${x} ${y + h + 1}L${x - h - 1} ${y}Z`} fill={fill} />;
  if (m === "actor") return <rect x={x - h + 1} y={y - h + 1} width={MARK - 2} height={MARK - 2} fill="none" stroke={fill} strokeWidth={2} />;
  if (m === "other") return <circle cx={x} cy={y} r={h - 1} fill="none" stroke={fill} strokeWidth={2} />;
  return <rect x={x - h} y={y - h} width={MARK} height={MARK} rx={2} fill={fill} />;
}

export function Web({ vm, required }: P<"web">) {
  const l = vm.layout;
  const at = new Map(l.nodes.map((n) => [n.key, n]));
  const sel = vm.selected?.key;
  const lit = (e: { from: string; to: string }) => !!sel && (e.from === sel || e.to === sel);
  // the box opens on the chosen node, or on the work at the web's centre — full size, never shrunk (REVIEW-A-004 row 10)
  const focus = (sel && at.get(sel)) || l.nodes.find((n) => n.kind === "work") || l.nodes[0];
  const kinds = [...new Set(l.nodes.map((n) => n.kind))];
  return (
    <>
      <h2>{pageLabel.web}</h2>
      <ul className={s.webLegend} aria-hidden>
        {kinds.map((k) => (
          <li key={k}><svg width={14} height={14}><KindMark kind={k} x={7} y={7} fill="#5b6573" /></svg>{partKind[k] ?? k}</li>
        ))}
      </ul>
      <div className={`${s.scroll} ${s.web}`} tabIndex={0} role="region" aria-label={pageLabel.web} style={{ maxHeight: "70vh" }} data-print="expand">
        <div className={s.webCanvas} style={{ width: l.width, height: l.height }}>
          <svg width={l.width} height={l.height} viewBox={`0 0 ${l.width} ${l.height}`}>
            {[...l.edges].sort((a, b) => Number(lit(a)) - Number(lit(b))).map((e) => {
              const a = at.get(e.from), b = at.get(e.to);
              return a && b ? <line key={e.id} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={lit(e) ? "#1458c4" : "#aeb6c1"} strokeWidth={lit(e) ? 2.5 : 1.25} /> : null;
            })}
            {l.nodes.map((n) => {
              const current = sel === n.key;
              const w = estimateLabel(`${n.stuck ? "⚠ " : ""}${n.title}`, WEB_PX).w + 2 * PAD_X + MARK + MARK_GAP;
              const x0 = n.x - w / 2;
              return (
                <a key={n.key} href={n.href} className={s.webNode} aria-current={current ? "true" : undefined}>
                  <rect x={x0} y={n.y - TILE_H / 2} width={w} height={TILE_H} rx={10}
                    fill={current ? "#1458c4" : n.stuck ? "#fdf1e7" : "#ffffff"}
                    stroke={current ? "#1458c4" : n.stuck ? "#e8c3a5" : "#d5dae1"} />
                  <KindMark kind={n.kind} x={x0 + PAD_X + MARK / 2} y={n.y} fill={current ? "#ffffff" : n.stuck ? "#a6460a" : "#5b6573"} />
                  {/* 14 px is the desk's text floor (TASK-B-024); a stuck node carries ⚠ so colour is never its only sign */}
                  <text x={x0 + PAD_X + MARK + MARK_GAP} y={n.y + 5} fontSize={WEB_PX} fontWeight={current ? 700 : 500}
                    fill={current ? "#ffffff" : n.stuck ? "#a6460a" : "#1b1f24"} {...markAttrs(required, requiredId.part(n.key))}>
                    {n.stuck ? "⚠ " : null}{n.title}
                  </text>
                </a>
              );
            })}
          </svg>
          {focus && <span className={s.webFocus} style={{ left: focus.x, top: focus.y }} aria-hidden />}
        </div>
      </div>
      {vm.selected && (
        <section className={s.detail}>
          <h3>{vm.selected.title}</h3>
          <p className={s.muted}>{partKind[vm.selected.kind] ?? vm.selected.kind} · {vm.selected.cameFrom} · {vm.selected.stampLabel} · {vm.selected.dateLabel}</p>
          <ul className={s.list}>
            {vm.selected.links.map((x, i) => <li key={i}>{x.label && <>{x.label} </>}<a href={x.href}>{x.title}</a></li>)}
          </ul>
        </section>
      )}
    </>
  );
}

// ---------- ติดอยู่ตรงไหน ----------
export function Stuck({ vm, required }: P<"stuck">) {
  return (
    <>
      <h2>{pageLabel.stuck}</h2>
      <ul className={s.list}>
        {vm.items.map((i) => (
          <li key={`${i.key}:${i.reason ?? i.kind}`}>
            <strong><Mark required={required} id={requiredId.stuck(i)}>{i.wording}</Mark></strong>
            {" · "}<a href={i.target.href}>{i.target.title}</a>
            {i.title !== i.target.title && <span className={s.muted}> · {i.title}</span>}
            {i.proposedAnswer && <p className={s.muted}>{proposedAnswer} · {i.proposedAnswer}</p>}
          </li>
        ))}
      </ul>
    </>
  );
}

// ---------- ประวัติ ----------
export function History({ vm, required }: P<"history">) {
  return (
    <>
      <h2>{pageLabel.history}</h2>
      {!vm.part && <p className={s.muted}>{historyPick}</p>}
      {vm.part && (
        <section className={s.detail}>
          <h3><Mark required={required} id={requiredId.part(vm.part.key)}>{vm.part.title}</Mark></h3>
          <table className={s.table}>
            <tbody>
              {vm.entries.map((e, i) => (
                <tr key={i}><td>{e.atLabel}</td><td>{e.cause}</td><td>{e.whatLabel}</td><td>{e.summary}</td></tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
      <ul className={s.pills} data-print="screen-only">
        {vm.parts.map((p) => <li key={p.key}><a href={p.href} aria-current={vm.part?.key === p.key ? "page" : undefined}>{p.title}</a></li>)}
      </ul>
    </>
  );
}

export const defaultPages = {
  overview: Overview, workOrder: WorkOrder, flowchart: Flowchart, sequence: Sequence, screens: Screens, api: Api,
  web: Web, stuck: Stuck, history: History,
};
