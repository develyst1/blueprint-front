"use client";

// Icon tiles — the theme's signature piece (refs 1–4): a soft square of the kind's group colour holding its icon.
// A tile is never the only signal: the kind's word or the item's title always stands beside it.
import {
  ApartmentOutlined, ApiOutlined, AppstoreOutlined, BranchesOutlined, CheckCircleOutlined, CloudServerOutlined,
  DatabaseOutlined, DeploymentUnitOutlined, HistoryOutlined, MessageOutlined, MobileOutlined, NodeIndexOutlined,
  ProjectOutlined, QuestionCircleOutlined, SwapOutlined, TableOutlined, UserOutlined, WarningOutlined,
} from "@ant-design/icons";
import type { ComponentType } from "react";
import type { NavItemVM, PartKind } from "@/core/theme/contract";
import { kindGroup } from "../tokens";
import s from "./parts.module.css";

type Icon = ComponentType<{ "aria-hidden"?: boolean }>;

export const kindIcon: Record<PartKind, Icon> = {
  work: ProjectOutlined,
  step: NodeIndexOutlined,
  interaction: SwapOutlined,
  role: UserOutlined,
  screen: MobileOutlined,
  api: ApiOutlined,
  system: CloudServerOutlined,
  data: DatabaseOutlined,
  decision: BranchesOutlined,
  question: QuestionCircleOutlined,
};

export const pageIcon: Record<NavItemVM["page"], Icon> = {
  chat: MessageOutlined,
  overview: AppstoreOutlined,
  workOrder: TableOutlined,
  flowchart: ApartmentOutlined,
  sequence: SwapOutlined,
  screens: MobileOutlined,
  api: ApiOutlined,
  web: DeploymentUnitOutlined,
  stuck: WarningOutlined,
  history: HistoryOutlined,
  ready: CheckCircleOutlined,
};

type Size = "sm" | "md" | "lg";

/** A part kind's tile: its group colour + its icon. Decorative — the caller shows the word. */
export function KindTile({ kind, size = "md" }: { kind: PartKind; size?: Size }) {
  const Glyph = kindIcon[kind];
  return (
    <span className={`${s.tile} ${s[size]} ${s[kindGroup[kind]]}`} aria-hidden>
      <Glyph aria-hidden />
    </span>
  );
}

/** A page's tile (the page dock and page headings). `tone` = how it reads: current page, stuck, or plain. */
export function PageTile({ page, tone = "plain", size = "md" }: { page: NavItemVM["page"]; tone?: "plain" | "current" | "stuck"; size?: Size }) {
  const Glyph = pageIcon[page];
  return (
    <span className={`${s.tile} ${s[size]} ${s[`page_${tone}`]}`} aria-hidden>
      <Glyph aria-hidden />
    </span>
  );
}

export function StuckTile({ size = "md" }: { size?: Size }) {
  return (
    <span className={`${s.tile} ${s[size]} ${s.page_stuck}`} aria-hidden>
      <WarningOutlined aria-hidden />
    </span>
  );
}
