"use client";

// ติดอยู่ตรงไหน — one card per reason: the amber tile, the reason in words, then every part it is about as a link chip
// (REVIEW-A-004 row 17: items with one wording grouped, a narrower column, chips that read as links). Each item keeps
// its own required marker on the shared wording — one nested span per item, all around the same visible text.
// A proposed answer can be long, so it opens on a click (Typography's ellipsis with the core's ดูรายละเอียด, AC-8).
import { LinkOutlined } from "@ant-design/icons";
import { Typography } from "antd";
import type { ReactNode } from "react";
import type { PageVMs, RequiredItem, StuckItemVM } from "@/core/theme/contract";
import { findRequired, requiredId, requiredProps } from "@/core/theme/required";
import { proposedAnswer, showMore } from "@/core/words";
import { PageHead } from "../parts/PageHead";
import { StuckTile } from "../parts/Tile";
import s from "./pages.module.css";

/** The wording, wrapped once per item of the group, so every item's marker sits on visible text that holds its words. */
function Wording({ items, required }: { items: StuckItemVM[]; required: RequiredItem[] }) {
  return items.reduce<ReactNode>((inner, i) => {
    const item = findRequired(required, requiredId.stuck(i));
    return item ? <span {...requiredProps(item)}>{inner}</span> : inner;
  }, items[0]!.wording);
}

export function Stuck({ vm, required }: { vm: PageVMs["stuck"]; required: RequiredItem[] }) {
  const groups = new Map<string, StuckItemVM[]>();
  for (const i of vm.items) (groups.get(i.wording) ?? groups.set(i.wording, []).get(i.wording)!).push(i);
  return (
    <>
      <PageHead page="stuck" />
      <ul className={s.stuckList}>
        {[...groups.values()].map((items) => (
          <li key={items[0]!.wording} className={`${s.panel} ${s.stuckItem}`}>
            <StuckTile size="lg" />
            <div className={s.decisionBody}>
              <h3 className={s.stuckWording}><Wording items={items} required={required} /></h3>
              {items.map((i) => (
                <div key={`${i.key}:${i.reason ?? i.kind}`} className={s.group}>
                  <div className={s.stuckMeta}>
                    <a href={i.target.href} className={s.partLinkChip}><LinkOutlined aria-hidden />{i.target.title}</a>
                    {i.title !== i.target.title && <span className={s.muted}>{i.title}</span>}
                  </div>
                  {i.proposedAnswer && (
                    <div className={s.group}>
                      <h4 className={s.groupTitle}>{proposedAnswer}</h4>
                      <Typography.Paragraph className={s.answer} ellipsis={{ rows: 2, expandable: true, symbol: showMore }}>
                        {i.proposedAnswer}
                      </Typography.Paragraph>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
