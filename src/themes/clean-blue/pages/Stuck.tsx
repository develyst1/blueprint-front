"use client";

// ติดอยู่ตรงไหน — one card per stuck item: the amber tile, the reason in words, a chip to the part it is about.
// A proposed answer can be long, so it opens on a click (Typography's ellipsis with the core's ดูรายละเอียด, AC-8).
import { Typography } from "antd";
import type { PageVMs, RequiredItem } from "@/core/theme/contract";
import { requiredId } from "@/core/theme/required";
import { proposedAnswer, showMore } from "@/core/words";
import { PageHead } from "../parts/PageHead";
import { Req } from "../parts/Req";
import { StuckTile } from "../parts/Tile";
import s from "./pages.module.css";

export function Stuck({ vm, required }: { vm: PageVMs["stuck"]; required: RequiredItem[] }) {
  return (
    <>
      <PageHead page="stuck" />
      <ul className={s.stuckList}>
        {vm.items.map((i) => (
          <li key={`${i.key}:${i.reason ?? i.kind}`} className={`${s.panel} ${s.stuckItem}`}>
            <StuckTile size="lg" />
            <div className={s.decisionBody}>
              <p className={s.stuckWording}><Req required={required} id={requiredId.stuck(i)}>{i.wording}</Req></p>
              <div className={s.stuckMeta}>
                <a href={i.target.href} className={s.linkTag}>{i.target.title}</a>
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
          </li>
        ))}
      </ul>
    </>
  );
}
