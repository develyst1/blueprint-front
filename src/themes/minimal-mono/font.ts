import { Noto_Sans_Thai } from "next/font/google";

// minimal mono's one family. Its emphasis is weight, so it loads the weights the type scale uses:
// 400 body · 500 labels · 700 name and section headings · 800 step numerals.
// Applied on the theme root only (MonoRoot) — never on html/body, which keep the core's system Thai stack.
export const monoFont = Noto_Sans_Thai({
  subsets: ["thai", "latin"],
  weight: ["400", "500", "700", "800"],
  display: "swap",
  fallback: ["Sukhumvit Set", "Thonburi", "system-ui", "sans-serif"],
});
