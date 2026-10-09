"use client";

// API — one Ant Card per API: the method as a coloured tag beside its path, what it reads and writes as link chips,
// and the request / response bodies folded in a Collapse (long text only after a click, AC-8).
import { WarningFilled } from "@ant-design/icons";
import { Card, Collapse, Empty, Tag } from "antd";
import type { PageVMs, RequiredItem } from "@/core/theme/contract";
import { requiredId } from "@/core/theme/required";
import { apiDetail, apiGroup, emptyList, showMore } from "@/core/words";
import { PageHead } from "../parts/PageHead";
import { Req } from "../parts/Req";
import { KindTile } from "../parts/Tile";
import { Refs } from "./Refs";
import s from "./pages.module.css";

const json = (v: unknown) => JSON.stringify(v, null, 2);

export function Api({ vm, required }: { vm: PageVMs["api"]; required: RequiredItem[] }) {
  return (
    <>
      <PageHead page="api" />
      {vm.apis.length === 0 && (
        <Empty className={s.empty} image={Empty.PRESENTED_IMAGE_SIMPLE} description={<span className={s.emptyText}>{emptyList.api}</span>} />
      )}
      <div className={s.grid2}>
        {vm.apis.map((a) => {
          const bodies = [
            ...(a.request != null ? [{ key: "req", label: apiDetail.request, children: <pre className={s.code} data-print="expand">{json(a.request)}</pre> }] : []),
            ...(a.responses.length > 0
              ? [{
                  key: "res",
                  label: apiDetail.response,
                  children: (
                    <div className={s.decisionBody}>
                      {a.responses.map((r, i) => (
                        <div key={i} className={s.group}>
                          <span><Tag className={s.method}>{r.status}</Tag>{r.note}</span>
                          {r.body != null && <pre className={s.code} data-print="expand">{json(r.body)}</pre>}
                        </div>
                      ))}
                    </div>
                  ),
                }]
              : []),
          ].map((it) => ({ ...it, extra: <span className={s.more}>{showMore}</span> }));
          return (
            <Card key={a.key} id={a.key}
              title={<h3 className={s.cardTitle}><KindTile kind="api" /><Req required={required} id={requiredId.api(a.key)}>{a.title}</Req></h3>}>
              <div className={s.decisionBody}>
                <span className={s.panelHead}>
                  {a.method && <Tag className={s.method}>{a.method}</Tag>}
                  <code className={s.path}>{a.path}</code>
                </span>
                {a.stuckWordings.map((t, i) => <p key={i} className={s.stuckNote}><WarningFilled aria-hidden />{t}</p>)}
                {a.reads.length > 0 && <div className={s.group}><h4 className={s.groupTitle}>{apiGroup.reads}</h4><Refs refs={a.reads} /></div>}
                {a.writes.length > 0 && <div className={s.group}><h4 className={s.groupTitle}>{apiGroup.writes}</h4><Refs refs={a.writes} /></div>}
                {bodies.length > 0 && <Collapse ghost items={bodies} />}
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}
