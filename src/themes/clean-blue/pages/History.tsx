"use client";

// ประวัติ — the chosen part's changes as an Ant Timeline, oldest first (the core's order): who, when, what (its word),
// why, and the summary. With no part chosen: the whole project's changes under "ประวัติการแก้ทั้งหมด" (REQ-103), newest first. The parts to choose from sit on the right as tiles (below on a narrow screen).
import { Empty, Tag, Timeline } from "antd";
import type { PageVMs, RequiredItem } from "@/core/theme/contract";
import { requiredId } from "@/core/theme/required";
import { historyAll, historyPick, pageLabel } from "@/core/words";
import { PageHead } from "../parts/PageHead";
import { Req } from "../parts/Req";
import { KindTile } from "../parts/Tile";
import s from "./pages.module.css";

export function History({ vm, required }: { vm: PageVMs["history"]; required: RequiredItem[] }) {
  const kindOf = new Map(vm.parts.map((p) => [p.key, p.kind]));
  const timeline = (
    <Timeline
      items={vm.entries.map((e, i) => ({
        key: i,
        content: (
          <div className={s.entry}>
            <div className={s.entryHead}>
              <strong>{e.atLabel}</strong>
              {e.by && <span>{e.by}</span>}
              {(e.whatLabel || (!vm.part && e.what)) && <Tag className={s.tagBlue}>{e.whatLabel || e.what}</Tag>}
              {e.cause && <span className={s.muted}>{e.cause}</span>}
            </div>
            <span>{e.summary}</span>
          </div>
        ),
      }))}
    />
  );
  return (
    <>
      <PageHead page="history" />
      <div className={s.historyLayout}>
        <section className={s.panel}>
          {vm.part ? (
            <>
              <div className={s.panelHead}>
                {kindOf.get(vm.part.key) && <KindTile kind={kindOf.get(vm.part.key)!} size="lg" />}
                <h3><Req required={required} id={requiredId.part(vm.part.key)}>{vm.part.title}</Req></h3>
              </div>
              {timeline}
            </>
          ) : vm.entries.length > 0 ? (
            <>
              <div className={s.panelHead}><h3>{historyAll}</h3></div>
              {timeline}
            </>
          ) : (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={<span className={s.emptyText}>{historyPick}</span>} />
          )}
        </section>
        <nav className={s.panel} aria-label={pageLabel.history} data-print="screen-only">
          <ul className={s.partList}>
            {vm.parts.map((p) => (
              <li key={p.key}>
                <a href={p.href} className={s.partLink} aria-current={vm.part?.key === p.key ? "page" : undefined}>
                  <KindTile kind={p.kind} size="sm" />{p.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </>
  );
}
