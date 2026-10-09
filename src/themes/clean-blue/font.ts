import { Anuphan } from "next/font/google";

// clean-blue's one family: Anuphan (Thai + Latin), friendly and geometric like the mood refs, and neither of the
// other themes' faces (mono: Noto Sans Thai · gold: Noto Sans Thai Looped + Noto Serif Thai). Applied on the theme
// root only — never html/body (SPEC-B-001 A-4).
export const cleanBlueFont = Anuphan({
  weight: ["400", "500", "600", "700"],
  subsets: ["thai", "latin"],
  display: "swap",
});
