// clean-blue tokens — the direction in specs/SPEC-B-001-findings/TASK-B-008-design-findings.md § 1.
// One source: every colour, radius and size the theme uses is named here (Ant tokens + the CSS variables on the root).
import type { ThemeConfig } from "antd";
import type { PartKind } from "@/core/theme/contract";

export const color = {
  canvas: "#F2F5FA", // cool grey-blue page — never cream
  paper: "#FFFFFF",
  ink: "#18212F",
  ink2: "#4A5568", // secondary text, 7.4:1 on paper
  line: "#DCE3EE",
  lineStrong: "#B8C3D3",
  blue: "#1A5FD6", // the one blue: current page, links, the primary button — 5.05:1 on blueSoft, white on it 5.75:1
  blueSoft: "#E8F1FE",
  stuck: "#A44F08", // warm amber — only for what is stuck (readiness.stuckCount > 0) — 5.22:1 on stuckSoft
  stuckSoft: "#FFF4E5",
  neutralSoft: "#EEF1F5", // empty is not stuck (SPEC-B-001)
} as const;

// Five groups, not ten kinds (dataviz: fold past 8). Validated 2026-10-09 with the dataviz palette script, light mode:
// all checks pass, worst adjacent CVD ΔE 9.4 (re-run after the audit's contrast fixes: still all pass). Icons ≥ 3:1 on
// their own tile. A tile always carries its kind's icon and word, never colour alone.
export const group = {
  journey: { fg: "#1A5FD6", bg: "#E8F1FE" },
  interaction: { fg: "#00897B", bg: "#E3F6F3" },
  participant: { fg: "#8E44C9", bg: "#F3EAFB" },
  knowledge: { fg: "#5E8F00", bg: "#EEF6E0" },
  question: { fg: "#C2185B", bg: "#FCE8F0" },
} as const;

export const kindGroup: Record<PartKind, keyof typeof group> = {
  work: "journey",
  step: "journey",
  interaction: "interaction",
  role: "participant",
  screen: "participant",
  api: "participant",
  system: "participant",
  data: "knowledge",
  decision: "knowledge",
  question: "question",
};

export const radius = { card: 16, tile: 12, chip: 999 } as const;

/** Ant Design's tokens for this theme only (its own ConfigProvider, on the theme root). */
export function antTheme(fontFamily: string): ThemeConfig {
  return {
    token: {
      colorPrimary: color.blue,
      colorInfo: color.blue,
      colorError: color.stuck, // the only "error" this theme shows is stuck — warm, not alarm red
      colorWarning: color.stuck,
      colorText: color.ink,
      colorTextSecondary: color.ink2,
      colorTextTertiary: color.ink2,
      colorTextDescription: color.ink2,
      colorBorder: color.line,
      colorBorderSecondary: color.line,
      colorBgLayout: color.canvas,
      colorBgContainer: color.paper,
      colorLink: color.blue,
      fontFamily,
      fontSize: 16,
      fontSizeSM: 14,
      lineHeight: 1.6,
      borderRadius: radius.tile,
      borderRadiusLG: radius.card,
      boxShadowTertiary: "0 1px 2px rgba(24, 33, 47, 0.06)",
      motionDurationMid: "0.18s",
      controlHeightLG: 44, // every large control is a 44 px target (TASK-B-013 audit)
    },
    components: {
      Card: { headerFontSize: 18, bodyPadding: 20, headerPadding: 20 },
      Steps: { titleLineHeight: 26, descriptionMaxWidth: 220 },
      Table: { headerBg: color.paper, headerColor: color.ink, rowHoverBg: color.canvas, cellPaddingBlock: 12 },
      Tag: { defaultBg: color.neutralSoft, defaultColor: color.ink },
      Timeline: { tailColor: color.line, dotBg: color.paper },
      Collapse: { headerBg: color.paper, contentBg: color.paper },
      Slider: { handleSize: 18, handleSizeHover: 20, railSize: 6, controlSize: 18 },
    },
  };
}
