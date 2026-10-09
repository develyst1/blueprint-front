// The print view (SPEC-A-007 § E1, TASK-A-045): the page Chrome prints to PDF (TASK-A-046) — and readable in a browser
// for checking. No theme: one neutral look (R5). A cover, then every page in PAGES order, each on a new sheet, drawn by
// the core's own default pages (their headings, tables and SVG diagrams) inside this print layout. Choosers (step and
// part pills) and scroll boxes are screen things: hidden / opened by the print CSS. Details are opened by PrintOpen.
import { notFound } from "next/navigation";
import type { FC } from "react";
import { pageRequired } from "@/core/model/build/required";
import { defaultPages } from "@/core/theme/default/pages";
import type { PageId, PageVMs, RequiredItem } from "@/core/theme/contract";
import { apiDown, emptyProject } from "@/core/words";
import { loadPrint, type Cover } from "./load";
import { ExportButton } from "./ExportButton";
import { PrintOpen } from "./PrintOpen";
import { coverLabels, notConfirmed, stuckHeading } from "./words";
import s from "./print.module.css";

function CoverSheet({ cover }: { cover: Cover }) {
  return (
    <section className={s.cover}>
      <dl className={s.coverList}>
        <dt>{coverLabels.project}</dt>
        <dd className={s.projectName}>{cover.name}</dd>
        <dt>{coverLabels.version}</dt>
        <dd>{cover.version === null ? notConfirmed : cover.version}</dd>
        <dt>{coverLabels.exportDate}</dt>
        <dd>{cover.exportDate}</dd>
        <dt>{coverLabels.readiness}</dt>
        <dd>{cover.readiness}</dd>
      </dl>
      {cover.stuck.length ? (
        <section className={s.stuck}>
          <h2>{stuckHeading(cover.stuck.length)}</h2>
          <ol>
            {cover.stuck.map((w, i) => <li key={i}>{w}</li>)}
          </ol>
        </section>
      ) : null}
    </section>
  );
}

export async function PrintView({ projectId }: { projectId: string }) {
  const res = await loadPrint(projectId);
  if (res.kind === "notFound") notFound();
  if (res.kind === "unreachable") {
    return (
      <div className={s.print}>
        <p>{apiDown}</p>
      </div>
    );
  }
  return (
    <div className={s.print} data-print-root="">
      <PrintOpen />
      {/* screen only (A-046 Q1): the same export from the page that is printed — hidden on paper */}
      <div className={s.bar}>
        <ExportButton href={`/p/${projectId}/export/pdf`} />
      </div>
      <CoverSheet cover={res.cover} />
      {res.kind === "empty" ? (
        <p className={s.empty}>{emptyProject}</p>
      ) : (
        res.sections.map((sec) => {
          const Page = defaultPages[sec.page] as FC<{ vm: PageVMs[PageId]; required: RequiredItem[] }>;
          return (
            <section key={sec.key} className={s.sheet} data-page={sec.page}>
              <Page vm={sec.vm} required={pageRequired(sec.page, sec.vm as never)} />
            </section>
          );
        })
      )}
    </div>
  );
}
