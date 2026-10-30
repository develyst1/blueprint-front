import localFont from "next/font/local";

// minimal mono's one family. Its emphasis is weight, so it loads the weights the type scale uses:
// 400 body · 500 labels · 700 name and section headings · 800 step numerals.
// Applied on the theme root only (MonoRoot) — never on html/body, which keep the core's system Thai stack.
// A local file, so the build needs no internet (REQ-123 round 2, SPEC-122): Google's own Noto Sans Thai, weight 400–800.
export const monoFont = localFont({
  src: "./fonts/noto-sans-thai.woff2",
  weight: "400 800",
  display: "swap",
  fallback: ["Sukhumvit Set", "Thonburi", "system-ui", "sans-serif"],
});
