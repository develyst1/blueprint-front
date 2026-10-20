"use client";

// ลำดับงาน — the swimlane as an Ant Table (ref 2): steps are rows, participants are columns headed by their kind tile,
// a tile in the cell where the participant takes part. Each row expands to its handoffs, in order, who → whom.
// The back room's matrix (comp C, D-112, TASK-C-047): lanes grouped by kind under a group row (คน · หน้าจอ · API · ระบบ),
// the step column sticky, and — when lanes do not fit — three cues that are not the scrollbar: an edge fade, the count in
// the card head (เห็น n จาก m คอลัมน์) and อีก k คอลัมน์ →, which scrolls by one view. The step title is the row's
// expand button (≥ 44 px), in place of Ant's 16 px icon.
import { ArrowRightOutlined, RightOutlined, WarningFilled } from "@ant-design/icons";
import { Table, Tooltip, type TableColumnsType } from "antd";
import { useState } from "react";
import type { PageVMs, RequiredItem, SwimLayout } from "@/core/theme/contract";
import { requiredId } from "@/core/theme/required";
import { linkKind, matrix, pageLabel, participantKind, stepEnds } from "@/core/words";
import { Choose, PageHead } from "../parts/PageHead";
import { Req } from "../parts/Req";
import { KindTile } from "../parts/Tile";
import { useColumnCue } from "../parts/useColumnCue";
import { useEdges } from "../parts/useEdges";
import s from "./pages.module.css";

type Row = SwimLayout["rows"][number];

/** A step's title, its end mark, and — when stuck — the ⚠ and its words: never colour alone (REVIEW-A-004 row 2). */
function StepText({ row, required }: { row: Row; required: RequiredItem[] }) {
  return (
    <span className={s.stepText}>
      <Req required={required} id={requiredId.step(row.step.key)}>{row.step.title}</Req>
      {row.step.ends && <span className={s.stepEnds}>{stepEnds}</span>}
      {row.step.stuckWordings.map((t, i) => <span key={i} className={s.stuckText}><WarningFilled aria-hidden /> {t}</span>)}
    </span>
  );
}

export function WorkOrder({ vm, required }: { vm: PageVMs["workOrder"]; required: RequiredItem[] }) {
  const lanes = vm.layout.lanes;
  const title = (k: string | null) => lanes.find((l) => l.key === k)?.title ?? "—";
  const [open, setOpen] = useState<string[]>([]);
  const toggle = (key: string) => setOpen((o) => (o.includes(key) ? o.filter((k) => k !== key) : [...o, key]));
  const box = useEdges<HTMLDivElement>();
  const cue = useColumnCue(box, "thead [data-lane]", `thead th.${s.stickyCol}`);
  const laneColumn = (l: SwimLayout["lanes"][number], first: boolean) => ({
    key: l.key,
    align: "center" as const,
    width: 112,
    className: first ? s.groupStart : undefined,
    title: (
      <span className={s.laneHead} data-lane="">
        <KindTile kind={l.kind} size="sm" />
        <Req required={required} id={requiredId.lane(l.key)}>{l.title}</Req>
      </span>
    ),
    render: (_: unknown, r: Row) =>
      r.lanes.includes(l.key) ? (
        <Tooltip title={`${l.title} · ${r.step.title}`}>
          <span className={s.inLane} role="img" aria-label={`${l.title} · ${r.step.title}`}><KindTile kind={l.kind} size="sm" /></span>
        </Tooltip>
      ) : null,
  });
  // the groups are consecutive runs of the kind-ordered lanes (core, D-112): slice them in order
  let at = 0;
  const groupColumns = vm.layout.groups.map((g) => {
    const members = lanes.slice(at, (at += g.count));
    return { key: `group:${g.kind}`, title: g.label, className: s.groupHead, children: members.map((l, i) => laneColumn(l, i === 0)) };
  });
  const columns: TableColumnsType<Row> = [
    {
      key: "step",
      className: s.stickyCol, // sticky by CSS: Ant's fixed column needs scroll.x, whose overflow-y:hidden box clips the lane heads
      title: "",
      render: (_, r) => {
        const head = (
          <>
            <span className={r.step.stuck ? `${s.num} ${s.numStuck}` : s.num}>{r.step.number}</span>
            <StepText row={r} required={required} />
          </>
        );
        return r.handoffs.length > 0 ? (
          <button type="button" className={`${s.rowHead} ${s.rowToggle}`} aria-expanded={open.includes(r.step.key)} onClick={() => toggle(r.step.key)}>
            {head}
            <RightOutlined aria-hidden className={s.toggleMark} />
          </button>
        ) : (
          <span className={s.rowHead}>{head}</span>
        );
      },
    },
    ...groupColumns,
  ];
  const handoffs = (r: Row) => (
    <ol className={s.handoffs}>
      {r.handoffs.map((h) => (
        <li key={h.key} className={s.handoff}>
          <span className={s.num}>{h.order}</span>
          <strong>{title(h.from)}</strong>
          <ArrowRightOutlined role="img" aria-label={linkKind.to!.out} />
          <strong>{title(h.to)}</strong>
          <span>{h.text}</span>
        </li>
      ))}
    </ol>
  );
  // one view: the scroller's width less the sticky step column, so the next lanes land just right of it
  const nextView = () => {
    const el = box.current, step = el?.querySelector<HTMLElement>("thead th." + s.stickyCol);
    el?.scrollBy({ left: el.clientWidth - (step?.offsetWidth ?? 0), behavior: "smooth" });
  };
  return (
    <>
      <PageHead page="workOrder">
        {vm.works.length > 1 && <Choose label={pageLabel.workOrder} current={vm.work.key} items={vm.works} />}
      </PageHead>
      {/* a phone reads one card per step, its lanes named — never a sideways table (REVIEW-A-004 row 1) */}
      <ol className={`${s.stepCards} ${s.phoneOnly}`} aria-label={pageLabel.workOrder}>
        {vm.layout.rows.map((r) => (
          <li key={r.step.key} className={s.panel}>
            <span className={s.rowHead}>
              <span className={r.step.stuck ? `${s.num} ${s.numStuck}` : s.num}>{r.step.number}</span>
              <StepText row={r} required={required} />
            </span>
            <ul className={s.laneChips}>
              {lanes.filter((l) => r.lanes.includes(l.key)).map((l) => (
                <li key={l.key} className={s.laneChip}>
                  <KindTile kind={l.kind} size="sm" />
                  <Req required={required} id={requiredId.lane(l.key)}>{l.title}</Req>
                  <span className={s.laneKind}>{participantKind[l.kind]}</span>
                </li>
              ))}
            </ul>
            {r.handoffs.length > 0 && handoffs(r)}
          </li>
        ))}
      </ol>
      <section className={`${s.panel} ${s.matrix} ${s.tableOnly}`}>
        <div className={s.matrixHead}>
          <strong>{matrix.size(vm.layout.rows.length, lanes.length)}</strong>
          {cue.hidden > 0 && (
            <>
              <span className={s.muted}>{matrix.seen(cue.seen, cue.total)}</span>
              <button type="button" className={s.moreColumns} onClick={nextView} data-print="screen-only">{matrix.more(cue.hidden)}</button>
            </>
          )}
        </div>
        <div className={s.matrixFrame}>
          <div ref={box} className={s.scroll} tabIndex={0} role="region" aria-label={pageLabel.workOrder} data-print="expand">
            <Table<Row>
              rowKey={(r) => r.step.key}
              columns={columns}
              dataSource={vm.layout.rows}
              pagination={false}
              expandable={{
                showExpandColumn: false,
                expandedRowKeys: open,
                rowExpandable: (r) => r.handoffs.length > 0,
                expandedRowRender: handoffs,
              }}
            />
          </div>
          <span className={s.fadeStart} aria-hidden data-print="screen-only" />
          <span className={s.fadeEnd} aria-hidden data-print="screen-only" />
        </div>
        <p className={`${s.muted} ${s.matrixFoot}`}>{matrix.foot}</p>
      </section>
    </>
  );
}
