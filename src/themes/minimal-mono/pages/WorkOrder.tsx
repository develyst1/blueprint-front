"use client";

// ลำดับงาน in minimal mono (TASK-A-019): steps down, participants across, grouped under คน · หน้าจอ · API · ระบบ.
// A shape marks who takes part (outline; solid on the stuck step's row). Each row's handoffs — who hands to whom,
// in order — are numbered arcs between that row's marks; their words open behind the row's ดูรายละเอียด.
// A client file: the arcs are placed from the measured columns, and each row's details open and close.
import "@mantine/core/styles/UnstyledButton.css";
import "@mantine/core/styles/Button.css";
import "@mantine/core/styles/Table.css";
import "@mantine/core/styles/Stack.css";
import "@mantine/core/styles/Group.css";
import "@mantine/core/styles/Text.css";
import "@mantine/core/styles/Title.css";
import { Button, Group, Stack, Table, TableTbody, TableTd, TableTh, TableThead, TableTr, Text, Title } from "@mantine/core";
import { IconChevronDown } from "@tabler/icons-react";
import { Fragment, useCallback, useLayoutEffect, useRef, useState } from "react";
import type { RequiredItem, SwimLayout, WorkOrderVM } from "@/core/theme/contract";
import { requiredId } from "@/core/theme/required";
import { pageLabel, participantKind, showMore } from "@/core/words";
import { KIND_ORDER, KindMark } from "../parts/KindMark";
import { RequiredPicker } from "../parts/Required";
import { StuckIcon } from "../parts/StuckIcon";
import s from "./workorder.module.css";

type Lane = SwimLayout["lanes"][number];
type Arc = { key: string; order: number; x1: number | null; x2: number | null; y: number; level: number };

const ARC_BASE = 14, ARC_STEP = 10, MARK = 14;

export function WorkOrder({ vm, required }: { vm: WorkOrderVM; required: RequiredItem[] }) {
  const lanes: Lane[] = KIND_ORDER.flatMap((k) => vm.layout.lanes.filter((l) => l.kind === k).sort((a, b) => a.index - b.index));
  const laneByKey = new Map(lanes.map((l) => [l.key, l]));
  const groups = KIND_ORDER.map((k) => ({ kind: k, span: lanes.filter((l) => l.kind === k).length })).filter((g) => g.span > 0);
  const picker = new RequiredPicker(required);

  const [open, setOpen] = useState<Set<string>>(new Set());
  const toggle = (key: string) => setOpen((prev) => {
    const next = new Set(prev);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    return next;
  });

  // ---- handoff arcs, placed from the measured lane columns and rows ----
  const wrap = useRef<HTMLDivElement>(null);
  const [arcs, setArcs] = useState<{ w: number; h: number; list: Arc[] }>({ w: 0, h: 0, list: [] });
  const measure = useCallback(() => {
    const root = wrap.current;
    if (!root) return;
    const base = root.getBoundingClientRect();
    const colX = new Map<string, number>();
    root.querySelectorAll<HTMLElement>("[data-lane]").forEach((th) => {
      const r = th.getBoundingClientRect();
      colX.set(th.dataset.lane!, r.left - base.left + r.width / 2 + root.scrollLeft);
    });
    const list: Arc[] = [];
    root.querySelectorAll<HTMLElement>("[data-row]").forEach((tr) => {
      const row = vm.layout.rows.find((r) => r.step.key === tr.dataset.row);
      if (!row) return;
      const r = tr.getBoundingClientRect();
      const y = r.top - base.top + r.height - 31 + root.scrollTop; // 2 px above the marks' top edge (.markCell: 15 px pad + 14 px mark)
      [...row.handoffs].sort((a, b) => a.order - b.order).forEach((h, i) => {
        list.push({ key: h.key, order: h.order, x1: h.from ? colX.get(h.from) ?? null : null, x2: h.to ? colX.get(h.to) ?? null : null, y, level: i });
      });
    });
    setArcs({ w: root.scrollWidth, h: root.scrollHeight, list });
  }, [vm.layout.rows]);

  useLayoutEffect(() => {
    measure();
    const ro = new ResizeObserver(measure);
    if (wrap.current) ro.observe(wrap.current.querySelector("table") ?? wrap.current);
    return () => ro.disconnect();
  }, [measure, open]);

  const arcPath = (a: Arc) => {
    // a missing end sits 36 px beside the known one, drawn as an empty dashed ring
    const x1 = a.x1 ?? (a.x2 ?? 0) - 36, x2 = a.x2 ?? (a.x1 ?? 0) + 36;
    const top = a.y - ARC_BASE - a.level * ARC_STEP;
    // the number sits a third of the way from the sender, so two arcs between the same pair (there and back)
    // never put their numbers on the same spot
    const t = 0.32, u = 1 - t;
    const bx = u * u * u * x1 + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x2;
    const by = u * u * u * a.y + 3 * u * u * t * top + 3 * u * t * t * top + t * t * t * (a.y - 3);
    // leave 2 px above the sender's mark, arrive 8 px above the receiver's, so no tip ever covers a shape
    return { d: `M${x1} ${a.y - 2} C${x1} ${top} ${x2} ${top} ${x2} ${a.y - 8}`, mid: { x: bx, y: by }, x1, x2 };
  };

  return (
    <Stack gap="lg">
      <Title order={2} className={s.heading}>
        {vm.work.title}
      </Title>

      <Group gap="lg" className={s.legend}>
        {KIND_ORDER.map((k) => (
          <Group key={k} gap={8} wrap="nowrap">
            <KindMark kind={k} />
            <Text component="span" fz="sm" fw={500}>
              {participantKind[k]}
            </Text>
          </Group>
        ))}
      </Group>

      {/* One scroll box holds both the table and the arc layer, so the arcs scroll with their rows. (Not
          Table.ScrollContainer: the arcs would sit outside its scroller.) */}
      <div ref={wrap} className={s.wrap} tabIndex={0} role="region" aria-label={pageLabel.workOrder}>
          <Table className={s.table} verticalSpacing={0} horizontalSpacing={0}>
            <TableThead>
              <TableTr>
                <TableTh className={`${s.stepHead} ${s.sticky}`} rowSpan={2} />
                {groups.map((g) => (
                  <TableTh key={g.kind} colSpan={g.span} scope="colgroup" className={s.groupHead}>
                    {participantKind[g.kind]}
                  </TableTh>
                ))}
              </TableTr>
              <TableTr>
                {lanes.map((l, i) => (
                  <TableTh key={l.key} scope="col" data-lane={l.key} className={`${s.laneHead} ${i === 0 || lanes[i - 1].kind !== l.kind ? s.groupStart : ""}`}>
                    <Stack gap={6} align="center">
                      <KindMark kind={l.kind} />
                      <span className={s.laneTitle} {...picker.takeId(requiredId.lane(l.key))}>{l.title}</span>
                    </Stack>
                  </TableTh>
                ))}
              </TableTr>
            </TableThead>
            <TableTbody>
              {vm.layout.rows.map((row) => {
                const st = row.step;
                const isOpen = open.has(st.key);
                const detailsId = `handoffs-${st.key}`;
                const ordered = [...row.handoffs].sort((a, b) => a.order - b.order);
                return (
                  <Fragment key={st.key}>
                    <TableTr data-row={st.key} className={st.stuck ? s.rowStuck : undefined}>
                      <TableTh scope="row" className={`${s.stepCell} ${s.sticky}`}>
                        <Stack gap={6} align="flex-start">
                          <Group gap={8} wrap="nowrap" align="flex-start">
                            <span className={s.stepNumber}>{st.number}</span>
                            <span className={s.stepTitle} {...picker.takeId(requiredId.step(st.key))}>{st.title}</span>
                            {st.stuck ? <StuckIcon size={18} /> : null}
                          </Group>
                          {ordered.length ? (
                            <Button
                              variant="default"
                              size="compact-sm"
                              h={44}
                              radius="md"
                              className={s.moreButton}
                              rightSection={<IconChevronDown size={16} aria-hidden="true" className={isOpen ? s.chevronOpen : undefined} />}
                              aria-expanded={isOpen}
                              aria-controls={detailsId}
                              onClick={() => toggle(st.key)}
                            >
                              {showMore}
                            </Button>
                          ) : null}
                        </Stack>
                      </TableTh>
                      {lanes.map((l, i) => (
                        <TableTd key={l.key} className={`${s.markCell} ${i === 0 || lanes[i - 1].kind !== l.kind ? s.groupStart : ""}`}>
                          {row.lanes.includes(l.key) ? (
                            <span className={s.mark} title={`${participantKind[l.kind]} ${l.title}`}>
                              <KindMark kind={l.kind} solid={st.stuck} size={MARK} />
                            </span>
                          ) : null}
                        </TableTd>
                      ))}
                    </TableTr>
                    {isOpen ? (
                      <TableTr id={detailsId} className={s.detailsRow}>
                        <TableTd colSpan={lanes.length + 1} className={s.detailsCell}>
                          <ol className={s.handoffList}>
                            {ordered.map((h) => (
                              <li key={h.key}>
                                <span className={s.handoffOrder}>{h.order}</span>
                                <span className={s.handoffWho}>
                                  {(h.from && laneByKey.get(h.from)?.title) ?? "—"} → {(h.to && laneByKey.get(h.to)?.title) ?? "—"}
                                </span>
                                <span>{h.text}</span>
                              </li>
                            ))}
                          </ol>
                        </TableTd>
                      </TableTr>
                    ) : null}
                  </Fragment>
                );
              })}
            </TableTbody>
          </Table>

        <svg className={s.arcs} width={arcs.w} height={arcs.h} aria-hidden="true" focusable="false">
          <defs>
            <marker id="mono-handoff-tip" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0 1 L9 5 L0 9 Z" fill="#000000" />
            </marker>
          </defs>
          {arcs.list.map((a) => {
            const p = arcPath(a);
            return (
              <g key={a.key}>
                {a.x1 === null ? <circle cx={p.x1} cy={a.y + 7} r={6} className={s.missingEnd} /> : null}
                {a.x2 === null ? <circle cx={p.x2} cy={a.y + 7} r={6} className={s.missingEnd} /> : null}
                <path d={p.d} className={s.arc} markerEnd="url(#mono-handoff-tip)" />
                <circle cx={p.mid.x} cy={p.mid.y} r={10} className={s.badge} />
                <text x={p.mid.x} y={p.mid.y} textAnchor="middle" dominantBaseline="central" className={s.badgeText}>
                  {a.order}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </Stack>
  );
}
