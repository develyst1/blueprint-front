"use client";

// หน้าจอ — one Ant Card per screen in a two-column grid: its fields, buttons and states as tag groups under the
// core's group words, what it shows as link chips; a stuck screen says why, in amber.
import { WarningFilled } from "@ant-design/icons";
import { Card, Empty, Tag } from "antd";
import type { PageVMs, RequiredItem } from "@/core/theme/contract";
import { requiredId } from "@/core/theme/required";
import { emptyList, linkKind, screenGroup } from "@/core/words";
import { PageHead } from "../parts/PageHead";
import { Req } from "../parts/Req";
import { KindTile } from "../parts/Tile";
import { Refs } from "./Refs";
import s from "./pages.module.css";

export function Screens({ vm, required }: { vm: PageVMs["screens"]; required: RequiredItem[] }) {
  return (
    <>
      <PageHead page="screens" />
      {vm.screens.length === 0 && (
        <Empty className={s.empty} image={Empty.PRESENTED_IMAGE_SIMPLE} description={<span className={s.emptyText}>{emptyList.screens}</span>} />
      )}
      <div className={s.grid2}>
        {vm.screens.map((sc) => (
          <Card key={sc.key} id={sc.key}
            title={<span className={s.panelHead}><KindTile kind="screen" /><Req required={required} id={requiredId.screen(sc.key)}>{sc.title}</Req></span>}>
            <div className={s.decisionBody}>
              {sc.stuckWordings.map((t, i) => <p key={i} className={s.stuckNote}><WarningFilled aria-hidden />{t}</p>)}
              {sc.fields.length > 0 && (
                <div className={s.group}>
                  <h4 className={s.groupTitle}>{screenGroup.fields}</h4>
                  <div className={s.tags}>{sc.fields.map((f) => <Tag key={f.name}>{f.label ?? f.name}{f.type ? ` · ${f.type}` : ""}</Tag>)}</div>
                </div>
              )}
              {sc.actions.length > 0 && (
                <div className={s.group}>
                  <h4 className={s.groupTitle}>{screenGroup.actions}</h4>
                  <div className={s.tags}>{sc.actions.map((a) => <Tag key={a.name} color="blue">{a.label ?? a.name}</Tag>)}</div>
                </div>
              )}
              {sc.states.length > 0 && (
                <div className={s.group}>
                  <h4 className={s.groupTitle}>{screenGroup.states}</h4>
                  <ul className={s.linkList}>{sc.states.map((st) => <li key={st.name}><strong>{st.name}</strong>{st.note ? ` · ${st.note}` : ""}</li>)}</ul>
                </div>
              )}
              {sc.shows.length > 0 && (
                <div className={s.group}>
                  <h4 className={s.groupTitle}>{linkKind.shows!.out}</h4>
                  <Refs refs={sc.shows} />
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
