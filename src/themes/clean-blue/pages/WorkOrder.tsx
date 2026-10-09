"use client";

// ลำดับงาน — the swimlane as an Ant Table (ref 2): steps are rows, participants are columns headed by their kind tile,
// a tile in the cell where the participant takes part. Each row expands to its handoffs, in order, who → whom.
import { ArrowRightOutlined, WarningFilled } from "@ant-design/icons";
import { Table, Tooltip, type TableColumnsType } from "antd";
import type { PageVMs, RequiredItem, SwimLayout } from "@/core/theme/contract";
import { requiredId } from "@/core/theme/required";
import { linkKind, pageLabel, participantKind, stepEnds } from "@/core/words";
import { Choose, PageHead } from "../parts/PageHead";
import { Req } from "../parts/Req";
import { KindTile } from "../parts/Tile";
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
  const columns: TableColumnsType<Row> = [
    {
      key: "step",
      className: s.stickyCol, // sticky by CSS: Ant's fixed column needs scroll.x, whose overflow-y:hidden box clips the lane heads
      title: "",
      render: (_, r) => (
        <span className={s.rowHead}>
          <span className={r.step.stuck ? `${s.num} ${s.numStuck}` : s.num}>{r.step.number}</span>
          <StepText row={r} required={required} />
        </span>
      ),
    },
    ...lanes.map((l) => ({
      key: l.key,
      align: "center" as const,
      title: (
        <span className={s.laneHead}>
          <KindTile kind={l.kind} size="sm" />
          <Req required={required} id={requiredId.lane(l.key)}>{l.title}</Req>
          <span className={s.laneKind}>{participantKind[l.kind]}</span>
        </span>
      ),
      render: (_: unknown, r: Row) =>
        r.lanes.includes(l.key) ? (
          <Tooltip title={`${l.title} · ${r.step.title}`}>
            <span className={s.inLane} role="img" aria-label={`${l.title} · ${r.step.title}`}><KindTile kind={l.kind} size="sm" /></span>
          </Tooltip>
        ) : null,
    })),
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
      <div className={`${s.panel} ${s.tableOnly}`}>
        <div className={s.scroll} tabIndex={0} role="region" aria-label={pageLabel.workOrder} data-print="expand">
        <Table<Row>
          rowKey={(r) => r.step.key}
          columns={columns}
          dataSource={vm.layout.rows}
          pagination={false}
          expandable={{
            rowExpandable: (r) => r.handoffs.length > 0,
            expandRowByClick: true,
            expandedRowRender: handoffs,
          }}
        />
        </div>
      </div>
    </>
  );
}
