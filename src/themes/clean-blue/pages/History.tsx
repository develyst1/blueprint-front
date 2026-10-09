"use client";

// ประวัติ — the chosen part's changes as an Ant Timeline, oldest first (the core's order): when, what (its word),
// why, and the summary. The parts to choose from sit on the right as tiles (below on a narrow screen).
import { Empty, Tag, Timeline } from "antd";
import type { PageVMs, RequiredItem } from "@/core/theme/contract";
import { requiredId } from "@/core/theme/required";
import { historyPick, pageLabel } from "@/core/words";
import { PageHead } from "../parts/PageHead";
import { Req } from "../parts/Req";
import { KindTile } from "../parts/Tile";
import s from "./pages.module.css";

export function History({ vm, required }: { vm: PageVMs["history"]; required: RequiredItem[] }) {
  const kindOf = new Map(vm.parts.map((p) => [p.key, p.kind]));
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
              <Timeline
                items={vm.entries.map((e, i) => ({
                  key: i,
                  content: (
                    <div className={s.entry}>
                      <div className={s.entryHead}>
                        <strong>{e.atLabel}</strong>
                        {e.whatLabel && <Tag color="blue">{e.whatLabel}</Tag>}
                        <span className={s.muted}>{e.cause}</span>
                      </div>
                      <span>{e.summary}</span>
                    </div>
                  ),
                }))}
              />
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
