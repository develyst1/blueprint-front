// Luxury gold design tokens (TASK-C-002 § 3), as typed names for SVG drawing. Colours live once, as CSS variables in
// theme.css; these are references to them, never copies (harness § 9). Drawn only inside the theme root.
import type { ParticipantKind } from "@/core/theme/contract";

export const color = {
  paper: "var(--lg-paper)",
  surface: "var(--lg-surface)",
  ink: "var(--lg-ink)",
  ink2: "var(--lg-ink-2)",
  goldInk: "var(--lg-gold-ink)",
  stuck: "var(--lg-stuck)",
  stuckTint: "var(--lg-stuck-tint)",
  onStuck: "var(--lg-on-stuck)",
  onNavy: "var(--accent-foreground)",
  navy: "var(--lg-navy)",
  goldLight: "var(--lg-gold-light)",
  edge: "var(--lg-edge)",
  cardEdge: "var(--lg-card-edge)",
  goldLine: "var(--lg-gold-line)",
} as const;

// Participant kinds: never told apart by colour alone — each has its own shape, and its legend word comes from
// @/core/words (participantKind). Palette validated with the dataviz validator, all pairs incl. stuck.
export type Kind = ParticipantKind;

export const kinds: Record<Kind, { shape: "circle" | "square" | "diamond" | "triangle"; color: string }> = {
  role: { shape: "circle", color: "var(--lg-k-role)" },
  screen: { shape: "square", color: "var(--lg-k-screen)" },
  api: { shape: "diamond", color: "var(--lg-k-api)" },
  system: { shape: "triangle", color: "var(--lg-k-system)" },
};

export const kindOrder: readonly Kind[] = ["role", "screen", "api", "system"];

export const radius = { plaque: 20, card: 14, pill: 999 } as const;

export const space = [4, 8, 12, 16, 24, 32, 48, 64] as const;

// Thai text is never below 14 px.
export const fontSize = { title: 40, titlePhone: 30, h2: 24, body: 16, label: 15, small: 14 } as const;

export const medallion = { r: 30, endRing: 2.5 } as const;
