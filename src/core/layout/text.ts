// A deterministic size estimate for a one-line label (no DOM), so layouts — and their overlap tests — run anywhere.
// It errs wide on purpose: a theme's real font must fit inside what the layout reserved.
//
// Advance per character, as a share of the font size (em):
//   Thai base letters, vowels, digits ............ 0.62
//   Thai marks above/below (U+0E31, U+0E34–0E3A, U+0E47–0E4E) — zero width: they stack on the letter before
//   Latin letters and digits ..................... 0.58 (0.68 for capitals)
//   space ........................................ 0.30
//   anything else (punctuation, symbols, others) . 0.62
// Height: 1.6 em — Thai needs room above and below for stacked marks.

const THAI_MARK = /[ัิ-ฺ็-๎]/;
const THAI = /[฀-๿]/;

function advance(ch: string): number {
  if (THAI_MARK.test(ch)) return 0;
  if (THAI.test(ch)) return 0.62;
  if (ch === " ") return 0.3;
  if (/[A-Z]/.test(ch)) return 0.68;
  if (/[a-z0-9]/.test(ch)) return 0.58;
  return 0.62;
}

export function estimateLabel(text: string, fontPx = 14): { w: number; h: number } {
  let em = 0;
  for (const ch of text) em += advance(ch);
  return { w: Math.ceil(em * fontPx), h: Math.ceil(1.6 * fontPx) };
}

// A flowchart condition is drawn on a plaque, not as bare text — the box the layout must keep clear is the plaque.
// Measured 2026-10-09 at 390 px in all three themes (TASK-B-010): luxury-gold's plaque is the widest — semibold text
// plus 2 × 10 px padding and a 1 px border, 26 px tall — and was up to 23 px wider than estimateLabel. So:
//   width  = estimateLabel × 1.05 (semibold) + 24 px (padding, border, 2 px slack)
//   height = estimateLabel + 4 px
const PLAQUE = { weight: 1.05, padX: 24, padY: 4 };

export function conditionBox(text: string, fontPx = 14): { w: number; h: number } {
  const t = estimateLabel(text, fontPx);
  return { w: Math.ceil(t.w * PLAQUE.weight) + PLAQUE.padX, h: t.h + PLAQUE.padY };
}
