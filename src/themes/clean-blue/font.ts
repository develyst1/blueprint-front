import localFont from "next/font/local";

// clean-blue's one family: Anuphan (Thai + Latin), friendly and geometric like the mood refs, and neither of the
// other themes' faces (mono: Noto Sans Thai · gold: Noto Sans Thai Looped + Noto Serif Thai). Applied on the theme
// root only — never html/body (SPEC-B-001 A-4).
// A local file, so the build needs no internet (REQ-123 round 2, SPEC-122): Google's own Anuphan, weight 400–700.
export const cleanBlueFont = localFont({
  src: "./fonts/anuphan.woff2",
  weight: "400 700",
  display: "swap",
});
